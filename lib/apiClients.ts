// Server-side helpers for curated mood recommendations and optional weather/photo data.

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
    { id: 10, name: "Cape Town", country: "ZA" },
    { id: 11, name: "Panaji", country: "IN" },
    { id: 12, name: "Puri", country: "IN" },
    { id: 13, name: "Kochi", country: "IN" }
  ],
  mountain: [
    { id: 21, name: "Zermatt", country: "CH" },
    { id: 22, name: "Aspen", country: "US" },
    { id: 23, name: "Chamonix", country: "FR" },
    { id: 24, name: "Interlaken", country: "CH" },
    { id: 25, name: "Banff", country: "CA" },
    { id: 26, name: "Manali", country: "IN" },
    { id: 27, name: "Shimla", country: "IN" },
    { id: 28, name: "Darjeeling", country: "IN" }
  ],
  city: [
    { id: 41, name: "Tokyo", country: "JP" },
    { id: 42, name: "New York", country: "US" },
    { id: 43, name: "London", country: "GB" },
    { id: 44, name: "Paris", country: "FR" },
    { id: 45, name: "Mumbai", country: "IN" },
    { id: 46, name: "Jaipur", country: "IN" },
    { id: 47, name: "New Delhi", country: "IN" }
  ],
  adventure: [
    { id: 61, name: "Queenstown", country: "NZ" },
    { id: 62, name: "Moab", country: "US" },
    { id: 63, name: "Patagonia", country: "CL" },
    { id: 64, name: "Rishikesh", country: "IN" },
    { id: 65, name: "Leh", country: "IN" }
  ],
  nature: [
    { id: 81, name: "Reykjavik", country: "IS" },
    { id: 83, name: "Yosemite", country: "US" },
    { id: 84, name: "Munnar", country: "IN" },
    { id: 85, name: "Ooty", country: "IN" },
    { id: 86, name: "Shillong", country: "IN" }
  ]
};

const MOOD_COUNTRIES: Record<string, string[]> = {
  beach: ["India", "Indonesia", "Thailand", "Spain", "Mexico", "Australia", "Greece", "Philippines"],
  mountain: ["India", "Nepal", "Switzerland", "Canada", "Japan", "Austria", "New Zealand", "Chile"],
  city: ["India", "Japan", "United States", "United Kingdom", "France", "Italy", "Brazil", "South Korea"],
  adventure: ["India", "New Zealand", "Chile", "Nepal", "Australia", "Iceland", "United States", "South Africa"],
  nature: ["India", "Canada", "Brazil", "New Zealand", "Japan", "South Africa", "Norway", "Costa Rica"]
};

const CITY_CACHE_TTL = 6 * 60 * 60 * 1000;
const countryCityCache = new Map<string, { expiresAt: number; cities: string[] }>();
const pendingCountryCityRequests = new Map<string, Promise<string[]>>();

async function getCitiesForCountry(country: string): Promise<string[]> {
  const cached = countryCityCache.get(country);
  if (cached && cached.expiresAt > Date.now()) return cached.cities;

  const pending = pendingCountryCityRequests.get(country);
  if (pending) return pending;

  const request = fetch("https://countriesnow.space/api/v0.1/countries/population/cities/filter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country }),
    cache: "no-store"
  })
    .then(async (response) => {
      if (!response.ok) return [];
      const result = await response.json();
      const cities = Array.isArray(result.data)
        ? result.data
            .map((item: any) => ({
              name: typeof item.city === "string" ? item.city.split("(")[0].trim() : "",
              population: Array.isArray(item.populationCounts)
                ? Math.max(...item.populationCounts.map((count: any) => Number(count.value) || 0))
                : 0
            }))
            .filter((item: { name: string; population: number }) => item.name.length > 1 && item.population > 0)
            .sort((first: { population: number }, second: { population: number }) => second.population - first.population)
            .slice(0, 100)
            .map((item: { name: string }) => item.name)
        : [];
      if (cities.length) countryCityCache.set(country, { cities, expiresAt: Date.now() + CITY_CACHE_TTL });
      return cities;
    })
    .catch(() => [] as string[])
    .finally(() => pendingCountryCityRequests.delete(country));

  pendingCountryCityRequests.set(country, request);
  return request;
}

export async function getCitiesByMood(type: string, limit = 50, offset = 0, selectedCountry?: string): Promise<City[]> {
  const countries = MOOD_COUNTRIES[type] || MOOD_COUNTRIES.city;
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const moodOffset = [...type].reduce((total, character) => total + character.charCodeAt(0), 0);
  const start = (week + moodOffset) % countries.length;
  const activeCountries = selectedCountry
    ? [selectedCountry]
    : Array.from({ length: Math.min(5, countries.length) }, (_, index) => countries[(start + index) % countries.length]);
  const cityGroups = await Promise.all(activeCountries.map(async (country) => ({
    country,
    cities: (await getCitiesForCountry(country)).slice(0, 40)
  })));
  const candidates = cityGroups.flatMap(({ country, cities }) => {
    if (!cities.length) return [];
    const sampleCount = Math.min(selectedCountry ? 14 : 4, cities.length);
    const first = (week * 17 + moodOffset) % cities.length;
    const step = Math.max(1, Math.floor(cities.length / sampleCount));
    return Array.from({ length: sampleCount }, (_, index) => {
      const name = cities[(first + step * index) % cities.length];
      return { id: `${type}-${country}-${name}`, name, country };
    });
  });

  if (!candidates.length) {
    if (selectedCountry) return [];
    const fallback = LOCAL_FALLBACK[type] || LOCAL_FALLBACK.city;
    return fallback.slice(offset, offset + limit);
  }

  return candidates.slice(offset, offset + limit);
}

export async function getWeatherForCity(city: string, countryCode?: string) {
  try {
    const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodingUrl.searchParams.set("name", city);
    geocodingUrl.searchParams.set("count", "5");
    geocodingUrl.searchParams.set("language", "en");
    geocodingUrl.searchParams.set("format", "json");

    const geocodingResponse = await fetch(geocodingUrl, { next: { revalidate: 86400 } });
    if (!geocodingResponse.ok) return null;
    const geocoding = await geocodingResponse.json();
    const locations = geocoding.results || [];
    const location = countryCode
      ? locations.find((result: any) => result.country_code?.toUpperCase() === countryCode.toUpperCase() || result.country?.toLowerCase() === countryCode.toLowerCase()) || locations[0]
      : locations[0];
    if (!location) return null;

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.searchParams.set("latitude", String(location.latitude));
    forecastUrl.searchParams.set("longitude", String(location.longitude));
    forecastUrl.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m");
    forecastUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max");
    forecastUrl.searchParams.set("timezone", "auto");
    forecastUrl.searchParams.set("forecast_days", "7");

    const forecastResponse = await fetch(forecastUrl, { next: { revalidate: 1800 } });
    if (!forecastResponse.ok) return null;
    const forecast = await forecastResponse.json();
    const descriptions: Record<number, string> = {
      0: "clear sky", 1: "mostly clear", 2: "partly cloudy", 3: "overcast",
      45: "fog", 48: "fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
      61: "light rain", 63: "rain", 65: "heavy rain", 71: "light snow", 73: "snow",
      75: "heavy snow", 80: "rain showers", 81: "showers", 82: "heavy showers",
      95: "thunderstorms", 96: "thunderstorms", 99: "thunderstorms"
    };
    const current = forecast.current;
    const currentDescription = descriptions[current?.weather_code] || "mixed conditions";

    return {
      main: { temp: current?.temperature_2m, feels_like: current?.apparent_temperature },
      weather: current ? [{ description: currentDescription, code: current.weather_code }] : [],
      humidity: current?.relative_humidity_2m,
      wind: { speed: current?.wind_speed_10m },
      precipitation: current?.precipitation,
      forecast: {
        high: forecast.daily?.temperature_2m_max?.[0],
        low: forecast.daily?.temperature_2m_min?.[0],
        precipitationChance: forecast.daily?.precipitation_probability_max?.[0],
        days: (forecast.daily?.time || []).map((date: string, index: number) => ({
          date,
          high: forecast.daily.temperature_2m_max?.[index],
          low: forecast.daily.temperature_2m_min?.[index],
          precipitationChance: forecast.daily.precipitation_probability_max?.[index],
          code: forecast.daily.weather_code?.[index],
          windSpeedMax: forecast.daily.wind_speed_10m_max?.[index],
          description: descriptions[forecast.daily.weather_code?.[index]] || "mixed conditions"
        }))
      },
      coordinates: { latitude: location.latitude, longitude: location.longitude },
      population: location.population,
      source: "Open-Meteo"
    };
  } catch {
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
