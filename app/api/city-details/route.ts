import { NextResponse } from 'next/server';
import { getCityDetails } from '@/lib/cityDetails';

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const city = url.searchParams.get('city');
    if (!city) return NextResponse.json({ error: 'city query required' }, { status: 400 });

    console.log(`[api/city-details] GET city=${city}`);
    const data = await getCityDetails(city);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[api/city-details] error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
};
