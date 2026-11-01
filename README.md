# Mood-Based Travel Recommender

Next.js 14 (App Router) + serverless API routes that recommend travel destinations based on user mood. Deployable to Vercel.

Getting started: 

1. Install dependencies: npm install
2. Copy `.env.example` to `.env.local` and add your OpenRouter API key
3. Run dev: npm run dev
4. Deploy to Vercel

Create an API key in your OpenRouter account settings: https://openrouter.ai/keys. Keep `OPENROUTER_API_KEY` in `.env.local` or your hosting provider's server environment; never use a `NEXT_PUBLIC_` prefix or commit the key. `OPENROUTER_MODEL` defaults to `openai/gpt-4o` and can be changed to another model available to your account. Model availability and pricing vary; check OpenRouter's model catalog and account usage before sending requests. If hosted inference is not configured or credits are unavailable, the chat uses its built-in mood and forecast planner. An existing `HF_TOKEN` remains supported as a secondary provider when no OpenRouter key is configured.

City search and forecast geocoding use Open-Meteo without an API key. Mood recommendations fetch city directories at runtime from CountriesNow, rotate through population-ranked candidates in mood-relevant countries, score their seven-day Open-Meteo forecast, and return the top ten. Users can narrow recommendations to any country from the live country list. Curated local suggestions are only used if the city directory is unavailable. Destination photos can use Wikimedia Commons by default or Unsplash when configured.
