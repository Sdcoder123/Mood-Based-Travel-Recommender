"use client";
import { useEffect, useState } from "react";
import DestinationCard from "../../components/DestinationCard";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("wishlist");
      setWishlist(raw ? JSON.parse(raw) : []);
    }
    // Listen for wishlist changes (unfavorite)
    function handleWishlistChange() {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("wishlist");
        setWishlist(raw ? JSON.parse(raw) : []);
      }
    }
    window.addEventListener("wishlistChanged", handleWishlistChange);
    return () => window.removeEventListener("wishlistChanged", handleWishlistChange);
  }, []);

  return (
    <section className="p-8 min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700 drop-shadow">Your Wishlist</h2>
      {wishlist.length === 0 ? (
        <div className="text-center text-gray-500 text-lg mt-16">No destinations in your wishlist yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlist.map((d) => (
            <div key={d.id} className="relative group">
              <DestinationCard data={d} onUnfavorite={() => {
                // Remove from UI immediately
                setWishlist((prev) => prev.filter((item) => item.id !== d.id));
              }} />
              {/* City details overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 bg-opacity-90 rounded-b-xl p-4 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <h4 className="text-lg font-bold mb-1 text-indigo-700">{d.name}{d.country ? `, ${d.country}` : ''}</h4>
                {d.weather && (
                  <div className="mb-1 text-sm text-gray-700 flex items-center gap-2">
                    <span className="font-semibold">Weather:</span>
                    <span>{d.weather.main?.temp ? `${Math.round(d.weather.main.temp)}°C` : 'N/A'}</span>
                    <span className="capitalize">{d.weather.weather?.[0]?.description || ''}</span>
                  </div>
                )}
                {d.photos?.results?.[0]?.description && (
                  <div className="mb-1 text-sm text-gray-700"><span className="font-semibold">Photo:</span> {d.photos.results[0].description}</div>
                )}
                <div className="text-xs text-gray-500 mt-2">ID: {d.id}</div>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(d.name + (d.country ? ", " + d.country : ''))}`} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs text-indigo-600 hover:underline">More about this city</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
