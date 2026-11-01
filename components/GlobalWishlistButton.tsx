"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function GlobalWishlistButton() {
  const [show, setShow] = useState(false);
  const [hasFav, setHasFav] = useState(false);

  useEffect(() => {
    // Check if there is at least one favorite on mount
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('wishlist');
      try {
        const arr = raw ? JSON.parse(raw) : [];
        setHasFav(Array.isArray(arr) && arr.length > 0);
      } catch {
        setHasFav(false);
      }
    }
    function handler() {
      setShow(true);
      setHasFav(true);
      setTimeout(() => setShow(false), 3500);
    }
    window.addEventListener('showWishlistBtn', handler);
    return () => window.removeEventListener('showWishlistBtn', handler);
  }, []);

  if (!hasFav && !show) return null;
  return (
    <div className="shrink-0">
      <Link
        href="/wishlist"
        className={`inline-flex items-center gap-2 rounded-md bg-[#183d36] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#28564b] ${show ? 'animate-pulse' : ''}`}
        style={{ animationDuration: '0.8s' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" /></svg>
        Go to your wishlist
      </Link>
    </div>
  );
}