"use client";
import { useState } from "react";
import Link from "next/link";

export default function DestinationCard({ data }: { data: any }) {
  const [fav, setFav] = useState(() => {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem('wishlist');
    if (!raw) return false;
    try {
      const arr = JSON.parse(raw);
      return arr.some((d: any) => d.id === data.id);
    } catch {
      return false;
    }
  });
  const [showWishlistBtn, setShowWishlistBtn] = useState(false);
  const { name, country, weather, photos } = data || {};
  const img = photos?.results?.[0]?.urls?.regular || photos?.results?.[0]?.urls?.small || "/icons/placeholder.png";
  const temp = weather?.main?.temp;
  const desc = weather?.weather?.[0]?.description;
  const iconCode = weather?.weather?.[0]?.icon;
  const weatherIcon = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : null;

  function handleFav() {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('wishlist');
    let arr = [];
    try {
      arr = raw ? JSON.parse(raw) : [];
    } catch { arr = []; }
    if (!fav) {
      // Add to wishlist
      arr.push(data);
      localStorage.setItem('wishlist', JSON.stringify(arr));
      setFav(true);
      setShowWishlistBtn(true);
      setTimeout(() => setShowWishlistBtn(false), 3500);
    } else {
      // Remove from wishlist
      arr = arr.filter((d: any) => d.id !== data.id);
      localStorage.setItem('wishlist', JSON.stringify(arr));
      setFav(false);
    }
  }

  return (
    <article className="relative group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
      <div className="w-full h-48 md:h-56 lg:h-44 relative">
        <img src={img} alt={name} className="absolute inset-0 w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <button
          aria-label={fav ? "Remove favorite" : "Add favorite"}
          onClick={handleFav}
          className={`absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow hover:scale-105 transition-transform ${fav ? 'ring-2 ring-pink-400' : ''}`}
        >
          {fav ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41 1.01 4.13 2.44h1.74C13.09 5.01 14.76 4 16.5 4 19.01 4 21 6 21 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.635l1.318-1.317a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-8.682a4.5 4.5 0 010-6.364z"/></svg>
          )}
        </button>

        {showWishlistBtn && (
          <div className="absolute top-3 right-3 z-30">
            <Link href="/wishlist" className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all border-2 border-white/80 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" /></svg>
              Go to wishlist
            </Link>
          </div>
        )}

        {temp !== undefined && temp !== null && (
          <div className="absolute top-3 right-3 z-20 bg-white/95 px-3 py-2 rounded-full flex items-center space-x-2 shadow">
            <div className="text-2xl font-bold">{Math.round(temp)}°C</div>
            {weatherIcon && <img src={weatherIcon} alt={desc || "weather"} className="w-10 h-10" />}
          </div>
        )}
      </div>

      <div className="p-4 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{name}{country ? `, ${country}` : ""}</h3>
            <p className="text-sm text-gray-500 mt-1 capitalize">{desc || "Weather unavailable"}</p>
          </div>
          
        </div>

        <div className="mt-4 flex items-center justify-between">
          <a href={`https://www.google.com/search?q=${encodeURIComponent(name + (country ? `, ${country}` : ''))}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">Explore</a>
          <div className="text-xs text-gray-500">Updated: {weather ? new Date().toLocaleTimeString() : '—'}</div>
        </div>
      </div>
    </article>
  );
}
