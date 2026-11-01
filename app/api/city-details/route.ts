import { NextResponse } from 'next/server';
import { getCityDetails } from '@/lib/cityDetails';

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const city = url.searchParams.get('city');
    if (!city) return NextResponse.json({ error: 'city query required' }, { status: 400 });

    const latitude = Number(url.searchParams.get('latitude'));
    const longitude = Number(url.searchParams.get('longitude'));
    const hasCoordinates = url.searchParams.has('latitude') && url.searchParams.has('longitude');
    const coordinates = hasCoordinates ? {
      latitude,
      longitude,
      country: url.searchParams.get('country') || undefined,
      region: url.searchParams.get('region') || undefined
    } : undefined;

    const data = await getCityDetails(city, coordinates);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[api/city-details] error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
};
