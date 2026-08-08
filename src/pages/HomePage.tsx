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
    if (weather && assistantAnswer === "Ask about rain, travel, clothing, or tomorrow and I’ll tailor a response to your location.") {
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
      return `${location} is ${summary.toLowerCase()} with ${rainChance}% rain chance and ${windSpeed} m/s wind, so travel is ${comfortLevel(bundle.current.comfortIndex)}. Keep extra time for slower conditions if you are heading out.`;
    }

    if (normalizedQuestion.includes("rain") || normalizedQuestion.includes("umbrella") || normalizedQuestion.includes("storm")) {
      return `${location} has a ${rainChance}% chance of precipitation today, so an umbrella or shell is a smart idea. The air feels ${feelsLike}°C, which makes the weather feel ${feelsLike < temp ? "cooler" : "warmer"} than the thermometer suggests.`;
    }

    if (normalizedQuestion.includes("tomorrow")) {
      if (tomorrow) {
        return `Tomorrow in ${location} is shaping up around ${tomorrow.temp}°C with ${tomorrow.condition.toLowerCase()}. That suggests ${tomorrow.precipitation > 50 ? "a wetter and more cautious day" : "generally manageable outdoor plans"} if you are making plans early.`;
      }
      return `Tomorrow in ${location} is expected to remain aligned with the current pattern, so it is worth checking the forecast again before you lock in a big outdoor plan.`;
    }

    if (normalizedQuestion.includes("outdoor") || normalizedQuestion.includes("run") || normalizedQuestion.includes("bike") || normalizedQuestion.includes("walk")) {
      return `For ${location}, outdoor plans look ${rainChance > 45 ? "best with a backup option" : "very workable today"}. With ${temp}°C and ${windSpeed} m/s wind, the conditions feel ${comfortLevel(bundle.current.comfortIndex).toLowerCase()} for movement.`;
    }

    return `In ${location}, the current outlook is ${summary.toLowerCase()} with a ${rainChance}% rain chance. It is a good time to keep an eye on the sky and adjust plans around the ${temp}°C temperature.`;
  }

  function comfortLevel(score: number): string {
    if (score >= 80) return "excellent";
    if (score >= 60) return "comfortable";
    if (score >= 40) return "mixed";
    return "challenging";
  }

  function handleAssistantSubmit() {
    const trimmed = assistantQuestion.trim();
    if (!trimmed) return;
    setAssistantLoading(true);
    window.setTimeout(() => {
      setAssistantAnswer(buildAssistantReply(trimmed, weather));
      setAssistantLoading(false);
    }, 350);
  }

  function handleTravelGuidance() {
    const prompt = "Can I travel today?";
    setActiveInsight("travel");
    setAssistantQuestion(prompt);
    setAssistantAnswer("Preparing a travel-ready outlook for your destination...");
    setAssistantLoading(true);
    window.setTimeout(() => {
      setAssistantAnswer(buildAssistantReply(prompt, weather));
      setAssistantLoading(false);
      document.getElementById("ai-assistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
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
        content: weather.current.temperature > 20 ? "The day is ideal for travel and sightseeing when layered with light protection." : "Cooler conditions suggest extra layers and slower outdoor pacing.",
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.accent }} />
              Premium weather intelligence
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Skypulse weather<span className="ml-2 text-cyan-300">OS</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
              Beautiful forecasts, travel guidance, air quality intelligence, and elegant weather insights for the modern world.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <NavLink to="/" end className={({ isActive }) => `rounded-full px-3 py-2 text-sm ${isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
              <span className="flex items-center gap-2"><Home size={16} /> Home</span>
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `rounded-full px-3 py-2 text-sm ${isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
              <span className="flex items-center gap-2"><History size={16} /> History</span>
            </NavLink>
            <NavLink to="/saved" className={({ isActive }) => `rounded-full px-3 py-2 text-sm ${isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
              <span className="flex items-center gap-2"><Bookmark size={16} /> Saved</span>
            </NavLink>
          </nav>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-6"
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Live report</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Plan your next moment with clarity.</h2>
              </div>
              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">AI-assisted weather</div>
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-[1.3rem] border border-white/10 bg-slate-950/50 p-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 rounded-[1rem] border border-white/10 bg-white/10 px-4 py-3">
                <MapPin size={18} className="text-cyan-300" />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Search for a city"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-[1rem] bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Analyze
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
              <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10">Current location</button>
              <button onClick={handleTravelGuidance} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10">Travel guidance</button>
              <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10">Voice search</button>
            </div>
            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-900/80 to-slate-900/80 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Now</p>
                <p className="mt-1 text-xl font-semibold text-white">{weather?.current.city ?? "Loading destination"}</p>
              </div>
              <button onClick={onSaveLocation} className="rounded-full border border-white/10 bg-white/10 p-2 text-slate-200 transition hover:bg-white/20">
                {isSaved ? <Bookmark size={16} className="text-cyan-300" /> : <BookmarkPlus size={16} />}
              </button>
            </div>
            {weather ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-6xl font-semibold text-white sm:text-7xl">{weather.current.temperature}°</span>
                      <div className="text-cyan-300">
                        <div className="text-2xl">{getWeatherEmoji(weather.current.description)}</div>
                        <div className="text-sm text-slate-400">Feels {weather.current.feelsLike}°</div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm uppercase tracking-[0.26em] text-slate-400">{weather.current.description}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200">
                    {weather.current.comfortIndex}% comfort
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricTile label="Humidity" value={`${weather.current.humidity}%`} icon={<Droplets size={16} />} accent="#38bdf8" />
                  <MetricTile label="Wind" value={`${weather.current.windSpeed} m/s`} icon={<Wind size={16} />} accent="#8b5cf6" />
                </div>
                <div className="flex items-center justify-between rounded-[1.2rem] border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-300">
                  <span>🌅 {formatTime(weather.current.sunrise, weather.current.timezoneOffset)}</span>
                  <span>🌇 {formatTime(weather.current.sunset, weather.current.timezoneOffset)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-white/10 p-6 text-sm text-slate-400">Search a city to reveal your premium weather briefing.</div>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.14 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-6"
      >
        <div id="ai-assistant" className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-cyan-500/15 via-white/10 to-slate-900/70 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">AI assistant</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Your weather copilot is ready.</h3>
            </div>
          
          </div>
          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-slate-950/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2 text-sm text-cyan-300">
              <Sparkles size={16} />
              <span>Context: {weather?.current.city ?? "search a city"}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={assistantQuestion}
                onChange={(event) => setAssistantQuestion(event.target.value)}
                placeholder="Ask about rain, travel, or outfits"
                className="flex-1 rounded-[0.95rem] border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                onClick={handleAssistantSubmit}
                disabled={assistantLoading || !weather}
                className="rounded-[0.95rem] bg-gradient-to-r from-cyan-400 to-sky-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assistantLoading ? <RefreshCw size={16} className="mx-auto animate-spin" /> : "Ask"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Why is it raining today?",
                "What should I wear today?",
                "Can I travel today?",
                "Will it rain tomorrow?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setAssistantQuestion(prompt);
                    setAssistantAnswer("Thinking through the forecast for your destination...");
                    setAssistantLoading(true);
                    window.setTimeout(() => {
                      setAssistantAnswer(buildAssistantReply(prompt, weather));
                      setAssistantLoading(false);
                    }, 300);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/10 p-3 text-sm leading-6 text-slate-200 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Assistant reply</p>
              <p className="mt-2">{assistantAnswer}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {weather ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <SectionCard title="Forecast intelligence" description="Interpreted conditions tailored for your next move.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricTile label="Visibility" value={`${weather.current.visibility} km`} icon={<Eye size={16} />} accent="#22c55e" />
                <MetricTile label="Pressure" value={`${weather.current.pressure} hPa`} icon={<Gauge size={16} />} accent="#f59e0b" />
                <MetricTile label="UV index" value={`${weather.current.uvIndex}`} icon={<SunMedium size={16} />} accent="#fb923c" />
                <MetricTile label="Rain chance" value={`${weather.current.rainChance}%`} icon={<CloudSun size={16} />} accent="#38bdf8" />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr]">
                <div className="rounded-[1.3rem] border border-white/10 bg-slate-900/70 p-4">
                  <h4 className="text-sm font-semibold text-white">Daily brief</h4>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{weather.current.summary}</p>
                  <div className="mt-5 flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                    <ShieldAlert size={16} className="text-cyan-300" />
                    <span>Air quality is currently {weather.airQuality ? getAqiLabel(weather.airQuality.aqi) : "stable"}.</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="What to expect" description="Elegant guidance for commuting, travel, and outdoor plans.">
              <div className="grid gap-4 md:grid-cols-3">
                {insightCards.map((card) => (
                  <motion.button
                    key={card.title}
                    whileHover={{ y: -4, scale: 1.01 }}
                    onClick={() => setActiveInsight(card.title === "AI insight" ? "daily" : card.title === "Travel readiness" ? "travel" : "outdoor")}
                    className={`rounded-[1.2rem] border p-4 text-left transition ${activeInsight === (card.title === "AI insight" ? "daily" : card.title === "Travel readiness" ? "travel" : "outdoor") ? "border-cyan-400/30 bg-cyan-400/10" : "border-white/10 bg-white/5"}`}
                  >
                    <div className="mb-3 flex items-center gap-2 text-cyan-300">{card.icon}<span className="text-sm font-medium">{card.title}</span></div>
                    <p className="text-sm leading-6 text-slate-400">{card.content}</p>
                  </motion.button>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Atmospheric snapshot" description="The most important numbers at a glance.">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Feels like" value={`${weather.current.feelsLike}°`} icon={<Thermometer size={16} />} accent="#60a5fa" />
                <MetricTile label="Cloud cover" value={`${weather.current.cloudCover}%`} icon={<CloudSun size={16} />} accent="#64748b" />
                <MetricTile label="AQI" value={`${weather.current.aqi}`} icon={<ShieldAlert size={16} />} accent="#fb7185" />
                <MetricTile label="Moon phase" value="Waxing crescent" icon={<MoonStar size={16} />} accent="#fbbf24" />
              </div>
            </SectionCard>

            <SectionCard title="Regional map" description="Localized weather context for your current destination.">
              <WeatherMap current={weather.current} />
            </SectionCard>

            <SectionCard title="Travel & lifestyle" description="Suggested conditions for everyday plans.">
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
                  <span className="flex items-center gap-2"><Compass size={15} className="text-cyan-300" /> Driving</span>
                  <span className="text-white">Comfortable</span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
                  <span className="flex items-center gap-2"><Waves size={15} className="text-cyan-300" /> Marine</span>
                  <span className="text-white">Moderate</span>
                </div>
                <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
                  <span className="flex items-center gap-2"><SunMedium size={15} className="text-cyan-300" /> Photography</span>
                  <span className="text-white">Excellent</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </motion.div>
      ) : null}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.16 }} className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Extended outlook" description="A broader seven-day window with calm visual rhythm.">
          <div className="space-y-3">
            {weather?.daily.slice(0, 5).map((day) => (
              <div key={day.label} className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
                <span>{day.label}</span>
                <span>{day.condition}</span>
                <span className="text-white">{day.temp}°</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Stay prepared" description="Alerts, security, and local conditions in a single glance.">
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3"><span>Storm alerts</span><span className="text-amber-300">Monitor</span></div>
            <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3"><span>Air quality</span><span className="text-emerald-300">Stable</span></div>
            <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3"><span>Travel comfort</span><span className="text-cyan-300">Excellent</span></div>
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
