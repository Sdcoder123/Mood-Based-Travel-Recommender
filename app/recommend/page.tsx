"use client";
import { useEffect, useState } from "react";
import DestinationCard from "../../components/DestinationCard";

const MOODS = ["happy", "tired", "sad", "excited", "stressed"];

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mood");
    if (m) {
      setMood(m);
      fetchData(m);
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

  if (mood) {
    return (
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-4">
          Recommendations for "{mood}"
        </h2>
        {loading && <p>Loading...</p>}
        {!loading && results.length === 0 && <p>No results.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {results.map((d) => (
            <DestinationCard key={d.id} data={d} />
          ))}
        </div>
      </section>
    );
  }

  // Show all moods
  return (
    <section className="p-8">
      <h2 className="text-2xl font-semibold mb-4">All Mood Recommendations</h2>
      <div className="space-y-12">
        {MOODS.map((m) => (
          <div key={m} className="">
            <h3 className="text-xl font-bold mb-3 capitalize flex items-center gap-2">
              {m} mood
              {moodLoading[m] && (
                <span className="ml-2 animate-spin inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full"></span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[60px]">
              {(!moodLoading[m] && (allResults[m]?.length === 0)) && (
                <div className="col-span-full text-gray-400 italic">No results.</div>
              )}
              {(allResults[m] || []).map((d) => (
                <DestinationCard key={d.id} data={d} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
