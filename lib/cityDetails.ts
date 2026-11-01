const weatherDescriptions: Record<number, string> = {
  0: "clear sky",
  1: "mostly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "rime fog",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "showers",
  82: "heavy showers",
  95: "thunderstorms",
  96: "thunderstorms with hail",
  99: "thunderstorms with heavy hail"
};

export const getCityDetails = async (city: string) => {
  const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodingUrl.searchParams.set("name", city);
  geocodingUrl.searchParams.set("count", "1");
  geocodingUrl.searchParams.set("language", "en");
  geocodingUrl.searchParams.set("format", "json");

  const geocodingResponse = await fetch(geocodingUrl, { next: { revalidate: 3600 } });
  if (!geocodingResponse.ok) throw new Error("Could not look up this destination right now.");

  const geocoding = await geocodingResponse.json();
  const location = geocoding.results?.[0];
  if (!location) throw new Error(`No location found for ${city}.`);

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(location.latitude));
  forecastUrl.searchParams.set("longitude", String(location.longitude));
  forecastUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m");
  forecastUrl.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max");
  forecastUrl.searchParams.set("timezone", "auto");
  forecastUrl.searchParams.set("forecast_days", "7");

  const forecastResponse = await fetch(forecastUrl, { next: { revalidate: 1800 } });
  if (!forecastResponse.ok) throw new Error("Could not load the destination forecast right now.");

  const forecast = await forecastResponse.json();
  const current = forecast.current;
  const daily = forecast.daily;
  const todayCode = daily?.weather_code?.[0] ?? current?.weather_code;
  const maxUv = daily?.uv_index_max?.[0];
  const rainChance = daily?.precipitation_probability_max?.[0];
  const insights = [
    current ? `Currently ${Math.round(current.temperature_2m)}°C and ${weatherDescriptions[current.weather_code] || "changeable"}.` : null,
    typeof rainChance === "number" ? `${rainChance}% chance of precipitation today.` : null,
    typeof maxUv === "number" ? maxUv >= 8 ? "Very high UV: plan shade and sun protection." : maxUv >= 6 ? "High UV: pack sun protection for longer outings." : null : null
  ].filter(Boolean);

  return {
    city: location.name,
    country: location.country,
    region: location.admin1,
    coordinates: { latitude: location.latitude, longitude: location.longitude },
    timezone: forecast.timezone,
    current: current ? {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      windSpeed: current.wind_speed_10m,
      isDay: Boolean(current.is_day),
      code: current.weather_code,
      description: weatherDescriptions[current.weather_code] || "mixed conditions"
    } : null,
    today: daily ? {
      date: daily.time?.[0],
      high: daily.temperature_2m_max?.[0],
      low: daily.temperature_2m_min?.[0],
      precipitationChance: rainChance,
      sunrise: daily.sunrise?.[0],
      sunset: daily.sunset?.[0],
      uvIndex: maxUv,
      windSpeedMax: daily.wind_speed_10m_max?.[0],
      description: weatherDescriptions[todayCode] || "mixed conditions"
    } : null,
    forecast: (daily?.time || []).map((date: string, index: number) => ({
      date,
      high: daily.temperature_2m_max?.[index],
      low: daily.temperature_2m_min?.[index],
      precipitationChance: daily.precipitation_probability_max?.[index],
      uvIndex: daily.uv_index_max?.[index],
      code: daily.weather_code?.[index],
      description: weatherDescriptions[daily.weather_code?.[index]] || "mixed conditions"
    })),
    insights,
    source: "Open-Meteo",
    updatedAt: current?.time
  };
};
