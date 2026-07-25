import { RailwayAgent } from "./agent.mjs";
import { BookingService } from "./booking.mjs";

const agent = new RailwayAgent(new BookingService());
const search = agent.run({ intent: "search", from: "STN-NORTH", to: "STN-SOUTH", date: "2026-09-01" });
console.log(JSON.stringify(search, null, 2));
const request = {
  intent: "book",
  tripId: search.trips[0].id,
  passenger: { name: "Sample Traveler", contact: "traveler@example.com" },
  idempotencyKey: "demo-request-001"
};
console.log(JSON.stringify(agent.run(request), null, 2));
console.log(JSON.stringify(agent.run({ ...request, approved: true }), null, 2));

