import MoodSelector from "@/components/MoodSelector";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-rose-50">
      {/* Decorative blurred shapes */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-300 to-indigo-400 opacity-30 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tr from-yellow-300 to-green-300 opacity-25 blur-3xl animate-blob animation-delay-2000" />

      <section className="z-10 w-full max-w-6xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 animate-gradient-x">
            Find your next trip based on your mood 🌤️
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 mb-8">
            Tell us how you feel and we’ll suggest destinations with photos and
            live weather — personalized and delightful.
          </p>

          <div className="mx-auto max-w-2xl">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/60">
              <div className="mb-4 text-sm text-gray-500">
                Pick a mood to get started
              </div>
              <div className="transform-gpu will-change-transform">
                <MoodSelector />
              </div>

              <div className="mt-6 flex items-center justify-center gap-4">
                <a
                  href="/recommend?mood=happy"
                  className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full font-medium shadow-lg transition-transform transform hover:-translate-y-1"
                >
                  Try sample: Happy
                </a>
                <a
                  href="/recommend"
                  className="text-sm text-gray-600 hover:underline"
                >
                  See all recommendations
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl p-6 bg-white/80 backdrop-blur-sm shadow hover:shadow-2xl transition">
            <h3 className="text-lg font-semibold mb-2">Live weather highlights</h3>
            <p className="text-sm text-gray-600">
              Current temperatures and conditions are fetched live for each
              destination — prominently displayed on cards.
            </p>
          </div>

          <div className="rounded-xl p-6 bg-white/80 backdrop-blur-sm shadow hover:shadow-2xl transition">
            <h3 className="text-lg font-semibold mb-2">Beautiful imagery</h3>
            <p className="text-sm text-gray-600">
              High-quality photos from Unsplash to help you visualise your next
              trip.
            </p>
          </div>

          <div className="rounded-xl p-6 bg-white/80 backdrop-blur-sm shadow hover:shadow-2xl transition">
            <h3 className="text-lg font-semibold mb-2">Deployable to Vercel</h3>
            <p className="text-sm text-gray-600">
              Serverless API routes make this app easy to host on Vercel with
              environment variables for keys.
            </p>
          </div>
        </div>
      </section>

      <footer className="z-10 w-full text-center py-8 text-sm text-gray-500">
        Made with ♥ — Mood-Based Travel Recommender
      </footer>

      {/* Subtle animated wave at bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full h-40 opacity-30"
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
