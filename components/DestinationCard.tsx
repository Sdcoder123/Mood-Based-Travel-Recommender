"use client";
import { useState } from "react";

export default function DestinationCard({ data, onUnfavorite, onSelect }: { data: any, onUnfavorite?: () => void, onSelect?: (data: any) => void }) {
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
  const [saveMessage, setSaveMessage] = useState("");
  const { name, country, weather, photos } = data || {};
  const img = photos?.results?.[0]?.urls?.regular || photos?.results?.[0]?.urls?.small || "/icons/placeholder.png";
  const photo = photos?.results?.[0];
  const photoCredit = photo?.attribution || photo?.user?.name;
  const photoLink = photo?.sourceUrl || photo?.user?.links?.html;
  const temp = weather?.main?.temp;
  const desc = weather?.weather?.[0]?.description;
  const iconCode = weather?.weather?.[0]?.icon;
  const weatherIcon = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : null;
  const fitScore = typeof data.fitScore === "number" ? data.fitScore : null;
  const bestDayLabel = data.bestDay?.date
    ? new Date(`${data.bestDay.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : null;

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
      setSaveMessage("Saved to your wishlist");
    } else {
      // Remove from wishlist
      arr = arr.filter((d: any) => d.id !== data.id);
      localStorage.setItem('wishlist', JSON.stringify(arr));
      setFav(false);
      // Notify wishlist page to update immediately
      if (onUnfavorite) onUnfavorite();
      window.dispatchEvent(new CustomEvent('wishlistChanged'));
      setSaveMessage("Removed from your wishlist");
    }
    window.setTimeout(() => setSaveMessage(""), 2200);
  }

  return (
    <>
      <article className="group overflow-hidden rounded-lg border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_30px_rgba(24,61,54,0.10)]">
        <div className="relative h-56 w-full overflow-hidden bg-stone-200 md:h-60">
          <img src={img} alt={`${name} destination`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <button
            aria-label={fav ? "Remove favorite" : "Add favorite"}
            aria-pressed={fav}
            title={fav ? "Remove from wishlist" : "Save to wishlist"}
            onClick={handleFav}
            className={`absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e50] ${fav ? 'text-rose-600' : 'text-stone-700'}`}
          >
            {fav ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41 1.01 4.13 2.44h1.74C13.09 5.01 14.76 4 16.5 4 19.01 4 21 6 21 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.635l1.318-1.317a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-8.682a4.5 4.5 0 010-6.364z"/></svg>
            )}
          </button>

          {temp !== undefined && temp !== null && (
            <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-3 pr-2 shadow-sm">
              <span className="text-lg font-semibold text-[#183d36]">{Math.round(temp)}°</span>
              {weatherIcon && <img src={weatherIcon} alt="" className="h-8 w-8" />}
            </div>
          )}
          {saveMessage && (
            <div role="status" className="absolute bottom-3 left-3 rounded-md bg-white/95 px-3 py-2 text-xs font-medium text-[#183d36] shadow-sm">
              {saveMessage}
            </div>
          )}
        </div>

        <div className="flex min-h-[150px] flex-col p-4">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52766b]">{country || "Destination"}</p>
            <h3 className="mt-1 font-serif text-2xl leading-tight text-stone-900">{name}</h3>
            <p className="mt-1 text-sm capitalize text-stone-600">{desc || "Local forecast unavailable"}</p>
            {fitScore !== null && (
              <div className="mt-3 border-l-2 border-[#52766b] bg-[#f5f5ef] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#315e50]">
                  {data.fitLabel || "Mood match"} · {fitScore}%
                </p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">{data.fitReason}</p>
                {data.bestDay && bestDayLabel && (
                  <p className="mt-2 border-t border-stone-200 pt-2 text-xs text-stone-700">
                    <span className="font-semibold">Best day this week: </span>
                    {bestDayLabel} · {Math.round(data.bestDay.low ?? 0)}°–{Math.round(data.bestDay.high ?? 0)}° · {data.bestDay.precipitationChance ?? "—"}% rain
                  </p>
                )}
              </div>
            )}
            {photoCredit && photoLink && (
              <a href={photoLink} target="_blank" rel="noreferrer" className="mt-2 inline-block max-w-full truncate text-[10px] text-stone-500 hover:underline">
                Photo: {photoCredit}{photo?.license ? ` · ${photo.license}` : ""}
              </a>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-200 pt-3">
            <a href={`https://www.google.com/search?q=${encodeURIComponent(name + (country ? `, ${country}` : ''))}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-stone-600 underline-offset-4 hover:text-[#315e50] hover:underline">Explore place</a>
            {onSelect && (
              <button type="button" onClick={() => onSelect(data)} className="rounded-md bg-[#183d36] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#28564b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e50]">
                Plan with guide <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
