import { createHash } from "node:crypto";
import { searchTrips } from "./catalog.mjs";

export class BookingService {
  #bookings = new Map();
  #idempotency = new Map();

  search(query) {
    return searchTrips(query);
  }

  lock({ tripId, passenger, idempotencyKey }) {
    if (!idempotencyKey) throw new Error("idempotency key is required");
    if (this.#idempotency.has(idempotencyKey)) return structuredClone(this.#idempotency.get(idempotencyKey));
    if (!passenger?.name || !passenger?.contact) throw new Error("passenger name and contact are required");
    const id = `BOOK-${createHash("sha256").update(`${tripId}:${idempotencyKey}`).digest("hex").slice(0, 10)}`;
    const booking = { id, tripId, passenger: { ...passenger }, status: "LOCKED", paymentReference: null };
    this.#bookings.set(id, booking);
    this.#idempotency.set(idempotencyKey, booking);
    return structuredClone(booking);
  }

  confirm(id, { approved, paymentShouldFail = false } = {}) {
    const booking = this.#bookings.get(id);
    if (!booking) throw new Error("booking not found");
    if (booking.status === "CONFIRMED") return structuredClone(booking);
    if (booking.status !== "LOCKED") throw new Error(`cannot confirm booking in ${booking.status}`);
    if (!approved) return { ...structuredClone(booking), status: "APPROVAL_REQUIRED" };
    if (paymentShouldFail) {
      booking.status = "PAYMENT_FAILED";
      booking.paymentReference = null;
      return structuredClone(booking);
    }
    booking.status = "CONFIRMED";
    booking.paymentReference = `PAY-SYNTH-${id.slice(-6)}`;
    return structuredClone(booking);
  }

  refund(id) {
    const booking = this.#bookings.get(id);
    if (!booking) throw new Error("booking not found");
    if (booking.status === "REFUNDED") return structuredClone(booking);
    if (booking.status !== "CONFIRMED") throw new Error(`cannot refund booking in ${booking.status}`);
    booking.status = "REFUNDED";
    return structuredClone(booking);
  }
}

