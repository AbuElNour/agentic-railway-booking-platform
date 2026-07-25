export const stations = Object.freeze([
  { id: "STN-NORTH", name: { en: "North Harbor", ar: "ميناء الشمال" } },
  { id: "STN-CENTRAL", name: { en: "Central Park", ar: "المحطة المركزية" } },
  { id: "STN-SOUTH", name: { en: "South Gardens", ar: "حدائق الجنوب" } }
]);

export function searchTrips({ from, to, date }) {
  if (from === to) return [];
  if (!stations.some((station) => station.id === from) || !stations.some((station) => station.id === to)) return [];
  return [
    {
      id: `TRIP-${date.replaceAll("-", "")}-01`,
      from,
      to,
      date,
      departure: "09:30",
      durationMinutes: 95,
      fare: { amount: 2450, currency: "XCU", scale: 2 }
    }
  ];
}

