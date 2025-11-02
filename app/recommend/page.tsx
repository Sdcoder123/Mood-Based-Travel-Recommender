"use client";
import { useEffect, useState } from "react";
import DestinationCard from "../../components/DestinationCard";

export default function RecommendPage() {
  const [mood, setMood] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mood");
    if (m) {
      setMood(m);
      fetchData(m);
    }
  }, []);

  async function fetchData(m: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/recommend?mood=${encodeURIComponent(m)}`);
      const json = await res.json();
      console.log("DEBUG /recommend fetch result", json);
      setResults(json.destinations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
