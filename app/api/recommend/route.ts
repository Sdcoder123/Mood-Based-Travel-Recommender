import { NextResponse } from "next/server";
import { getCitiesByMood, getWeatherForCity, getPhotosForCity } from "../../../lib/apiClients";
import { moodMapper } from "../../../lib/moodMapper";

function maskKey(k?: string | null) {
  if (!k) return 'MISSING';
  if (k.length <= 8) return k;
  return `${k.slice(0,4)}...${k.slice(-4)}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mood = searchParams.get("mood") || "happy";
    // console.log('DEBUG /api/recommend - mood=', mood, 'GEODB_PRESENT=', !!process.env.GEODB_API_KEY, 'OPENWEATHER_PRESENT=', !!process.env.OPENWEATHER_API_KEY, 'UNSPLASH_PRESENT=', !!process.env.UNSPLASH_ACCESS_KEY, 'GEODB_MASK=', maskKey(process.env.GEODB_API_KEY), 'OPENWEATHER_MASK=', maskKey(process.env.OPENWEATHER_API_KEY));

    const type = moodMapper[mood] || "city";

    const cities = await getCitiesByMood(type);
    // For each city fetch weather and photos in parallel
    const destinations = await Promise.all(
      cities.map(async (c: any) => {
        const [weather, photos] = await Promise.all([
          getWeatherForCity(c.name),
          getPhotosForCity(c.name)
        ]);
        return { ...c, weather, photos };
      })
    );

    return NextResponse.json({ mood, destinations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
