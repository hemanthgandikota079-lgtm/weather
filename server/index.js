import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { simpleCache } from './cache.js';
import { computeNowcast } from './nowcast.js';
import { llmChat } from './llm-client.js';
import {
  createLoginOTP,
  createRegistrationOTP,
  verifyOTPCode,
  resendOTPCode,
  getUserByEmail
} from './otp-service.js';

const app = express();

// Security headers and middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(bodyParser.json({ limit: '10kb' })); // Limit request size

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY; // passed to llm-client

if (!OPENWEATHER_KEY) {
  console.warn('WARNING: OPENWEATHER_KEY is not set. Set it in your environment.');
}

const cache = simpleCache();

async function fetchWeather(lat, lon) {
  // Input validation
  if (typeof lat !== 'number' || typeof lon !== 'number' || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Invalid coordinates provided');
  }

  const key = `weather:${lat}:${lon}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=daily,alerts&appid=${OPENWEATHER_KEY}`;
    const resp = await fetch(url, { timeout: 10000 }); // 10 second timeout
    if (!resp.ok) throw new Error(`OpenWeather error ${resp.status}`);
    const json = await resp.json();
    cache.set(key, json, 5 * 60); // 5 minutes
    return json;
  } catch (error) {
    console.error('Weather fetch error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to fetch weather data. Please try again.');
  }
}

app.get('/api/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    // Input validation
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ error: 'Valid lat and lon numbers required' });
    }
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ error: 'Coordinates out of valid range' });
    }

    const weather = await fetchWeather(latNum, lonNum);

    const prompt = `You are a helpful weather assistant. Summarize the next 24 hours for the location using this data. Provide a 2-3 sentence plain-language summary and a single recommendation (umbrella, layers, etc.). Data: ${JSON.stringify(weather)}`;

    const ai = await llmChat([{ role: 'user', content: prompt }]);
    const summary = ai?.content || '';

    res.json({ summary, raw: weather });
  } catch (err) {
    console.error('Forecast error:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch forecast' });
  }
});

app.post('/api/qa', async (req, res) => {
  try {
    const { lat, lon, question } = req.body;
    
    // Input validation
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ error: 'Valid lat and lon numbers required' });
    }
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ error: 'Coordinates out of valid range' });
    }
    if (!question || typeof question !== 'string' || question.trim().length === 0 || question.length > 500) {
      return res.status(400).json({ error: 'Valid question required (max 500 characters)' });
    }

    const weather = await fetchWeather(latNum, lonNum);

    const context = {
      current: weather.current,
      hourly: weather.hourly.slice(0, 24),
      minutely: weather.minutely || []
    };

    const prompt = `You are a helpful weather assistant. Use the following weather data as context and answer the user's question concisely. Data: ${JSON.stringify(context)}\nQuestion: ${question}`;

    const ai = await llmChat([{ role: 'user', content: prompt }]);
    res.json({ answer: ai?.content || 'No answer' });
  } catch (err) {
    console.error('QA error:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to process question' });
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

// ============ OTP AUTHENTICATION API ENDPOINTS ============

/**
 * POST /api/auth/send-otp
 * Send OTP to email for login
 */
app.post('/api/auth/login-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const result = await createLoginOTP(email.toLowerCase());
    
    res.json({
      success: true,
      message: `OTP sent to ${email}`,
      requestId: result.requestId
    });
  } catch (err) {
    console.error('Login OTP error:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

/**
 * POST /api/auth/register-otp
 * Send OTP to email for registration
 */
app.post('/api/auth/register-otp', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser && existingUser.verified) {
      return res.status(400).json({ message: 'This email is already registered. Please login instead.' });
    }

    const result = await createRegistrationOTP(name, email);

    res.json({
      success: true,
      message: `Registration code sent to ${email}`,
      requestId: result.requestId
      // Don't send OTP in production! Only for demo:
      // otp: result.otp
    });
  } catch (err) {
    console.error('Register OTP error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and authenticate user
 */
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, requestId } = req.body;

    if (!email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({ message: 'OTP must be a 6-digit code' });
    }

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ message: 'Valid request ID is required' });
    }

    const result = verifyOTPCode(requestId, otp);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      success: true,
      message: result.message,
      user: result.user,
      token: result.token
    });
  } catch (err) {
    console.error('Verify OTP error:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP code
 */
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email, requestId } = req.body;

    if (!email || !requestId) {
      return res.status(400).json({ message: 'Email and request ID are required' });
    }

    const result = await resendOTPCode(requestId, email);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
  }
});

/**
 * POST /api/auth/send-verification-email
 * Send verification email to user
 */
app.post('/api/auth/send-verification-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const result = await createLoginOTP(email);

    res.json({
      success: true,
      message: `Verification email sent to ${email}`,
      requestId: result.requestId
    });
  } catch (err) {
    console.error('Send verification email error:', err);
    res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
  }
});

// ============ END OTP ENDPOINTS ============

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AI weather server running on port ${PORT}`));
