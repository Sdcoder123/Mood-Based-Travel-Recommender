"use client";
import Link from "next/link";

const MOODS = ["happy", "tired", "sad", "excited", "stressed"];

export default function MoodSelector() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full max-w-2xl">
      {MOODS.map((m) => (
        <Link
          key={m}
          href={`/recommend?mood=${encodeURIComponent(m)}`}
          className="p-4 bg-white rounded-lg shadow text-center hover:shadow-md"
        >
          <div className="text-xl font-medium capitalize">{m}</div>
        </Link>
      ))}
    </div>
  );
}
