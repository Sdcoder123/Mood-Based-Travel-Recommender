import { NextResponse } from "next/server";

function maskKey(k?: string | null) {
  if (!k) return 'MISSING';
  if (k.length <= 8) return k;
  return `${k.slice(0,4)}...${k.slice(-4)}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  // console.log('DEBUG /api/photos - q=', query, 'UNSPLASH_PRESENT=', !!process.env.UNSPLASH_ACCESS_KEY, 'NEXT_PUBLIC_UNSPLASH=', !!process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY, 'UNSPLASH_MASK=', maskKey(process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY));

  if (!query) return NextResponse.json({ error: "q required" }, { status: 400 });

  const key = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) return NextResponse.json({ error: "Unsplash key not configured" }, { status: 500 });

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape&client_id=${key}`;
  const resp = await fetch(url);
  const json = await resp.json();
  return NextResponse.json(json);
}
