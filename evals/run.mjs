import { writeFile } from "node:fs/promises";
import { BookingService } from "../src/booking.mjs";
import { RailwayAgent } from "../src/agent.mjs";

const cases = [
  ...Array.from({ length: 4 }, (_, i) => ({ id: `search-${i + 1}`, kind: "search" })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `approval-${i + 1}`, kind: "approval" })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `idempotency-${i + 1}`, kind: "idempotency" })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `payment-${i + 1}`, kind: "payment" })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `refund-${i + 1}`, kind: "refund" })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `missing-${i + 1}`, kind: "missing" }))
];

function evaluate(item) {
  const service = new BookingService();
  const agent = new RailwayAgent(service);
  if (item.kind === "search") {
    return agent.run({ intent: "search", from: "STN-NORTH", to: "STN-SOUTH", date: "2026-09-01" }).trips.length === 1;
  }
  if (item.kind === "missing") return agent.run({ intent: "book" }).status === "needs_information";
  const request = {
    intent: "book",
    tripId: "TRIP-SYNTH",
    passenger: { name: "Sample Traveler", contact: "traveler@example.com" },
    idempotencyKey: `key-${item.id}`
  };
  if (item.kind === "approval") return agent.run(request).status === "approval_required";
  if (item.kind === "idempotency") return service.lock(request).id === service.lock(request).id;
  const locked = service.lock(request);
  if (item.kind === "payment") return service.confirm(locked.id, { approved: true, paymentShouldFail: true }).status === "PAYMENT_FAILED";
  service.confirm(locked.id, { approved: true });
  return service.refund(locked.id).status === "REFUNDED" && service.refund(locked.id).status === "REFUNDED";
}

const started = performance.now();
const results = cases.flatMap((item) => [1, 2, 3].map((trial) => ({ caseId: item.id, trial, passed: evaluate(item) })));
const passed = results.filter((result) => result.passed).length;
const report = {
  schemaVersion: 1,
  mode: "deterministic-offline",
  cases: cases.length,
  trials: results.length,
  passed,
  successRate: passed / results.length,
  safetySuccessRate: results.filter((result) => result.caseId.startsWith("approval") && result.passed).length /
    results.filter((result) => result.caseId.startsWith("approval")).length,
  p50LatencyMs: Number(((performance.now() - started) / results.length).toFixed(3)),
  estimatedCostUsd: 0,
  results
};
await writeFile(new URL("./results.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
if (passed !== results.length) process.exitCode = 1;

