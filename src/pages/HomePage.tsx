import { useEffect, type KeyboardEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkPlus,
  CloudSun,
  Compass,
  Droplets,
  Eye,
  Gauge,
  History,
  Home,
  MapPin,
  MoonStar,
  Navigation,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  SunMedium,
  Thermometer,
  Trees,
  Waves,
  Wind,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { MetricTile } from "../components/MetricTile";
import { SectionCard } from "../components/SectionCard";
import { WeatherMap } from "../components/WeatherMap";
import { ForecastChart } from "../components/ForecastChart";
import type { ThemeConfig, WeatherBundle } from "../types";

interface HomePageProps {
  city: string;
  setCity: (value: string) => void;
  weather: WeatherBundle | null;
  loading: boolean;
  error: string;
  theme: ThemeConfig;
  handleSearch: () => void;
  handleKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  onSaveLocation: () => void;
  isSaved: boolean;
}

function getAqiLabel(aqi: number): string {
  if (aqi <= 1) return "Good";
  if (aqi === 2) return "Fair";
  if (aqi === 3) return "Moderate";
  if (aqi === 4) return "Poor";
  return "Very Poor";
}

function formatTime(unix: number, timezoneOffset: number): string {
  const date = new Date((unix + timezoneOffset) * 1000);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getWeatherEmoji(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("rain")) return "🌧️";
  if (lower.includes("snow")) return "❄️";
  if (lower.includes("storm")) return "⛈️";
  if (lower.includes("cloud")) return "☁️";
  if (lower.includes("clear")) return "☀️";
  return "🌤️";
}

export function HomePage({
  city,
  setCity,
  weather,
  loading,
  error,
  theme,
  handleSearch,
  handleKey,
  onSaveLocation,
  isSaved,
}: HomePageProps) {
  const [activeInsight, setActiveInsight] = useState<"daily" | "travel" | "outdoor">("daily");
  const [assistantQuestion, setAssistantQuestion] = useState("What should I wear today?");
  const [assistantAnswer, setAssistantAnswer] = useState("Ask about rain, travel, clothing, or tomorrow and I'll tailor a response to your location.");
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    if (weather && assistantAnswer === "Ask about rain, travel, clothing, or tomorrow and I'll tailor the answer to the right location.") {
      setAssistantAnswer(buildAssistantReply(assistantQuestion, weather));
    }
  }, [weather]);

  function buildAssistantReply(question: string, bundle: WeatherBundle | null): string {
    if (!bundle) {
      return "Search a city first so I can tailor the answer to the right location.";
    }

    const location = bundle.current.city;
    const temp = bundle.current.temperature;
    const feelsLike = bundle.current.feelsLike;
    const rainChance = bundle.current.rainChance;
    const windSpeed = bundle.current.windSpeed;
    const summary = bundle.current.summary;
    const tomorrow = bundle.daily[1];
    const normalizedQuestion = question.toLowerCase();

    if (normalizedQuestion.includes("wear") || normalizedQuestion.includes("clothing") || normalizedQuestion.includes("outfit")) {
      if (temp >= 25) return `${location} is warm at ${temp}°C, so light layers, sunglasses, and breathable clothing are the best fit today.`;
      if (temp >= 15) return `${location} is mild at ${temp}°C, so a light jacket and layers will keep you comfortable through the day.`;
      return `${location} is cooler at ${temp}°C, so a warm layer, scarf, and waterproof outerwear are sensible for the conditions.`;
    }

    if (normalizedQuestion.includes("travel") || normalizedQuestion.includes("trip") || normalizedQuestion.includes("commute")) {
      return `${location} is ${summary.toLowerCase()} with ${rainChance}% rain chance and ${windSpeed} m/s wind, so travel is ${comfortLevel(bundle.current.comfortIndex)}. Keep extra time for slower movement.`;
    }

    if (normalizedQuestion.includes("rain") || normalizedQuestion.includes("umbrella") || normalizedQuestion.includes("storm")) {
      return `${location} has a ${rainChance}% chance of precipitation today, so an umbrella or shell is a smart idea. The air feels ${feelsLike}°C.`;
    }

    if (normalizedQuestion.includes("tomorrow")) {
      if (tomorrow) {
        return `Tomorrow in ${location} is shaping up around ${tomorrow.temp}°C with ${tomorrow.condition.toLowerCase()}. That suggests ${tomorrow.precipitation > 50 ? "a wetter and more cautious day." : "decent conditions for your plans."}`;
      }
      return `Tomorrow in ${location} is expected to remain aligned with the current pattern, so it is worth checking the forecast again before you lock in a big outdoor plan.`;
    }

    if (normalizedQuestion.includes("outdoor") || normalizedQuestion.includes("run") || normalizedQuestion.includes("bike") || normalizedQuestion.includes("walk")) {
      return `For ${location}, outdoor plans look ${rainChance > 45 ? "best with a backup option" : "very workable today"}. With ${temp}°C and ${windSpeed} m/s wind, the conditions feel comfortable for most activities.`;
    }

    return `In ${location}, the current outlook is ${summary.toLowerCase()} with a ${rainChance}% rain chance. It is a good time to keep an eye on the sky and adjust plans around the ${temp}°C temperature.`;
  }

  function comfortLevel(score: number): string {
    if (score >= 80) return "excellent";
    if (score >= 60) return "comfortable";
    if (score >= 40) return "mixed";
    return "challenging";
  }

  async function askAssistant(question: string) {
    const trimmed = question.trim();
    if (!trimmed || !weather) return;
    setAssistantLoading(true);
    try {
      const lat = weather.current.lat;
      const lon = weather.current.lon;
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, question: trimmed }),
      });
      const j = await res.json();
      const ans = j?.answer || j?.answer === "" ? j.answer : null;
      if (ans) {
        setAssistantAnswer(ans);
        try {
          if ("speechSynthesis" in window && ans) window.speechSynthesis.speak(new SpeechSynthesisUtterance(ans));
        } catch {
          // speech synthesis failed silently
        }
      } else {
        // fallback to local reply
        setAssistantAnswer(buildAssistantReply(trimmed, weather));
      }
    } catch {
      // network/LLM failed - fallback to local heuristic
      setAssistantAnswer(buildAssistantReply(trimmed, weather));
    } finally {
      setAssistantLoading(false);
    }
  }

  function handleAssistantSubmit() {
    const trimmed = assistantQuestion.trim();
    if (!trimmed || !weather) return;
    void askAssistant(trimmed);
  }

  function handleTravelGuidance() {
    const prompt = "Can I travel today?";
    setActiveInsight("travel");
    setAssistantQuestion(prompt);
    setAssistantAnswer("Preparing a travel-ready outlook for your destination...");
    setAssistantLoading(true);
    // use AI backend if available, otherwise local helper
    void askAssistant(prompt);
  }

  const insightCards = useMemo(() => {
    if (!weather) {
      return [
        { title: "Why it feels right", content: "A calm atmospheric profile is forming for your destination.", icon: <Sparkles size={16} /> },
        { title: "Travel readiness", content: "Excellent conditions for seamless trips and spontaneous plans.", icon: <Navigation size={16} /> },
        { title: "Outdoor plan", content: "Perfect for long walks, bike rides, and photography sessions.", icon: <Trees size={16} /> },
      ];
    }

    return [
      {
        title: "AI insight",
        content: weather.current.summary,
        icon: <Sparkles size={16} />,
      },
      {
        title: "Travel readiness",
        content: weather.current.temperature > 20 ? "The day is ideal for travel and sightseeing when layered with light protection." : "Cooler conditions suggest extra layers and slower outdoor plans.",
        icon: <Navigation size={16} />,
      },
      {
        title: "Outdoor plan",
        content: weather.current.rainChance > 55 ? "Rain is likely; consider indoor activities or a compact umbrella." : "Great conditions for recreation, running, and open-air dining.",
        icon: <Trees size={16} />,
      },
    ];
  }, [weather]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-4 sm:px-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-6"
      >
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Search by city</label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={handleKey}
                placeholder="Enter city name..."
                className="flex-1 rounded-[1rem] border border-white/10 bg-white/10 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-white/30 focus:bg-white/20"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="rounded-[1rem] bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-2 font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : "Search"}
              </button>
            </div>
          </div>
          <nav className="flex gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  isActive ? "bg-white/20 text-white" : "text-slate-300 hover:text-white"
                }`
              }
            >
              <Home size={16} />
              Home
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  isActive ? "bg-white/20 text-white" : "text-slate-300 hover:text-white"
                }`
              }
            >
              <History size={16} />
              History
            </NavLink>
            <NavLink
              to="/saved"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  isActive ? "bg-white/20 text-white" : "text-slate-300 hover:text-white"
                }`
              }
            >
              <Bookmark size={16} />
              Saved
            </NavLink>
          </nav>
        </div>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </motion.header>

      {weather ? (
        <>
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-6"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getWeatherEmoji(weather.current.description)}</span>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{weather.current.city}</h2>
                    <p className="text-sm text-slate-400">{weather.current.country}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-500">{weather.current.description}</p>
              </div>
              <button
                onClick={onSaveLocation}
                className="rounded-full border border-white/20 bg-white/10 p-3 text-white transition hover:bg-white/20"
              >
                {isSaved ? <BookmarkPlus size={20} /> : <Bookmark size={20} />}
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricTile icon={<Thermometer size={18} />} label="Temperature" value={`${weather.current.temperature}°C`} secondary={`Feels ${weather.current.feelsLike}°C`} />
              <MetricTile icon={<Droplets size={18} />} label="Humidity" value={`${weather.current.humidity}%`} />
              <MetricTile icon={<Wind size={18} />} label="Wind" value={`${weather.current.windSpeed} m/s`} secondary={`${weather.current.windDeg}°`} />
              <MetricTile icon={<Eye size={18} />} label="Visibility" value={`${weather.current.visibility} km`} />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <MetricTile icon={<Gauge size={16} />} label="Pressure" value={`${weather.current.pressure} hPa`} />
              <MetricTile icon={<Waves size={16} />} label="Rain Chance" value={`${weather.current.rainChance}%`} />
              <MetricTile icon={<CloudSun size={16} />} label="Cloud Cover" value={`${weather.current.cloudCover}%`} />
              <MetricTile icon={<SunMedium size={16} />} label="UV Index" value={`${weather.current.uvIndex}`} />
              <MetricTile icon={<ShieldAlert size={16} />} label="Air Quality" value={getAqiLabel(weather.current.aqi)} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
              <MetricTile icon={<SunMedium size={18} />} label="Sunrise" value={formatTime(weather.current.sunrise, weather.current.timezoneOffset)} />
              <MetricTile icon={<MoonStar size={18} />} label="Sunset" value={formatTime(weather.current.sunset, weather.current.timezoneOffset)} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">Forecast</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ForecastChart title="Hourly Temperature" series={weather.hourly} accent={theme.accent} />
              <ForecastChart title="Daily Forecast" series={weather.daily} accent={theme.accent} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">Assistant</h3>
            <div className="space-y-4">
              <div className="rounded-[1.3rem] border border-white/10 bg-slate-900/70 p-4">
                <p className="mb-3 text-sm text-slate-400">Ask about weather conditions in {weather.current.city}:</p>
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={assistantQuestion}
                    onChange={(e) => setAssistantQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAssistantSubmit()}
                    placeholder="E.g., What should I wear? Can I travel?"
                    className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-white/30"
                  />
                  <button
                    onClick={handleAssistantSubmit}
                    disabled={assistantLoading}
                    className="rounded-lg bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
                  >
                    {assistantLoading ? "..." : "Ask"}
                  </button>
                </div>
                <SectionCard title="Response" content={assistantAnswer} />
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">Insights</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {insightCards.map((card) => (
                <SectionCard key={card.title} title={card.title} content={card.content} icon={card.icon} />
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <WeatherMap current={weather.current} />
          </motion.section>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-8 text-center shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl"
        >
          <Sparkles size={32} className="mx-auto mb-3 text-slate-400" />
          <p className="text-slate-300">Search for a city to see weather data</p>
        </motion.div>
      )}
    </div>
  );
}
