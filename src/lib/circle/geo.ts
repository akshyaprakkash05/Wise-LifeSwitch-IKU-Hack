/**
 * City-level geography for the Circle map. Only cities are ever stored or shown,
 * never exact positions. The map is a simple equirectangular projection of the
 * UK-to-India corridor where most of our users' families are.
 */

export interface City {
  name: string;
  /** ISO 3166 region code, so the country name can be shown in any language. */
  iso: string;
  lat: number;
  lon: number;
  tz: string;
}

const CITIES: City[] = [
  { name: "London", iso: "GB", lat: 51.51, lon: -0.13, tz: "Europe/London" },
  { name: "Manchester", iso: "GB", lat: 53.48, lon: -2.24, tz: "Europe/London" },
  { name: "Birmingham", iso: "GB", lat: 52.49, lon: -1.89, tz: "Europe/London" },
  { name: "Edinburgh", iso: "GB", lat: 55.95, lon: -3.19, tz: "Europe/London" },
  { name: "Dublin", iso: "IE", lat: 53.35, lon: -6.26, tz: "Europe/Dublin" },
  { name: "Paris", iso: "FR", lat: 48.86, lon: 2.35, tz: "Europe/Paris" },
  { name: "Berlin", iso: "DE", lat: 52.52, lon: 13.4, tz: "Europe/Berlin" },
  { name: "Madrid", iso: "ES", lat: 40.42, lon: -3.7, tz: "Europe/Madrid" },
  { name: "Rome", iso: "IT", lat: 41.9, lon: 12.5, tz: "Europe/Rome" },
  { name: "Istanbul", iso: "TR", lat: 41.01, lon: 28.98, tz: "Europe/Istanbul" },
  { name: "Cairo", iso: "EG", lat: 30.04, lon: 31.24, tz: "Africa/Cairo" },
  { name: "Dubai", iso: "AE", lat: 25.2, lon: 55.27, tz: "Asia/Dubai" },
  { name: "Doha", iso: "QA", lat: 25.29, lon: 51.53, tz: "Asia/Qatar" },
  { name: "Riyadh", iso: "SA", lat: 24.71, lon: 46.68, tz: "Asia/Riyadh" },
  { name: "Karachi", iso: "PK", lat: 24.86, lon: 67.01, tz: "Asia/Karachi" },
  { name: "Delhi", iso: "IN", lat: 28.61, lon: 77.21, tz: "Asia/Kolkata" },
  { name: "New Delhi", iso: "IN", lat: 28.61, lon: 77.21, tz: "Asia/Kolkata" },
  { name: "Mumbai", iso: "IN", lat: 19.08, lon: 72.88, tz: "Asia/Kolkata" },
  { name: "Bengaluru", iso: "IN", lat: 12.97, lon: 77.59, tz: "Asia/Kolkata" },
  { name: "Bangalore", iso: "IN", lat: 12.97, lon: 77.59, tz: "Asia/Kolkata" },
  { name: "Hyderabad", iso: "IN", lat: 17.39, lon: 78.49, tz: "Asia/Kolkata" },
  { name: "Chennai", iso: "IN", lat: 13.08, lon: 80.27, tz: "Asia/Kolkata" },
  { name: "Coimbatore", iso: "IN", lat: 11.02, lon: 76.96, tz: "Asia/Kolkata" },
  { name: "Madurai", iso: "IN", lat: 9.93, lon: 78.12, tz: "Asia/Kolkata" },
  { name: "Kochi", iso: "IN", lat: 9.93, lon: 76.27, tz: "Asia/Kolkata" },
  { name: "Kolkata", iso: "IN", lat: 22.57, lon: 88.36, tz: "Asia/Kolkata" },
  { name: "Colombo", iso: "LK", lat: 6.93, lon: 79.86, tz: "Asia/Colombo" },
];

/** Find a city from a free-text place such as "Chennai, India". Unknown places return null (listed, not pinned). */
export function findCity(place: string | null | undefined): City | null {
  if (!place) return null;
  const first = place.split(",")[0].trim().toLowerCase();
  return CITIES.find((c) => c.name.toLowerCase() === first) ?? null;
}

/** Straight-line distance in kilometres. */
export function distanceKm(a: Pick<City, "lat" | "lon">, b: Pick<City, "lat" | "lon">): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---- Map drawing (1040 × 570 viewBox, longitude -12…92, latitude 4…61) ----

export const MAP_W = 1040;
export const MAP_H = 570;
export const px = (lon: number) => (lon + 12) * 10;
export const py = (lat: number) => (61 - lat) * 10;

/** True if a city falls inside the drawn area. */
export const onMap = (c: Pick<City, "lat" | "lon">) => c.lon >= -12 && c.lon <= 92 && c.lat >= 4 && c.lat <= 61;

type Ring = [number, number][];

const toPoints = (ring: Ring) => ring.map(([lon, lat]) => `${px(lon).toFixed(0)},${py(lat).toFixed(0)}`).join(" ");

/** Simplified coastlines: Europe to India, North Africa, Scandinavia, Britain, Ireland, Sri Lanka. */
const LAND: Ring[] = [
  [[-1.5,43.4],[-1.5,46],[-4.6,48],[-1.6,48.7],[1.5,50],[4,51.4],[5,53],[8.5,53.6],[8.6,55.5],[8.2,57],[10.5,57.7],[10.5,56],[12.5,55.5],[13,54.5],[14.3,53.9],[18,54.8],[21,55],[21.2,57],[23.5,57.2],[24.3,58.4],[23.5,59.2],[28,59.5],[30,61],[92,61],[92,22],[88.5,21.8],[87,21.5],[85,19.5],[82.3,17],[80,15.5],[80.3,13.4],[79.3,10.3],[78.2,9],[77.5,8.1],[76.3,9.5],[75,12],[74,14.5],[73,18],[72.6,21],[70,22.5],[68,23.7],[66.5,25.4],[61.5,25.2],[57,25.5],[56.3,26.2],[59.8,22.5],[57,19],[52,16],[45,12.8],[43,13],[39,22],[35,28],[34.5,29.5],[34.3,31.2],[35,32.8],[35.9,35],[36,36.8],[32,36.2],[30,36.3],[27.3,37],[26.3,38.5],[26.6,40.2],[26,40.9],[23.7,40.2],[24,38],[22.5,36.5],[21.2,37.8],[20,39.5],[19.5,41.8],[15.5,45],[13.6,45.7],[12.3,44.5],[14,42.5],[16,41.5],[18.5,40.2],[16.6,38.9],[15.6,38],[15.8,40],[12.5,41.8],[10.3,43.5],[8.8,44.4],[7.5,43.8],[3.5,43.3],[3,42],[0.5,40.5],[-0.3,39.5],[0,38.7],[-2,36.8],[-6,36.2],[-9,37],[-9.5,43],[-8,43.7]],
  [[-12,28],[-10,29.5],[-9.7,30.6],[-6.8,34],[-5.9,35.8],[-2,35.1],[3,36.8],[10,37.2],[11,35.6],[10,34],[11.5,33.1],[15.3,32.2],[20,30.9],[20,32.6],[23,32.6],[25,31.6],[29,30.9],[32.5,31.2],[34.2,31.3],[32.5,29.9],[34,26.5],[37,21],[39,15.5],[43.3,12.4],[44,10.5],[51,11.8],[51,10.4],[48,4],[-12,4]],
  [[5,61],[5.5,58.5],[7,58],[10.8,59],[11.8,58.2],[12.5,56.3],[14.2,55.4],[16,56.2],[16.6,57.6],[18.6,59.4],[19,61]],
  [[-5.7,50],[-3,50.6],[1.5,51.2],[1.7,52.8],[0,53.5],[-0.5,54.5],[-1.6,55.6],[-2,57.6],[-3,58.6],[-5,58.6],[-5.6,57],[-6.2,56],[-4.8,54.8],[-3.2,54.2],[-3,53.4],[-4.5,53.2],[-4.6,52.2],[-5.2,51.7],[-3.2,51.4]],
  [[-6,52],[-6.2,53.8],[-5.6,55.2],[-8,55.2],[-10,54.2],[-10.2,51.8],[-8,51.5]],
  [[79.8,6],[81.8,7],[81,9.5],[80,9.7]],
];

/** Inland seas cut out of the land: Black Sea, Caspian Sea, Persian Gulf. */
const WATER: Ring[] = [
  [[28,41.5],[28,43.5],[29.6,45.2],[33,46],[35,45.2],[37.5,47],[39.5,47],[38,44.5],[41.5,41.5],[36,41.5],[31,41.2]],
  [[47,44],[49.5,46.5],[53,46.8],[53,44],[51.5,41],[53.8,37.5],[50.5,37],[49,38.5],[49.5,41],[47.5,42.5]],
  [[48,30],[50.5,29],[51.5,27.8],[54,26.8],[56.3,26.2],[56.5,25],[54,24.2],[51.5,24.2],[50.5,25.5],[49,27],[48,29]],
];

export const LAND_POINTS = LAND.map(toPoints);
export const WATER_POINTS = WATER.map(toPoints);
