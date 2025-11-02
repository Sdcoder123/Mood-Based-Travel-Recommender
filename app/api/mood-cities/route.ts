import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mood = url.searchParams.get("mood") || "city";
  const limit = Number(url.searchParams.get("limit") || "12");
  const offset = Number(url.searchParams.get("offset") || "0");

  const GEODB_KEY = process.env.GEODB_API_KEY;
  const HOST = "wft-geo-db.p.rapidapi.com";

  // mood -> GeoDB query options
  const moodOpts: Record<string, { countryIds?: string[]; minPopulation?: number }> = {
    beach: { countryIds: ["ES", "ID", "TH", "MV", "MX", "AU", "BR", "PH", "GR", "US"], minPopulation: 20000 },
    mountain: { countryIds: ["CH", "US", "CA", "NZ", "AT", "JP", "NP"], minPopulation: 2000 },
    city: { minPopulation: 100000 },
    adventure: { countryIds: ["NZ", "CL", "IS", "NP", "US"], minPopulation: 1000 },
    nature: { countryIds: ["IS", "CA", "BR", "ZA", "HR"], minPopulation: 2000 }
  };

  const opts = moodOpts[mood] || {};

  if (!GEODB_KEY) {
    return NextResponse.json({ error: "GEODB_API_KEY not configured on server" }, { status: 500 });
  }

  try {
    let apiUrl = `https://${HOST}/v1/geo/cities?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}&sort=-population`;
    if (opts.minPopulation) apiUrl += `&minPopulation=${encodeURIComponent(String(opts.minPopulation))}`;
    if (opts.countryIds && opts.countryIds.length) apiUrl += `&countryIds=${encodeURIComponent(opts.countryIds.join(","))}`;

    const res = await fetch(apiUrl, {
      headers: {
        "X-RapidAPI-Key": GEODB_KEY,
        "X-RapidAPI-Host": HOST
      }
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn("GeoDB failed", res.status, text);
      return NextResponse.json({ error: "GeoDB lookup failed", details: text }, { status: res.status });
    }

    const json = JSON.parse(text || "{}");
    const data = (json?.data || []) as any[];
    const mapped = data.map((item) => ({ id: item.id, name: item.city || item.name, country: item.countryCode || item.country }));
    return NextResponse.json({ mood, count: mapped.length, cities: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
