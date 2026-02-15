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
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/wishlist"
        className={`inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all border-2 border-white/80 ${show ? 'animate-pulse' : ''}`}
        style={{ animationDuration: '0.8s' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" /></svg>
        Go to your wishlist
      </Link>
    </div>
  );
}