export class RailwayAgent {
  constructor(service) {
    this.service = service;
  }

  run(request) {
    const trace = [{ step: "intent.detected", intent: request.intent }];
    if (request.intent === "search") {
      const trips = this.service.search(request);
      trace.push({ step: "tool.search", count: trips.length });
      return { status: "completed", trips, trace };
    }
    if (request.intent === "book") {
      if (!request.tripId || !request.passenger) {
        return { status: "needs_information", missing: ["tripId", "passenger"].filter((field) => !request[field]), trace };
      }
      const locked = this.service.lock(request);
      trace.push({ step: "booking.locked", bookingId: locked.id });
      const confirmed = this.service.confirm(locked.id, { approved: request.approved, paymentShouldFail: request.paymentShouldFail });
      trace.push({ step: "booking.confirmation", status: confirmed.status });
      return { status: confirmed.status === "CONFIRMED" ? "completed" : confirmed.status.toLowerCase(), booking: confirmed, trace };
    }
    return { status: "unsupported", trace };
  }
}

