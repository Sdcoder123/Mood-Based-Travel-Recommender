import { NextResponse } from "next/server";
import { getCitiesByMood } from "@/lib/apiClients";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mood = url.searchParams.get("mood") || "city";
  const limitValue = Number(url.searchParams.get("limit") || "12");
  const offsetValue = Number(url.searchParams.get("offset") || "0");
  const limit = Number.isFinite(limitValue) ? Math.min(50, Math.max(1, Math.floor(limitValue))) : 12;
  const offset = Number.isFinite(offsetValue) ? Math.max(0, Math.floor(offsetValue)) : 0;

  try {
    const cities = await getCitiesByMood(mood, limit, offset);
    return NextResponse.json({ mood, count: cities.length, cities, source: "Curated mood destinations" });
  } catch {
    return NextResponse.json({ error: "Could not load destinations for this mood." }, { status: 500 });
  }
}
