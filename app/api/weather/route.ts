import { NextResponse } from "next/server";

function maskKey(k?: string | null) {
  if (!k) return 'MISSING';
  if (k.length <= 8) return k;
  return `${k.slice(0,4)}...${k.slice(-4)}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  // console.log('DEBUG /api/weather - q=', q, 'OPENWEATHER_PRESENT=', !!process.env.OPENWEATHER_API_KEY, 'OPENWEATHER_MASK=', maskKey(process.env.OPENWEATHER_API_KEY));

  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });

  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return NextResponse.json({ error: "OpenWeather API key not configured" }, { status: 500 });

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${key}`;
  const resp = await fetch(url);
  const json = await resp.json();
  return NextResponse.json(json);
}
