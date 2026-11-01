"use client";
import { useEffect, useRef, useState } from "react";
import DestinationCard from "../../components/DestinationCard";
import GlobalWishlistButton from "../../components/GlobalWishlistButton";
import TravelAssistant from "../../components/TravelAssistant";

const MOODS = ["happy", "tired", "sad", "excited", "stressed"];

type SelectedDestination = {
  id: string | number;
  name: string;
  country?: string;
  mood: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
};
type CitySearchResult = {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  region?: string;
  latitude: number;
  longitude: number;
};

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
  const [loadError, setLoadError] = useState("");
  const [moodLoading, setMoodLoading] = useState<Record<string, boolean>>({});
  const [selectedDestination, setSelectedDestination] = useState<SelectedDestination | null>(null);
  const [search, setSearch] = useState("");
  const [citySearchResults, setCitySearchResults] = useState<CitySearchResult[]>([]);
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [weatherOnly, setWeatherOnly] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const singleMoodRequest = useRef<AbortController | null>(null);
  const allMoodRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/countries")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Country list unavailable.");
        setCountries(data.countries || []);
      })
      .catch(() => setCountries([]));
  }, []);

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

  useEffect(() => {
    const query = search.trim();
    setCitySearchResults([]);
    setCitySearchError("");
    if (query.length < 2) {
      setCitySearchLoading(false);
      return;
    }

    let cancelled = false;
    setCitySearchLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/cities?search=${encodeURIComponent(query)}&limit=6`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "City search is unavailable.");
        if (!cancelled) setCitySearchResults(data.cities || []);
      } catch (error) {
        if (!cancelled) {
          setCitySearchResults([]);
          setCitySearchError(error instanceof Error ? error.message : "City search is unavailable.");
        }
      } finally {
        if (!cancelled) setCitySearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search]);

  async function fetchData(m: string, country = "") {
    singleMoodRequest.current?.abort();
    const controller = new AbortController();
    singleMoodRequest.current = controller;
    setLoading(true);
    setResults([]);
    setLoadError("");
    try {
      const params = new URLSearchParams({ mood: m });
      if (country) params.set("country", country);
      const res = await fetch(`/api/recommend?${params.toString()}`, { signal: controller.signal });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Recommendations could not be loaded.");
      setResults(json.destinations || []);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setLoadError(error instanceof Error ? error.message : "Recommendations could not be loaded.");
      }
    } finally {
      if (singleMoodRequest.current === controller) {
        singleMoodRequest.current = null;
        setLoading(false);
      }
    }
  }

  async function fetchAllMoods(country = "") {
    allMoodRequest.current?.abort();
    const controller = new AbortController();
    allMoodRequest.current = controller;
    setLoading(true);
    setAllResults({});
    const all: Record<string, any[]> = {};
    const loadingState: Record<string, boolean> = {};
    setMoodLoading(MOODS.reduce((acc, m) => ({ ...acc, [m]: true }), {}));
    let cache = getMoodCache();
    try {
      await Promise.all(
        MOODS.map(async (m) => {
          // Use cache if available
          if (!country && cache[m]) {
            all[m] = cache[m];
            loadingState[m] = false;
            if (!controller.signal.aborted) {
              setAllResults((prev) => ({ ...prev, [m]: cache[m] }));
              setMoodLoading((prev) => ({ ...prev, [m]: false }));
            }
            return;
          }
          try {
            const params = new URLSearchParams({ mood: m });
            if (country) params.set("country", country);
            const res = await fetch(`/api/recommend?${params.toString()}`, { signal: controller.signal });
            const json = await res.json();
            all[m] = json.destinations || [];
            if (!country) {
              cache = { ...cache, [m]: all[m] };
              setMoodCache(cache);
            }
            if (!controller.signal.aborted) setAllResults((prev) => ({ ...prev, [m]: all[m] }));
          } catch (err) {
            all[m] = [];
            if (!controller.signal.aborted) setAllResults((prev) => ({ ...prev, [m]: [] }));
          } finally {
            loadingState[m] = false;
            if (!controller.signal.aborted) setMoodLoading((prev) => ({ ...prev, [m]: false }));
          }
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      if (allMoodRequest.current === controller) {
        allMoodRequest.current = null;
        setLoading(false);
      }
    }
  }

  const assistantMood = mood || selectedDestination?.mood || null;
  const showAssistant = Boolean(assistantMood || selectedDestination);

  function changeCountry(country: string) {
    setSelectedCountry(country);
    if (mood) void fetchData(mood, country);
    else void fetchAllMoods(country);
  }

  const filterDestinations = (destinations: any[]) => destinations
    .filter((destination) => {
      const location = `${destination.name || ""} ${destination.country || ""}`.toLowerCase();
      const hasWeather = Boolean(destination.weather?.weather?.[0]);
      return location.includes(search.trim().toLowerCase()) && (!weatherOnly || hasWeather);
    })
    .sort((first, second) => {
      if (sortBy === "name") return (first.name || "").localeCompare(second.name || "");
      if (sortBy === "warmest") return (second.weather?.main?.temp ?? -Infinity) - (first.weather?.main?.temp ?? -Infinity);
      return 0;
    });

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
                  {mood ? `Explore places matched to your feeling${selectedCountry ? ` in ${selectedCountry}` : ""} and the best day in their seven-day forecast, then ask your guide to make the details useful.` : "Choose a destination to open its local forecast and start planning with your guide."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <GlobalWishlistButton />
                {mood && <a className="text-sm font-medium text-[#315e50] hover:underline" href="/recommend">Browse all moods</a>}
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-3 border-b border-stone-200 pb-5 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <label className="relative block">
                  <span className="sr-only">Search destinations worldwide</span>
                  <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">⌕</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search any city worldwide"
                    autoComplete="off"
                    className="w-full rounded-md border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#52766b] focus:ring-2 focus:ring-[#52766b]/15"
                  />
                </label>
                {search.trim().length >= 2 && (citySearchLoading || citySearchResults.length > 0 || citySearchError) && (
                  <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-md border border-stone-200 bg-white py-1 shadow-xl" role="listbox" aria-label="City search results">
                    {citySearchLoading && <p className="px-3 py-3 text-xs text-stone-500" role="status">Searching cities…</p>}
                    {!citySearchLoading && citySearchError && <p className="px-3 py-3 text-xs text-rose-700" role="status">{citySearchError}</p>}
                    {!citySearchLoading && citySearchResults.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => {
                          setSelectedDestination({
                            id: city.id,
                            name: city.name,
                            country: city.country,
                            mood: mood || "curious",
                            latitude: city.latitude,
                            longitude: city.longitude
                          });
                          setCitySearchResults([]);
                          setSearch("");
                        }}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-[#f3f5ef] focus-visible:bg-[#f3f5ef] focus-visible:outline-none"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-stone-800">{city.name}</span>
                          <span className="block truncate text-xs text-stone-500">{[city.region, city.country].filter(Boolean).join(", ")}</span>
                        </span>
                        <span aria-hidden="true" className="shrink-0 text-xs text-[#52766b]">Plan ↗</span>
                      </button>
                    ))}
                    {!citySearchLoading && !citySearchError && citySearchResults.length === 0 && <p className="px-3 py-3 text-xs text-stone-500">No cities found for “{search.trim()}”.</p>}
                    <p className="border-t border-stone-100 px-3 py-2 text-[10px] text-stone-400">City data by Open-Meteo · no account required</p>
                  </div>
                )}
              </div>
              <label className="flex shrink-0 items-center gap-2 text-sm text-stone-700">
                <span>Country</span>
                <select
                  value={selectedCountry}
                  onChange={(event) => changeCountry(event.target.value)}
                  className="max-w-[190px] rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#52766b] focus:ring-2 focus:ring-[#52766b]/15"
                >
                  <option value="">Any country</option>
                  {countries.map((country) => <option value={country} key={country}>{country}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={weatherOnly}
                  onChange={(event) => setWeatherOnly(event.target.checked)}
                  className="h-4 w-4 accent-[#315e50]"
                />
                Live weather only
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <span>Sort</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#52766b] focus:ring-2 focus:ring-[#52766b]/15"
                >
                  <option value="recommended">Recommended</option>
                  <option value="name">City name</option>
                  <option value="warmest">Warmest</option>
                </select>
              </label>
              {(search || weatherOnly || sortBy !== "recommended" || selectedCountry) && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setWeatherOnly(false); setSortBy("recommended"); if (selectedCountry) changeCountry(""); }}
                  className="self-start text-sm font-medium text-[#315e50] underline underline-offset-4 sm:self-auto"
                >
                  Clear filters
                </button>
              )}
            </div>

            {mood ? (
              <>
                {loading && <p className="py-8 text-sm text-stone-500">Finding destinations for your mood…</p>}
                {!loading && loadError && (
                  <div className="flex flex-wrap items-center gap-3 py-8" role="alert">
                    <p className="text-sm text-rose-800">{loadError}</p>
                    <button type="button" onClick={() => void fetchData(mood, selectedCountry)} className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:border-[#52766b] hover:text-[#183d36]">
                      Try again
                    </button>
                  </div>
                )}
                {!loading && !loadError && results.length === 0 && <p className="py-8 text-sm text-stone-500">No destinations found for this mood yet.</p>}
                {!loading && results.length > 0 && filterDestinations(results).length === 0 && <p className="py-8 text-sm text-stone-500">No places match these filters. Try changing or clearing them.</p>}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filterDestinations(results).map((destination) => (
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
                      {!moodLoading[currentMood] && !filterDestinations(allResults[currentMood] || []).length && <p className="text-sm italic text-stone-500">No destinations match. Try changing or clearing your filters.</p>}
                      {filterDestinations(allResults[currentMood] || []).map((destination) => (
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
