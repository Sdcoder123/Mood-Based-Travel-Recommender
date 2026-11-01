import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = (url.searchParams.get("search") || url.searchParams.get("name") || url.searchParams.get("namePrefix") || "").trim();
  const limitValue = Number(url.searchParams.get("limit") || "8");
  const limit = Number.isFinite(limitValue) ? Math.min(10, Math.max(1, Math.floor(limitValue))) : 8;

  if (name.length < 2) return NextResponse.json({ cities: [] });

  try {
    const apiUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    apiUrl.searchParams.set("name", name.slice(0, 80));
    apiUrl.searchParams.set("count", String(limit));
    apiUrl.searchParams.set("language", "en");
    apiUrl.searchParams.set("format", "json");

    const response = await fetch(apiUrl, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: "City search is temporarily unavailable." }, { status: 502 });

    const result = await response.json();
    const cities = (result.results || []).map((city: any) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      countryCode: city.country_code,
      region: city.admin1,
      latitude: city.latitude,
      longitude: city.longitude,
      population: city.population,
      timezone: city.timezone
    }));

    return NextResponse.json({ cities, source: "Open-Meteo" });
  } catch {
    return NextResponse.json({ error: "City search is temporarily unavailable." }, { status: 502 });
  }
}
