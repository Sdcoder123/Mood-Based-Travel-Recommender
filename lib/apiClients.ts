// Server-side helpers to call external APIs. Implements GeoDB city lookup with pagination
// and falls back to local samples when unavailable.

export type City = { id: string | number; name: string; country?: string };

const LOCAL_FALLBACK: Record<string, City[]> = {
  beach: [
    { id: 1, name: "Barcelona", country: "ES" },
    { id: 2, name: "Bali", country: "ID" },
    { id: 3, name: "Phuket", country: "TH" },
    { id: 4, name: "Maldives", country: "MV" },
    { id: 5, name: "Nice", country: "FR" },
    { id: 6, name: "Santorini", country: "GR" },
    { id: 7, name: "Cancun", country: "MX" },
    { id: 8, name: "Maui", country: "US" },
    { id: 9, name: "Gold Coast", country: "AU" },
    { id: 10, name: "Cape Town", country: "ZA" }
  ],
  mountain: [
    { id: 21, name: "Zermatt", country: "CH" },
    { id: 22, name: "Aspen", country: "US" },
    { id: 23, name: "Chamonix", country: "FR" },
    { id: 24, name: "Interlaken", country: "CH" },
    { id: 25, name: "Banff", country: "CA" }
  ],
  city: [
    { id: 41, name: "Tokyo", country: "JP" },
    { id: 42, name: "New York", country: "US" },
    { id: 43, name: "London", country: "GB" },
    { id: 44, name: "Paris", country: "FR" }
  ],
  adventure: [
    { id: 61, name: "Queenstown", country: "NZ" },
    { id: 62, name: "Moab", country: "US" },
    { id: 63, name: "Patagonia", country: "CL" }
  ],
  nature: [
    { id: 81, name: "Reykjavik", country: "IS" },
    { id: 83, name: "Yosemite", country: "US" }
  ]
};

export async function getCitiesByMood(type: string, limit = 50, offset = 0): Promise<City[]> {
  const apiKey = process.env.GEODB_API_KEY;
  const host = "wft-geo-db.p.rapidapi.com";
  const keyword = encodeURIComponent(type);

  if (!apiKey) {
    const list = LOCAL_FALLBACK[type] || LOCAL_FALLBACK.city;
    return list.slice(offset, offset + limit);
  }

  try {
    const url = `https://${host}/v1/geo/cities?limit=${limit}&offset=${offset}&sort=-population&namePrefix=${keyword}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": host
      }
    });

    if (!res.ok) {
      console.warn('GeoDB lookup failed', res.status);
      const list = LOCAL_FALLBACK[type] || LOCAL_FALLBACK.city;
      return list.slice(offset, offset + limit);
    }

    const json = await res.json();
    const data = (json?.data || []) as any[];
    if (data.length === 0) {
      const list = LOCAL_FALLBACK[type] || LOCAL_FALLBACK.city;
      return list.slice(offset, offset + limit);
    }

    return data.map((item) => ({ id: item.id || item.city, name: item.city || item.name, country: item.countryCode || item.country }));
  } catch (err) {
    console.warn('GeoDB fetch error', err);
    const list = LOCAL_FALLBACK[type] || LOCAL_FALLBACK.city;
    return list.slice(offset, offset + limit);
  }
}

export async function getWeatherForCity(city: string) {
  try {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) return null;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${key}`;
    const res = await fetch(url);
    return res.ok ? res.json() : null;
  } catch (err) {
    return null;
  }
}

export async function getPhotosForCity(city: string) {
  try {
    const key = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    if (key) {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(city)}&per_page=6&orientation=landscape&client_id=${key}`;
      const response = await fetch(url);
      if (response.ok) return response.json();
    }

    const commonsUrl = new URL("https://commons.wikimedia.org/w/api.php");
    commonsUrl.searchParams.set("action", "query");
    commonsUrl.searchParams.set("generator", "search");
    commonsUrl.searchParams.set("gsrsearch", `${city} city landscape`);
    commonsUrl.searchParams.set("gsrnamespace", "6");
    commonsUrl.searchParams.set("gsrlimit", "6");
    commonsUrl.searchParams.set("prop", "imageinfo");
    commonsUrl.searchParams.set("iiprop", "url|extmetadata");
    commonsUrl.searchParams.set("iiurlwidth", "1000");
    commonsUrl.searchParams.set("format", "json");

    const response = await fetch(commonsUrl, {
      headers: { "User-Agent": "MoodBasedTravelRecommender/1.0 (destination photo lookup)" },
      next: { revalidate: 86400 }
    });
    if (!response.ok) return null;

    const json = await response.json();
    const pages = Object.values(json?.query?.pages || {}) as any[];
    const results = pages.flatMap((page) => {
      const image = page.imageinfo?.[0];
      if (!image?.thumburl) return [];
      const metadata = image.extmetadata || {};
      const attribution = (metadata.Artist?.value || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();
      return [{
        urls: { regular: image.thumburl, small: image.thumburl },
        attribution,
        license: metadata.LicenseShortName?.value || "Open license",
        sourceUrl: `https://commons.wikimedia.org/?curid=${page.pageid}`
      }];
    });

    return results.length ? { results, source: "Wikimedia Commons" } : null;
  } catch (err) {
    return null;
  }
}
