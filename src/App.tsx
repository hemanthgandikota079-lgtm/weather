import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { SavedLocationsPage } from "./pages/SavedLocationsPage";
import { fetchWeatherByCity } from "./services/weatherService";
import { fetchMe, logoutUser, saveHistory } from "./lib/auth";
import type { ThemeConfig, WeatherBundle } from "./types";

const weatherThemes: Record<string, ThemeConfig> = {
  Clear: { bg: "from-[#07111e] via-[#14233b] to-[#274a6b]", glow: "rgba(255, 208, 92, 0.16)", accent: "#fbbf24", particles: ["☀️"] },
  Clouds: { bg: "from-[#111827] via-[#1f2937] to-[#334155]", glow: "rgba(148, 163, 184, 0.12)", accent: "#cbd5e1", particles: ["☁️"] },
  Rain: { bg: "from-[#0b1120] via-[#172554] to-[#1e3a8a]", glow: "rgba(87, 171, 255, 0.16)", accent: "#38bdf8", particles: ["🌧️"] },
  Drizzle: { bg: "from-[#0b1120] via-[#172554] to-[#1e3a8a]", glow: "rgba(87, 171, 255, 0.14)", accent: "#38bdf8", particles: ["🌦️"] },
  Thunderstorm: { bg: "from-[#070b14] via-[#111827] to-[#1f2937]", glow: "rgba(147, 197, 253, 0.16)", accent: "#8b5cf6", particles: ["⛈️"] },
  Snow: { bg: "from-[#0f172a] via-[#1e293b] to-[#334155]", glow: "rgba(186, 230, 253, 0.14)", accent: "#bae6fd", particles: ["❄️"] },
  Mist: { bg: "from-[#0f172a] via-[#1e293b] to-[#334155]", glow: "rgba(148, 163, 184, 0.1)", accent: "#94a3b8", particles: ["🌫️"] },
  Fog: { bg: "from-[#0f172a] via-[#1e293b] to-[#334155]", glow: "rgba(148, 163, 184, 0.1)", accent: "#94a3b8", particles: ["🌫️"] },
  Haze: { bg: "from-[#19130b] via-[#2b1d0d] to-[#3d2d13]", glow: "rgba(249, 115, 22, 0.12)", accent: "#fb923c", particles: ["🌁"] },
};

const defaultTheme: ThemeConfig = { bg: "from-[#020617] via-[#0f172a] to-[#111827]", glow: "rgba(56, 189, 248, 0.12)", accent: "#38bdf8", particles: ["🌤️"] };

function AppRoutes() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(defaultTheme);
  const [history, setHistory] = useState<string[]>([]);
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const navigate = useNavigate();

  async function fetchWeather(cityName: string) {
    if (!cityName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const bundle = await fetchWeatherByCity(cityName);
      setWeather(bundle);
      const condition = bundle.current.description;
      setTheme(weatherThemes[condition.includes("rain") ? "Rain" : condition.includes("cloud") ? "Clouds" : condition.includes("snow") ? "Snow" : condition.includes("storm") ? "Thunderstorm" : condition.includes("clear") ? "Clear" : "Mist"] || defaultTheme);
      setHistory((prev) => [bundle.current.city, ...prev.filter((item) => item !== bundle.current.city)].slice(0, 8));
      setCity(bundle.current.city);
      if (localStorage.getItem('aurora-token')) {
        try {
          void saveHistory(bundle.current.city);
        } catch {
          // ignore backend sync failures
        }
      }
    } catch {
      setError("Weather data could not be loaded. Try a different city.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    fetchWeather(city);
  }

  function handleKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") handleSearch();
  }

  function handleSaveLocation() {
    if (!weather?.current.city) return;
    setSavedLocations((prev) => (prev.includes(weather.current.city) ? prev : [...prev, weather.current.city]));
  }

  function handleSelectLocation(nextCity: string) {
    setCity(nextCity);
    navigate("/");
    fetchWeather(nextCity);
  }

  function handleClearHistory() {
    setHistory([]);
  }

  function handleRemoveSavedLocation(cityName: string) {
    setSavedLocations((prev) => prev.filter((item) => item !== cityName));
  }

  useEffect(() => {
    const saved = localStorage.getItem("weather-history");
    const pinned = localStorage.getItem("weather-saved");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
    if (pinned) {
      setSavedLocations(JSON.parse(pinned));
    }

    const token = localStorage.getItem('aurora-token');
    if (token) {
      void fetchMe()
        .then((response) => setUser(response.user))
        .catch(() => {
          logoutUser();
          setUser(null);
        });
    }

    void fetchWeather("London");
  }, []);

  useEffect(() => {
    localStorage.setItem("weather-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("weather-saved", JSON.stringify(savedLocations));
  }, [savedLocations]);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${theme.bg} transition-all duration-1000`} style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 30%, ${theme.glow}, transparent)`, transition: "background 1s ease" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
      <div className="relative z-10 flex min-h-screen flex-col items-center px-3 py-4 sm:px-6 sm:py-8">
        {!user ? (
          <div className="mb-4 flex w-full max-w-6xl justify-end">
            <Link to="/login" className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200 backdrop-blur transition hover:bg-white/20">
              Login / Register
            </Link>
          </div>
        ) : null}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route
            path="/"
            element={
              <HomePage
                city={city}
                setCity={setCity}
                weather={weather}
                loading={loading}
                error={error}
                theme={theme}
                handleSearch={handleSearch}
                handleKey={handleKey}
                onSaveLocation={handleSaveLocation}
                isSaved={savedLocations.includes(weather?.current.city ?? "")}
              />
            }
          />
          <Route path="/history" element={<HistoryPage history={history} onSelect={handleSelectLocation} onClear={handleClearHistory} />} />
          <Route path="/saved" element={<SavedLocationsPage savedLocations={savedLocations} onSelect={handleSelectLocation} onRemove={handleRemoveSavedLocation} />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
