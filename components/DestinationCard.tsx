"use client";
import { useState } from "react";
import Link from "next/link";

export default function DestinationCard({ data, onUnfavorite }: { data: any, onUnfavorite?: () => void }) {
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
  const [showModal, setShowModal] = useState(false);
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
      // Show global wishlist button
      const evt = new CustomEvent('showWishlistBtn');
      window.dispatchEvent(evt);
      setShowModal(true);
    } else {
      // Remove from wishlist
      arr = arr.filter((d: any) => d.id !== data.id);
      localStorage.setItem('wishlist', JSON.stringify(arr));
      setFav(false);
      // Notify wishlist page to update immediately
      if (onUnfavorite) onUnfavorite();
      window.dispatchEvent(new CustomEvent('wishlistChanged'));
    }
  }

  return (
    <>
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

      {/* Modal for city details after adding to wishlist */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-pink-500 text-2xl font-bold"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <img src={img} alt={name} className="w-full h-48 object-cover rounded-xl mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-indigo-700">{name}{country ? `, ${country}` : ''}</h2>
            {weather && (
              <div className="mb-2 text-gray-700 flex items-center gap-2">
                <span className="font-semibold">Weather:</span>
                <span>{weather.main?.temp ? `${Math.round(weather.main.temp)}°C` : 'N/A'}</span>
                <span className="capitalize">{weather.weather?.[0]?.description || ''}</span>
                {weatherIcon && <img src={weatherIcon} alt={desc || 'weather'} className="w-8 h-8 ml-2" />}
              </div>
            )}
            {photos?.results?.[0]?.description && (
              <div className="mb-2 text-gray-700"><span className="font-semibold">Photo:</span> {photos.results[0].description}</div>
            )}
            <div className="text-xs text-gray-500 mt-2 mb-4">ID: {data.id}</div>
            <a href={`https://www.google.com/search?q=${encodeURIComponent(name + (country ? ", " + country : ''))}`} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm text-indigo-600 hover:underline">More about this city</a>
          </div>
        </div>
      )}
    </>
  );
}
