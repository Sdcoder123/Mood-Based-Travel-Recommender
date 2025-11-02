import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const namePrefix = url.searchParams.get("namePrefix") || "ban"; // example default

  const apiKey = process.env.GEODB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEODB_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(namePrefix)}&limit=10`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "GeoDB fetch failed", details: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
