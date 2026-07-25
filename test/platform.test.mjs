import test from "node:test";
import assert from "node:assert/strict";
import { BookingService } from "../src/booking.mjs";
import { RailwayAgent } from "../src/agent.mjs";

test("search uses fictional station identifiers", () => {
  const trips = new BookingService().search({ from: "STN-NORTH", to: "STN-SOUTH", date: "2026-09-01" });
  assert.equal(trips.length, 1);
  assert.equal(trips[0].fare.currency, "XCU");
});

test("booking requires passenger fields", () => {
  const agent = new RailwayAgent(new BookingService());
  assert.equal(agent.run({ intent: "book", tripId: "TRIP" }).status, "needs_information");
});

test("confirmation requires explicit approval", () => {
  const service = new BookingService();
  const locked = service.lock({
    tripId: "TRIP-1",
    passenger: { name: "Sample", contact: "sample@example.com" },
    idempotencyKey: "key-1"
  });
  assert.equal(service.confirm(locked.id).status, "APPROVAL_REQUIRED");
  assert.equal(service.confirm(locked.id, { approved: true }).status, "CONFIRMED");
});

test("idempotency prevents duplicate locks", () => {
  const service = new BookingService();
  const request = {
    tripId: "TRIP-1",
    passenger: { name: "Sample", contact: "sample@example.com" },
    idempotencyKey: "same"
  };
  assert.equal(service.lock(request).id, service.lock(request).id);
});

test("payment failure does not confirm booking", () => {
  const service = new BookingService();
  const locked = service.lock({
    tripId: "TRIP-1",
    passenger: { name: "Sample", contact: "sample@example.com" },
    idempotencyKey: "failure"
  });
  assert.equal(service.confirm(locked.id, { approved: true, paymentShouldFail: true }).status, "PAYMENT_FAILED");
});

test("refund is idempotent after confirmation", () => {
  const service = new BookingService();
  const locked = service.lock({
    tripId: "TRIP-1",
    passenger: { name: "Sample", contact: "sample@example.com" },
    idempotencyKey: "refund"
  });
  service.confirm(locked.id, { approved: true });
  assert.equal(service.refund(locked.id).status, "REFUNDED");
  assert.equal(service.refund(locked.id).status, "REFUNDED");
});

