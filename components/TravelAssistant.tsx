"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Destination = {
  id: string | number;
  name: string;
  country?: string;
  photoUrl?: string;
};

type ForecastDay = {
  date: string;
  high?: number;
  low?: number;
  precipitationChance?: number;
  description?: string;
  uvIndex?: number;
};

type CityDetails = {
  city: string;
  country?: string;
  region?: string;
  timezone?: string;
  current?: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
  };
  today?: {
    high: number;
    low: number;
    precipitationChance?: number;
    sunrise?: string;
    sunset?: string;
    uvIndex?: number;
    description: string;
  };
  forecast?: ForecastDay[];
  insights?: string[];
  source?: string;
  updatedAt?: string;
};

type Message = { role: "assistant" | "user"; text: string };

const QUICK_QUESTIONS = ["What's the weather?", "What should I pack?", "Plan a day"];

export default function TravelAssistant({
  mood,
  destination
}: {
  mood: string | null;
  destination: Destination | null;
}) {
  const [details, setDetails] = useState<CityDetails | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [provider, setProvider] = useState("Checking guide…");
  const [open, setOpen] = useState(true);
  const messageListRef = useRef<HTMLDivElement>(null);

  const greeting = destination
    ? `Let's make ${destination.name} work for your ${mood || "next"} trip. I'm checking its local forecast now. Ask me about conditions, packing, or how to shape your day.`
    : `I'm your trip-planning companion for a ${mood || "new"} mood. Pick a destination to add its live forecast, or ask me how to plan at a pace that feels right.`;

  useEffect(() => {
    fetch("/api/travel-assistant")
      .then((response) => response.json())
      .then((data) => setProvider(data.provider || "Local guide"))
      .catch(() => setProvider("Local guide"));
  }, []);

  useEffect(() => {
    const messageList = messageListRef.current;
    messageList?.scrollTo({ top: messageList.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    let cancelled = false;
    setDetails(null);
    setWeatherError("");
    setMessages([{ role: "assistant", text: greeting }]);

    if (!destination) return () => { cancelled = true; };

    setWeatherLoading(true);
    fetch(`/api/city-details?city=${encodeURIComponent(destination.name)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Forecast unavailable.");
        if (!cancelled) setDetails(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setWeatherError(error instanceof Error ? error.message : "Forecast unavailable.");
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false);
      });

    return () => { cancelled = true; };
  }, [mood, destination?.id, destination?.name]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>, prompt?: string) {
    event?.preventDefault();
    const text = (prompt ?? draft).trim();
    if (!text || sending) return;

    setDraft("");
    setChatError("");
    setMessages((current) => [...current, { role: "user", text }]);
    setSending(true);
    try {
      const response = await fetch("/api/travel-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mood,
          city: destination?.name,
          imageUrl: destination?.photoUrl,
          details,
          history: messages.slice(1).slice(-10)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The assistant is unavailable.");
      setProvider(data.provider || "Local guide");
      setMessages((current) => [...current, { role: "assistant", text: data.reply }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "The assistant is unavailable.");
    } finally {
      setSending(false);
    }
  }

  function closeChat() {
    setDraft("");
    setChatError("");
    setMessages([{ role: "assistant", text: greeting }]);
    setOpen(false);
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open travel guide"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-[#183d36] px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-[#183d36]/25 transition hover:-translate-y-0.5 hover:bg-[#28564b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e50]"
        >
          <span aria-hidden="true" className="text-lg">✳</span>
          <span>Travel guide</span>
          <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
        </button>
      ) : (
      <section className="fixed bottom-4 right-4 z-50 flex h-[min(720px,calc(100dvh-2rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/20 sm:bottom-6 sm:right-6" aria-label="Travel assistant">
      <header className="shrink-0 bg-[#183d36] px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />{provider}
            </p>
            <h2 className="mt-1 text-lg font-semibold">Your travel guide</h2>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setOpen(false)} title="Minimize chat" aria-label="Minimize chat" className="flex h-9 w-9 items-center justify-center rounded-md text-lg text-white/80 transition hover:bg-white/10 hover:text-white">−</button>
            <button type="button" onClick={closeChat} title="Close and clear chat" aria-label="Close and clear chat" className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-white/80 transition hover:bg-white/10 hover:text-white">×</button>
          </div>
        </div>
        <p className="mt-2 text-sm text-emerald-50/80">
          {destination ? `${destination.name}${destination.country ? `, ${destination.country}` : ""}` : `${mood || "Your"} mood, your pace`}
        </p>
      </header>

      {destination && (
        <div className="shrink-0 border-b border-stone-200 bg-[#f7f5ef] px-5 py-3">
          {weatherLoading ? (
            <p className="text-sm text-stone-600">Checking the local forecast…</p>
          ) : weatherError ? (
            <p className="text-sm text-rose-700">{weatherError}</p>
          ) : details?.current ? (
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold leading-none text-[#183d36]">{Math.round(details.current.temperature)}°</p>
                  <p className="mt-1 text-sm capitalize text-stone-600">{details.current.description} now</p>
                </div>
                <div className="text-right text-xs leading-5 text-stone-600">
                  <p>Feels {Math.round(details.current.feelsLike)}°</p>
                  <p>{details.current.humidity}% humidity · {Math.round(details.current.windSpeed)} km/h wind</p>
                </div>
              </div>
              {details.today && (
                <p className="mt-3 border-t border-stone-200 pt-3 text-xs text-stone-600">
                  Today {Math.round(details.today.low)}°–{Math.round(details.today.high)}° · {details.today.precipitationChance ?? "—"}% rain · UV {details.today.uvIndex ?? "—"}
                </p>
              )}
              {details.forecast && details.forecast.length > 1 && (
                <div className="mt-3 grid grid-cols-6 gap-1" aria-label="Six-day forecast">
                  {details.forecast.slice(1, 7).map((day) => (
                    <div className="text-center" key={day.date}>
                      <p className="text-[10px] text-stone-500">{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</p>
                      <p className="mt-1 text-xs font-semibold text-stone-800">{Math.round(day.high ?? 0)}°</p>
                      <p className="text-[10px] text-stone-500">{day.precipitationChance ?? "—"}%</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[10px] text-stone-500">Forecast by {details.source || "Open-Meteo"} · updates periodically</p>
            </>
          ) : null}
        </div>
      )}

      <div ref={messageListRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((message, index) => (
          <div
            className={`max-w-[92%] rounded-lg px-3 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "self-end bg-[#dce9df] text-[#183d36]" : "self-start bg-stone-100 text-stone-700"}`}
            key={`${message.role}-${index}`}
          >
            {message.text}
          </div>
        ))}
        {sending && <p className="self-start text-xs text-stone-500">Putting the details together…</p>}
        {chatError && <p className="text-xs text-rose-700" role="alert">{chatError}</p>}
      </div>

      <div className="shrink-0 border-t border-stone-200 px-4 pb-4 pt-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {[...QUICK_QUESTIONS, ...(destination?.photoUrl ? ["What's in this photo?"] : [])].map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => void sendMessage(undefined, question)}
              disabled={sending}
              className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-700 transition hover:border-[#183d36] hover:text-[#183d36] disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(event) => void sendMessage(event)}>
          <label className="sr-only" htmlFor="travel-question">Ask your travel guide</label>
          <input
            id="travel-question"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about your trip…"
            maxLength={500}
            className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315e50] focus:ring-2 focus:ring-[#315e50]/15"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send question"
            className="rounded-md bg-[#183d36] px-4 text-sm font-medium text-white transition hover:bg-[#28564b] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Send
          </button>
        </form>
      </div>
      </section>
      )}
    </>
  );
}
