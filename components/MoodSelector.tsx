"use client";
import Link from "next/link";

const MOODS = ["happy", "tired", "sad", "excited", "stressed"];

const MOOD_DETAILS: Record<string, { note: string; mark: string }> = {
  happy: { note: "Bright days by the water", mark: "01" },
  tired: { note: "Quiet air and room to rest", mark: "02" },
  sad: { note: "A change of scene", mark: "03" },
  excited: { note: "A little more adventure", mark: "04" },
  stressed: { note: "Somewhere to slow down", mark: "05" }
};

export default function MoodSelector() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {MOODS.map((m) => (
        <Link
          key={m}
          href={`/recommend?mood=${encodeURIComponent(m)}`}
          className="group flex min-h-32 flex-col justify-between border border-stone-300 bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#52766b] hover:shadow-[0_10px_28px_rgba(24,61,54,0.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e50]"
        >
          <span className="text-[10px] font-semibold tracking-[0.16em] text-stone-400">{MOOD_DETAILS[m].mark}</span>
          <span>
            <span className="block font-serif text-2xl capitalize text-[#183d36]">{m}</span>
            <span className="mt-1 block text-xs leading-relaxed text-stone-600">{MOOD_DETAILS[m].note}</span>
          </span>
          <span aria-hidden="true" className="self-end text-sm text-[#52766b] transition-transform group-hover:translate-x-1">↗</span>
        </Link>
      ))}
    </div>
  );
}
