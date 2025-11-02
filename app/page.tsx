import MoodSelector from "@/components/MoodSelector";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-100 via-white to-pink-100">
      {/* 🌈 Textured background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[url('/noise-texture.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

      {/* Blurred gradient blobs for depth */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-400 to-indigo-500 opacity-30 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tr from-yellow-300 to-teal-400 opacity-25 blur-3xl animate-blob animation-delay-2000" />

      <section className="z-10 w-full max-w-6xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 animate-gradient-x drop-shadow-[0_3px_6px_rgba(0,0,0,0.15)]">
            Find your next trip based on your mood 🌤️
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-gray-700 mb-8 leading-relaxed">
            Tell us how you feel and we’ll suggest destinations with photos and live weather — uniquely tuned to your vibe.
          </p>

          {/* 🎭 Mood Selection Card */}
          <div className="mx-auto max-w-2xl">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition">
              <div className="mb-4 text-sm text-gray-500 tracking-wide uppercase">
                Pick a mood to get started
              </div>

              <div className="transform-gpu">
                <MoodSelector />
              </div>

              {/* Buttons */}
              <div className="mt-8 flex items-center justify-center gap-5">
                <a
                  href="/recommend?mood=happy"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-transform transform hover:-translate-y-1 hover:scale-105"
                >
                  ✨ Try “Happy” Mood
                </a>
                <a
                  href="/recommend"
                  className="text-sm text-indigo-700 hover:underline hover:text-pink-600 transition"
                >
                  See all recommendations →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 💡 Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Live Weather Insights",
              desc: "Each recommendation comes with real-time weather updates — perfect for spontaneous getaways.",
              color: "from-blue-200 to-blue-50",
            },
            {
              title: "Vibrant Imagery",
              desc: "Breathtaking Unsplash photos bring each destination to life — before you even pack your bags.",
              color: "from-pink-200 to-pink-50",
            },
            {
              title: "Mood Travel",
              desc: "Experience AI-powered suggestions that match your emotions — turning feelings into destinations.",
              color: "from-teal-200 to-teal-50",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 bg-gradient-to-br ${feature.color} shadow hover:shadow-xl border border-white/50 hover:-translate-y-1 transition-transform`}
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{feature.title}</h3>
              <p className="text-sm text-gray-700">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="z-10 w-full text-center py-8 text-sm text-gray-500">
        Made with ❤️ — Mood-Based Travel Recommender
      </footer>

      {/* 🌊 Animated Wave */}
      <svg
        className="absolute bottom-0 left-0 w-full h-40 opacity-40"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="#fff"
          d="M0,160L48,149.3C96,139,192,117,288,112C384,107,480,117,576,117.3C672,117,768,107,864,112C960,117,1056,139,1152,165.3C1248,192,1344,224,1392,240L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </main>
  );
}
