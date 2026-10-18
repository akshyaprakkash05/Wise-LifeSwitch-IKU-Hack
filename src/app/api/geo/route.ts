import { NextResponse } from "next/server";

// GET /api/geo?lat=51.5&lng=-0.12 -> { place: "London, United Kingdom" }
// Turns the phone's coordinates into a city name. Coordinates are not stored.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat"));
  const lng = Number(q.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "bad_request", message: "Invalid location." }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) },
    );
    const j = (await res.json()) as { city?: string; locality?: string; countryName?: string; countryCode?: string };
    const city = j.city || j.locality;
    // Short country names ("United Kingdom", not the full official name)
    const country = j.countryCode ? new Intl.DisplayNames(["en"], { type: "region" }).of(j.countryCode) : j.countryName;
    const place = [city, country].filter(Boolean).join(", ");
    return NextResponse.json({ place: place || "an unknown place" });
  } catch {
    return NextResponse.json({ error: "upstream", message: "Couldn't look up your city." }, { status: 502 });
  }
}
