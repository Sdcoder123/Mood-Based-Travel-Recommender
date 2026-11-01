import { NextResponse } from "next/server";
import { getCitiesByMood, getWeatherForCity, getPhotosForCity } from "../../../lib/apiClients";
import { moodMapper } from "../../../lib/moodMapper";

const moodWeatherProfiles: Record<string, { idealTemperature: number; focus: string }> = {
  happy: { idealTemperature: 26, focus: "warm, bright weather for an uplifting escape" },
  tired: { idealTemperature: 18, focus: "mild, comfortable conditions for an easy-paced escape" },
  sad: { idealTemperature: 21, focus: "gentle temperatures and a brighter change of scene" },
  excited: { idealTemperature: 22, focus: "comfortable conditions for active exploring" },
  stressed: { idealTemperature: 20, focus: "calmer, comfortable weather for slowing down" }
};

function scoreWeatherForMood(mood: string, weather: any) {
  const profile = moodWeatherProfiles[mood];
  const forecastDays = Array.isArray(weather?.forecast?.days) ? weather.forecast.days : [];
  const candidates = forecastDays.length
    ? forecastDays.map((day: any) => ({
        date: day.date,
        temperature: (day.high + day.low) / 2,
        high: day.high,
        low: day.low,
        precipitationChance: day.precipitationChance,
        code: day.code,
        windSpeed: day.windSpeedMax,
        description: day.description
      }))
    : [{
        date: null,
        temperature: weather?.main?.temp,
        high: weather?.forecast?.high,
        low: weather?.forecast?.low,
        precipitationChance: weather?.forecast?.precipitationChance,
        code: weather?.weather?.[0]?.code,
        windSpeed: weather?.wind?.speed,
        description: weather?.weather?.[0]?.description
      }];

  if (!profile || typeof candidates[0]?.temperature !== "number") {
    return { fitScore: null, fitLabel: "Weather unavailable", fitReason: "Mood fit can't be estimated until a local forecast is available." };
  }

  const scoredDays = candidates.map((day: any) => {
    const temperatureScore = Math.max(0, 35 - Math.abs(day.temperature - profile.idealTemperature) * 2.5);
    const weatherScore = typeof day.code !== "number" ? 15 : day.code <= 2 ? 25 : day.code <= 3 || day.code === 45 || day.code === 48 ? 18 : day.code >= 95 ? 0 : 6;
    const rainScore = typeof day.precipitationChance === "number" ? 35 * (1 - day.precipitationChance / 100) : 20;
    const windScore = typeof day.windSpeed === "number" ? Math.max(0, 5 - Math.max(0, day.windSpeed - 12) * 0.2) : 3;
    return { ...day, score: Math.round(temperatureScore + weatherScore + rainScore + windScore) };
  });
  const bestDay = scoredDays.sort((first: any, second: any) => second.score - first.score)[0];
  const fitScore = bestDay.score;
  const temperature = bestDay.temperature;
  const precipitationChance = bestDay.precipitationChance;
  const description = bestDay.description || "mixed conditions";
  const dateLabel = bestDay.date
    ? new Date(`${bestDay.date}T12:00:00Z`).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })
    : "The upcoming forecast";
  const rainDescription = typeof precipitationChance === "number"
    ? `${precipitationChance}% chance of rain`
    : "rain chance unavailable";

  return {
    fitScore,
    fitLabel: fitScore >= 85 ? "Strong mood match" : fitScore >= 65 ? "Good mood match" : "Weather trade-off",
    fitReason: `${dateLabel}: ${description}, ${Math.round(bestDay.low ?? temperature)}°–${Math.round(bestDay.high ?? temperature)}°C and ${rainDescription}; ${profile.focus}.`,
    bestDay: bestDay.date ? {
      date: bestDay.date,
      description,
      high: bestDay.high,
      low: bestDay.low,
      precipitationChance,
      fitScore
    } : null
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mood = searchParams.get("mood") || "happy";
    const country = searchParams.get("country")?.trim() || undefined;

    const type = moodMapper[mood] || "city";

    const cities = await getCitiesByMood(type, 20, 0, country);
    const scoredCandidates = await Promise.all(
      cities.map(async (c: any) => {
        const weather = await getWeatherForCity(c.name, c.country);
        return { ...c, weather, ...scoreWeatherForMood(mood, weather) };
      })
    );

    const forecastScoredCandidates = scoredCandidates.filter((candidate) => typeof candidate.fitScore === "number");
    forecastScoredCandidates.sort((first, second) => (second.fitScore ?? -1) - (first.fitScore ?? -1));
    const topCandidates = forecastScoredCandidates.slice(0, 10);
    const destinations = await Promise.all(topCandidates.map(async (destination) => ({
      ...destination,
      photos: await getPhotosForCity(destination.name)
    })));

    return NextResponse.json({
      mood,
      country: country || null,
      recommendationBasis: "runtime city directory + mood profile + best-fit day in the Open-Meteo 7-day forecast",
      destinations
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
