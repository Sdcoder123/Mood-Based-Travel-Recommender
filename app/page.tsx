import MoodSelector from "@/components/MoodSelector";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f6f1]">
      <section className="relative isolate flex min-h-[330px] h-[43svh] max-h-[520px] items-end overflow-hidden bg-[#1d392f]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=85)" }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#101d18]/80 via-[#101d18]/20 to-[#101d18]/10" />
        <div className="mx-auto w-full max-w-[1440px] px-5 pb-10 pt-16 md:px-10 md:pb-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#e4c995]">A little closer to your kind of escape</p>
          <h1 className="font-serif text-5xl leading-[0.98] text-white sm:text-6xl md:text-7xl">Mood Travel</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            Start with how you want to feel. Find a place that meets you there.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-14 pt-9 md:px-10 md:pb-20 md:pt-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#52766b]">Your starting point</p>
            <h2 className="mt-2 font-serif text-3xl text-[#183d36] md:text-4xl">What kind of trip feels right?</h2>
          </div>
          <a href="/recommend" className="text-sm font-semibold text-[#315e50] underline-offset-4 hover:underline">
            Browse every destination <span aria-hidden="true">↗</span>
          </a>
        </div>
        <MoodSelector />
        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-stone-300 pt-5 text-xs text-stone-600">
          <span><strong className="mr-2 text-[#183d36]">01</strong>Choose a feeling</span>
          <span><strong className="mr-2 text-[#183d36]">02</strong>Explore a place</span>
          <span><strong className="mr-2 text-[#183d36]">03</strong>Make it yours with your guide</span>
        </div>
      </section>
    </div>
  );
}
