# AI features for the Weather app

This branch adds a minimal scaffold for AI-powered features: conversational Q&A, personalized alerts, voice (browser), and lightweight nowcasting.

Setup
1. Copy `.env.example` to `.env` and set:
   - OPENWEATHER_KEY=your_openweather_api_key
   - OPENAI_KEY=your_openai_api_key
   - PORT=3001 (optional)

2. Start the backend server:
   - From repo root: `node server/index.js` (requires Node 18+)

3. Start the frontend (development):
   - `npm run dev` (Vite) — ensure Vite proxies `/api` to the backend or run the backend on a port reachable from the frontend.

Notes
- Voice uses browser Web Speech API (SpeechRecognition and speechSynthesis) — no cloud cost.
- LLM calls use OpenAI Chat Completions. If you prefer a different provider, update server/llm-client.js.
- Caching is in-memory; for production use Redis and set REDIS_URL.

