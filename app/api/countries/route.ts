import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  try {
    const response = await fetch("https://countriesnow.space/api/v0.1/countries", {
      next: { revalidate: 86400 }
    });
    if (!response.ok) throw new Error("Country directory unavailable");

    const result = await response.json();
    const countries = Array.isArray(result.data)
      ? result.data
          .map((item: { country?: unknown }) => item.country)
          .filter((country: unknown): country is string => typeof country === "string")
          .sort((first: string, second: string) => first.localeCompare(second))
      : [];

    return NextResponse.json({ countries, source: "CountriesNow" });
  } catch {
    return NextResponse.json({ error: "Country list is temporarily unavailable." }, { status: 502 });
  }
}