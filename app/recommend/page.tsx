"use client";
import { useEffect, useState } from "react";
import DestinationCard from "../../components/DestinationCard";
import GlobalWishlistButton from "../../components/GlobalWishlistButton";
import TravelAssistant from "../../components/TravelAssistant";

const MOODS = ["happy", "tired", "sad", "excited", "stressed"];

type SelectedDestination = { id: string | number; name: string; country?: string; mood: string; photoUrl?: string };

// Persistent cache using localStorage
const getMoodCache = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('moodCache');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setMoodCache = (cache: Record<string, any[]>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('moodCache', JSON.stringify(cache));
  } catch {}
};

export default function RecommendPage() {
  const [mood, setMood] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [moodLoading, setMoodLoading] = useState<Record<string, boolean>>({});
  const [selectedDestination, setSelectedDestination] = useState<SelectedDestination | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mood");
    if (m && MOODS.includes(m.toLowerCase())) {
      const selectedMood = m.toLowerCase();
      setMood(selectedMood);
      fetchData(selectedMood);
    } else {
      fetchAllMoods();
    }
  }, []);

  async function fetchData(m: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/recommend?mood=${encodeURIComponent(m)}`);
      const json = await res.json();
      setResults(json.destinations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllMoods() {
    setLoading(true);
    const all: Record<string, any[]> = {};
    const loadingState: Record<string, boolean> = {};
    setMoodLoading(MOODS.reduce((acc, m) => ({ ...acc, [m]: true }), {}));
    let cache = getMoodCache();
    try {
      await Promise.all(
        MOODS.map(async (m) => {
          // Use cache if available
          if (cache[m]) {
            all[m] = cache[m];
            loadingState[m] = false;
            setAllResults((prev) => ({ ...prev, [m]: cache[m] }));
            setMoodLoading((prev) => ({ ...prev, [m]: false }));
            return;
          }
          try {
            const res = await fetch(`/api/recommend?mood=${encodeURIComponent(m)}`);
            const json = await res.json();
            all[m] = json.destinations || [];
            cache = { ...cache, [m]: all[m] };
            setMoodCache(cache);
            setAllResults((prev) => ({ ...prev, [m]: all[m] }));
          } catch (err) {
            all[m] = [];
            setAllResults((prev) => ({ ...prev, [m]: [] }));
          } finally {
            loadingState[m] = false;
            setMoodLoading((prev) => ({ ...prev, [m]: false }));
          }
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const assistantMood = mood || selectedDestination?.mood || null;
  const showAssistant = Boolean(assistantMood || selectedDestination);

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 py-8 md:px-8">
        <div className="grid items-start gap-8">
          <div className="min-w-0">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#52766b]">Mood-based travel</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">
                  {mood ? `For a ${mood} kind of day` : "Find your kind of somewhere"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-stone-600">
                  {mood ? "Explore places that fit your pace, then ask your guide to make the details useful." : "Choose a destination to open its local forecast and start planning with your guide."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <GlobalWishlistButton />
                {mood && <a className="text-sm font-medium text-[#315e50] hover:underline" href="/recommend">Browse all moods</a>}
              </div>
            </div>

            {mood ? (
              <>
                {loading && <p className="py-8 text-sm text-stone-500">Finding destinations for your mood…</p>}
                {!loading && results.length === 0 && <p className="py-8 text-sm text-stone-500">No destinations found for this mood yet.</p>}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {results.map((destination) => (
                    <DestinationCard
                      key={destination.id}
                      data={destination}
                      onSelect={(selected) => setSelectedDestination({
                        ...selected,
                        mood,
                        photoUrl: selected.photos?.results?.[0]?.urls?.regular || selected.photos?.results?.[0]?.urls?.small
                      })}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-10">
                {MOODS.map((currentMood) => (
                  <section key={currentMood}>
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="text-lg font-semibold capitalize text-stone-800">{currentMood} mood</h2>
                      {moodLoading[currentMood] && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#52766b] border-t-transparent" aria-label="Loading destinations" />}
                      <a className="text-xs font-medium text-[#315e50] hover:underline" href={`/recommend?mood=${currentMood}`}>Explore mood</a>
                    </div>
                    <div className="grid min-h-[60px] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {!moodLoading[currentMood] && !allResults[currentMood]?.length && <p className="text-sm italic text-stone-500">No destinations available.</p>}
                      {(allResults[currentMood] || []).map((destination) => (
                        <DestinationCard
                          key={destination.id}
                          data={destination}
                          onSelect={(selected) => setSelectedDestination({
                            ...selected,
                            mood: currentMood,
                            photoUrl: selected.photos?.results?.[0]?.urls?.regular || selected.photos?.results?.[0]?.urls?.small
                          })}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      {showAssistant && (
        <TravelAssistant
          key={`${assistantMood}-${selectedDestination?.id || "mood"}`}
          mood={assistantMood}
          destination={selectedDestination}
        />
      )}
    </>
  );
}
