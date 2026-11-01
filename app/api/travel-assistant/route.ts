import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const moodGuidance: Record<string, string> = {
  happy: "A bright, flexible trip with time outdoors and room for spontaneous stops should suit this mood.",
  tired: "A slower itinerary with short travel days, comfortable stays, and one gentle highlight is the better fit.",
  sad: "Choose restorative, low-pressure plans: a scenic walk, good food, and a quiet place to recharge.",
  excited: "Leave space for a headline experience and a couple of active options, while keeping a backup for weather.",
  stressed: "Keep the schedule light, reduce transfers, and prioritize calm surroundings over trying to see everything."
};

type ForecastDay = {
  date?: string;
  high?: number;
  low?: number;
  precipitationChance?: number;
  description?: string;
};

type ConversationMessage = { role: "user" | "assistant"; text: string };

class InferenceError extends Error {
  constructor(provider: string, status: number) {
    super(`${provider} request failed with status ${status}`);
  }
}

function getOpenRouterModel() {
  return (process.env.OPENROUTER_MODEL || "openai/gpt-4o").replace(/[^a-zA-Z0-9._:/-]/g, "");
}

function getHuggingFaceModel() {
  return (process.env.HF_MODEL || "Qwen/Qwen3.8-27B:preferred").replace(/[^a-zA-Z0-9._:/-]/g, "");
}

function getTrustedPhotoUrl(value: unknown) {
  if (typeof value !== "string") return undefined;

  try {
    const url = new URL(value);
    const trustedHosts = ["images.unsplash.com", "upload.wikimedia.org", "cdn.britannica.com"];
    return url.protocol === "https:" && trustedHosts.includes(url.hostname) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function askHuggingFace({
  token,
  model,
  message,
  history,
  context,
  imageUrl
}: {
  token: string;
  model: string;
  message: string;
  history: ConversationMessage[];
  context: string;
  imageUrl?: string;
}) {
  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `You are a thoughtful, practical travel-planning assistant. Personalize ideas to the traveler's mood and destination. Treat the supplied weather as the only live forecast data; never invent forecasts, prices, opening hours, or current availability. State uncertainty plainly, keep answers useful and concise, and ask one relevant follow-up when it helps. Current trip context: ${context}`
        },
        ...history.map((item) => ({ role: item.role, content: item.text })),
        {
          role: "user",
          content: imageUrl
            ? [
                { type: "text", text: message },
                { type: "image_url", image_url: { url: imageUrl } }
              ]
            : message
        }
      ],
      temperature: 0.7,
      max_tokens: 450,
      stream: false
    })
  });

  if (!response.ok) throw new InferenceError("Hugging Face", response.status);
  const result = await response.json();
  return getReplyText(result, "Hugging Face");
}

async function askOpenRouter({
  token,
  model,
  message,
  history,
  context,
  imageUrl
}: {
  token: string;
  model: string;
  message: string;
  history: ConversationMessage[];
  context: string;
  imageUrl?: string;
}) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Mood-Based Travel Recommender",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `You are a thoughtful, practical travel-planning assistant. Personalize ideas to the traveler's mood and destination. Treat the supplied weather as the only live forecast data; never invent forecasts, prices, opening hours, or current availability. State uncertainty plainly, keep answers useful and concise, and ask one relevant follow-up when it helps. Current trip context: ${context}`
        },
        ...history.map((item) => ({ role: item.role, content: item.text })),
        {
          role: "user",
          content: imageUrl
            ? [
                { type: "text", text: message },
                { type: "image_url", image_url: { url: imageUrl } }
              ]
            : message
        }
      ],
      temperature: 0.7,
      max_tokens: 450
    })
  });

  if (!response.ok) throw new InferenceError("OpenRouter", response.status);
  return getReplyText(await response.json(), "OpenRouter");
}

function getReplyText(result: any, provider: string) {
  const content = result.choices?.[0]?.message?.content;
  const reply = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part: { type?: string; text?: string }) => part.type === "text" ? part.text || "" : "").join("")
      : "";
  if (!reply.trim()) throw new Error(`${provider} returned an empty response`);
  return reply.trim();
}

export async function GET() {
  const openRouterConfigured = Boolean(process.env.OPENROUTER_API_KEY);
  const huggingFaceConfigured = Boolean(process.env.HF_TOKEN);
  const configured = openRouterConfigured || huggingFaceConfigured;
  return NextResponse.json({
    configured,
    provider: openRouterConfigured ? "OpenRouter" : huggingFaceConfigured ? "Hugging Face" : "Local guide",
    model: openRouterConfigured ? getOpenRouterModel() : huggingFaceConfigured ? getHuggingFaceModel() : null
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
    const mood = typeof body.mood === "string" ? body.mood.toLowerCase() : "";
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 100) : "";
    const asksAboutImage = /\b(image|photo|picture|see|shown|look at|landmark)\b/i.test(message);
    const imageUrl = asksAboutImage ? getTrustedPhotoUrl(body.imageUrl) : undefined;
    const details = body.details && typeof body.details === "object" ? body.details : null;
    const history = Array.isArray(body.history)
      ? body.history
          .filter((item: ConversationMessage) =>
            (item.role === "user" || item.role === "assistant") && typeof item.text === "string"
          )
          .slice(-10)
          .map((item: ConversationMessage) => ({ role: item.role, text: item.text.slice(0, 500) }))
      : [];

    if (!message) return NextResponse.json({ error: "Ask a travel question to get started." }, { status: 400 });

    const openRouterToken = process.env.OPENROUTER_API_KEY;
    const huggingFaceToken = process.env.HF_TOKEN;
    const context = JSON.stringify({
      mood,
      destination: city,
      current: details?.current,
      today: details?.today,
      forecast: Array.isArray(details?.forecast) ? details.forecast.slice(0, 7) : [],
      forecastSource: details?.source
    });
    let fallbackNotice = "";
    if (openRouterToken) {
      const model = getOpenRouterModel();
      try {
        const reply = await askOpenRouter({ token: openRouterToken, model, message, history, context, imageUrl });
        return NextResponse.json({ reply, provider: "OpenRouter", model });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (errorMessage.includes("status 402")) {
          fallbackNotice = "OpenRouter inference is unavailable due to credits or billing, so this reply uses the local travel guide. ";
        } else {
          console.error("Travel assistant OpenRouter request failed:", errorMessage);
          return NextResponse.json({ error: "OpenRouter inference is unavailable. Check the API key, selected model, and account limits." }, { status: 502 });
        }
      }
    } else if (huggingFaceToken) {
      const model = getHuggingFaceModel();
      try {
        const reply = await askHuggingFace({ token: huggingFaceToken, model, message, history, context, imageUrl });
        return NextResponse.json({ reply, provider: "Hugging Face", model });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (errorMessage.includes("status 402")) {
          fallbackNotice = "Hugging Face inference is unavailable due to credits or billing, so this reply uses the local travel guide. ";
        } else {
          console.error("Travel assistant Hugging Face request failed:", errorMessage);
          return NextResponse.json({ error: "Hugging Face inference is unavailable. Check that the token has Inference Providers permission and that the selected model is available." }, { status: 502 });
        }
      }
    }

    const lowerMessage = message.toLowerCase();
    const current = details?.current;
    const today = details?.today;
    const forecast = Array.isArray(details?.forecast) ? details.forecast as ForecastDay[] : [];
    const place = city || "your next destination";
    const moodTip = moodGuidance[mood] || "Choose a pace that feels comfortable and leave room to explore.";
    let reply: string;

    if (/\b(weather|forecast|rain|temperature|temp|sun|uv)\b/.test(lowerMessage)) {
      if (current || today) {
        const conditions = current
          ? `Right now in ${place}, it is ${Math.round(current.temperature)}°C and ${current.description}, with ${current.humidity}% humidity and ${Math.round(current.windSpeed)} km/h wind.`
          : `Today's outlook in ${place} is ${today.description}, with a high of ${Math.round(today.high)}°C and a low of ${Math.round(today.low)}°C.`;
        const extras = today
          ? ` Today's rain chance is ${today.precipitationChance ?? "not available"}%, and the UV index is ${today.uvIndex ?? "not available"}.`
          : "";
        reply = `${conditions}${extras} ${moodTip}`;
      } else {
        reply = `I don't have a live forecast for ${place} yet. Choose a destination to load its current conditions and seven-day outlook, then ask me again.`;
      }
    } else if (/\b(best day|which day|when should|when to go|best time)\b/.test(lowerMessage) && forecast.length) {
      const bestDay = forecast
        .filter((day) => day.date)
        .sort((first, second) => (first.precipitationChance ?? 50) - (second.precipitationChance ?? 50))[0];
      reply = bestDay
        ? `${bestDay.date} looks like the driest day in the available forecast for ${place}: ${bestDay.description}, around ${Math.round(bestDay.low ?? 0)}–${Math.round(bestDay.high ?? 0)}°C, with a ${bestDay.precipitationChance ?? "unknown"}% precipitation chance. This is a short-range weather signal, not a long-term seasonal prediction.`
        : `I couldn't find enough forecast detail to compare days in ${place}.`;
    } else if (/\b(pack|packing|bring|wear|clothes)\b/.test(lowerMessage)) {
      if (today) {
        const items = [
          today.precipitationChance >= 40 ? "a light rain layer" : null,
          today.high >= 27 ? "breathable clothes and sun protection" : null,
          today.low <= 8 ? "a warm extra layer for mornings and evenings" : null,
          today.uvIndex >= 6 ? "sunscreen and a hat" : null
        ].filter(Boolean);
        reply = `For ${place}, the forecast suggests ${items.length ? items.join(", ") : "comfortable layers suited to the day's conditions"}. Expect ${today.description}, about ${Math.round(today.low)}–${Math.round(today.high)}°C. ${moodTip}`;
      } else {
        reply = `Select a destination first and I can tailor a packing suggestion to its current forecast. For now, check the season and planned activities before packing.`;
      }
    } else if (/\b(cost|costs|budget|price|expensive|cheap)\b/.test(lowerMessage)) {
      reply = `I don't have live hotel, flight, or local price data for ${place}, so I shouldn't guess a trip budget. Costs vary by dates and travel style; compare your exact dates and include local transport and meals. I can still help shape a lower-key itinerary. ${moodTip}`;
    } else if (/\b(what to do|things to do|activity|activities|itinerary|plan)\b/.test(lowerMessage)) {
      const weatherNote = today
        ? ` The current outlook is ${today.description}, with a ${today.precipitationChance ?? "unknown"}% rain chance, so keep an indoor alternative handy${today.precipitationChance >= 40 ? "" : " if conditions change"}.`
        : "";
      reply = `${moodTip}${weatherNote} I don't have live attraction listings, but I can help you shape a day around a relaxed walk, a local meal, and one main activity. Tell me your interests or available time and I'll tailor the outline.`;
    } else {
      const weatherNote = current
        ? ` In ${place}, it is currently ${Math.round(current.temperature)}°C with ${current.description}.`
        : city ? ` I've selected ${place}; its live forecast will appear here as soon as the lookup completes.` : " Pick a destination and I can make the advice more specific.";
      reply = `${moodTip}${weatherNote} I can help with the forecast, choosing the driest day, packing, activities, or planning around your budget. What matters most for this trip?`;
    }

    return NextResponse.json({ reply: `${fallbackNotice}${reply}`, provider: "Local guide", source: details?.source || "Mood travel insight engine" });
  } catch {
    return NextResponse.json({ error: "I couldn't process that question. Please try again." }, { status: 400 });
  }
}