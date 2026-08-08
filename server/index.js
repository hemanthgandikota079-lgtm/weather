import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { simpleCache } from './cache.js';
import { computeNowcast } from './nowcast.js';
import { llmChat } from './llm-client.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY; // passed to llm-client

if (!OPENWEATHER_KEY) {
  console.warn('WARNING: OPENWEATHER_KEY is not set. Set it in your environment.');
}

const cache = simpleCache();

async function fetchWeather(lat, lon) {
  const key = `weather:${lat}:${lon}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=daily,alerts&appid=${OPENWEATHER_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OpenWeather error ${resp.status}`);
  const json = await resp.json();
  cache.set(key, json, 5 * 60); // 5 minutes
  return json;
}

app.get('/api/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
    const weather = await fetchWeather(lat, lon);

    const prompt = `You are a helpful weather assistant. Summarize the next 24 hours for the location using this data. Provide a 2-3 sentence plain-language summary and a single recommendation (umbrella, jacket, sunscreen). Data: ${JSON.stringify({ current: weather.current, hourly: weather.hourly.slice(0, 24) })}`;

    const ai = await llmChat([{ role: 'user', content: prompt }]);
    const summary = ai?.content || '';

    res.json({ summary, raw: weather });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/qa', async (req, res) => {
  try {
    const { lat, lon, question } = req.body;
    if (!lat || !lon || !question) return res.status(400).json({ error: 'lat, lon, question required' });
    const weather = await fetchWeather(lat, lon);

    const context = {
      current: weather.current,
      hourly: weather.hourly.slice(0, 24),
      minutely: weather.minutely || []
    };

    const prompt = `You are a helpful weather assistant. Use the following weather data as context and answer the user's question concisely. Data: ${JSON.stringify(context)}\nQuestion: ${question}`;

    const ai = await llmChat([{ role: 'user', content: prompt }]);
    res.json({ answer: ai?.content || 'No answer' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/nowcast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
    const weather = await fetchWeather(lat, lon);
    const nowcast = computeNowcast(weather);
    res.json({ nowcast });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const { lat, lon, rainWithinHours } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
    const weather = await fetchWeather(lat, lon);

    // simple personalized alert: rain within X hours
    const hours = parseInt(rainWithinHours || '3', 10);
    const hourly = weather.hourly || [];
    let rainInHours = null;
    for (let i = 0; i < Math.min(hourly.length, hours); i++) {
      const h = hourly[i];
      // OpenWeather may provide 'pop' (probability of precipitation) and 'rain' volume
      const pop = h.pop || 0;
      const hasRain = (h.rain && Object.values(h.rain).some(v => v > 0)) || pop >= 0.5;
      if (hasRain) { rainInHours = i; break; }
    }

    const alerts = [];
    if (rainInHours !== null) {
      alerts.push({ type: 'rain', message: `Rain expected within ${rainInHours} hours`, in: rainInHours });
    }

    res.json({ alerts, raw: weather });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AI weather server running on port ${PORT}`));
