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
  const [assistantAnswer, setAssistantAnswer] = useState("Ask about rain, travel, clothing, or tomorrow and I’ll tailor a response to your location.");
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    if (weather && assistantAnswer === "Ask about rain, travel, clothing, or tomorrow and I’ll tailor the answer to the right location.") {
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
      return `${location} is ${summary.toLowerCase()} with ${rainChance}% rain chance and ${windSpeed} m/s wind, so travel is ${comfortLevel(bundle.current.comfortIndex)}. Keep extra time for slower conditions.`;
    }

    if (normalizedQuestion.includes("rain") || normalizedQuestion.includes("umbrella") || normalizedQuestion.includes("storm")) {
      return `${location} has a ${rainChance}% chance of precipitation today, so an umbrella or shell is a smart idea. The air feels ${feelsLike}°C.`;
    }

    if (normalizedQuestion.includes("tomorrow")) {
      if (tomorrow) {
        return `Tomorrow in ${location} is shaping up around ${tomorrow.temp}°C with ${tomorrow.condition.toLowerCase()}. That suggests ${tomorrow.precipitation > 50 ? "a wetter and more cautious day" : "similar conditions"}.`;
      }
      return `Tomorrow in ${location} is expected to remain aligned with the current pattern, so it is worth checking the forecast again before you lock in a big outdoor plan.`;
    }

    if (normalizedQuestion.includes("outdoor") || normalizedQuestion.includes("run") || normalizedQuestion.includes("bike") || normalizedQuestion.includes("walk")) {
      return `For ${location}, outdoor plans look ${rainChance > 45 ? "best with a backup option" : "very workable today"}. With ${temp}°C and ${windSpeed} m/s wind, the conditions feel comfortable.`;
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
      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, question: trimmed }),
      });
      const j = await res.json();
      const ans = j?.answer || j?.answer === '' ? j.answer : null;
      if (ans) {
        setAssistantAnswer(ans);
        try { if ('speechSynthesis' in window && ans) window.speechSynthesis.speak(new SpeechSynthesisUtterance(ans)); } catch {}
      } else {
        // fallback to local reply
        setAssistantAnswer(buildAssistantReply(trimmed, weather));
      }
    } catch (err) {
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
... (truncated)
