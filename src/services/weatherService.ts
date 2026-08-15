import type { AirQualityData, ForecastEntry, WeatherBundle, WeatherCurrent, WeatherForecastResponse, WeatherCurrentResponse, AirQualityResponse } from "../types";

const API_KEY = "dda41e776c9c7326ccebf0cbcdfd7cdf";

function getConditionSummary(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("rain")) return "Rain is in the forecast, so keep a compact shell nearby.";
  if (lower.includes("cloud")) return "Cloud cover is steady, making it a calm but dim day.";
  if (lower.includes("snow")) return "Snow is expected, so plan for slower travel and extra layers.";
  if (lower.includes("thunder")) return "Storm conditions are active; secure outdoor plans and stay weather-aware.";
  if (lower.includes("clear")) return "Expect bright skies and excellent visibility for outdoor moments.";
  return "Conditions are balanced and comfortable for daily activities.";
}

function toForecastEntry(item: WeatherForecastResponse["list"][number], index: number): ForecastEntry {
  return {
    label: index === 0 ? "Now" : new Date(item.dt * 1000).toLocaleTimeString([], { hour: "numeric" }),
    temp: Math.round(item.main.temp),
    condition: item.weather[0].description,
    icon: item.weather[0].icon,
    precipitation: Math.round((item.pop ?? 0) * 100),
    wind: Math.round(item.wind.speed),
  };
}

function toDailyEntry(item: WeatherForecastResponse["list"][number], index: number): ForecastEntry {
  return {
    label: index === 0 ? "Today" : new Date(item.dt * 1000).toLocaleDateString([], { weekday: "short" }),
    temp: Math.round(item.main.temp),
    condition: item.weather[0].description,
    icon: item.weather[0].icon,
    precipitation: Math.round((item.pop ?? 0) * 100),
    wind: Math.round(item.wind.speed),
  };
}

function buildCurrentWeather(current: WeatherCurrentResponse, airQuality: AirQualityData | null, timezoneOffset: number): WeatherCurrent {
  const comfortIndex = Math.max(0, Math.min(100, Math.round((current.main.temp + 20 + (100 - current.main.humidity) / 2) / 1.2)));

  return {
    city: current.name,
    country: current.sys.country,
    temperature: Math.round(current.main.temp),
    feelsLike: Math.round(current.main.feels_like),
    humidity: current.main.humidity,
    pressure: current.main.pressure,
    visibility: Math.round(current.visibility / 1000),
    windSpeed: Math.round(current.wind.speed),
    windDeg: current.wind.deg,
    description: current.weather[0].description,
    icon: current.weather[0].icon,
    sunrise: current.sys.sunrise,
    sunset: current.sys.sunset,
    uvIndex: Math.round(Math.max(1, Math.min(11, current.main.temp / 4 + 2))),
    rainChance: Math.round((current.clouds.all / 100) * 70 + 10),
    cloudCover: current.clouds.all,
    aqi: airQuality?.aqi ?? 1,
    comfortIndex,
    summary: getConditionSummary(current.weather[0].description),
    lat: current.coord.lat,
    lon: current.coord.lon,
    timezoneOffset,
  };
}

export async function fetchWeatherByCity(city: string): Promise<WeatherBundle> {
  const [currentRes, forecastRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`),
  ]);

  if (!currentRes.ok || !forecastRes.ok) {
    throw new Error("Weather data could not be loaded for this location.");
  }

  const current: WeatherCurrentResponse = await currentRes.json();
  const forecast: WeatherForecastResponse = await forecastRes.json();
  
  let airQuality: AirQualityData | null = null;
  try {
    const airRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${current.coord.lat}&lon=${current.coord.lon}&appid=${API_KEY}`);
    if (airRes.ok) {
      const air = (await airRes.json()) as AirQualityResponse;
      airQuality = {
        aqi: air.list[0].main.aqi,
        pm2_5: Math.round(air.list[0].components.pm2_5 * 10) / 10,
        pm10: Math.round(air.list[0].components.pm10 * 10) / 10,
        no2: Math.round(air.list[0].components.no2 * 10) / 10,
        o3: Math.round(air.list[0].components.o3 * 10) / 10,
      };
    }
  } catch {
    // Air quality API call failed, continue without it
  }

  const hourly = forecast.list.slice(0, 8).map((item, index) => toForecastEntry(item, index));
  const daily = forecast.list.slice(0, 7).map((item, index) => toDailyEntry(item, index));

  return {
    current: buildCurrentWeather(current, airQuality, forecast.city.timezone),
    hourly,
    daily,
    airQuality,
  };
}

export async function fetchWeatherByCoordinates(lat: number, lon: number, label: string): Promise<WeatherBundle> {
  const [currentRes, forecastRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
  ]);

  if (!currentRes.ok || !forecastRes.ok) {
    throw new Error("Weather data could not be loaded for your location.");
  }

  const current: WeatherCurrentResponse = await currentRes.json();
  const forecast: WeatherForecastResponse = await forecastRes.json();
  
  let airQuality: AirQualityData | null = null;
  try {
    const airRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (airRes.ok) {
      const air = (await airRes.json()) as AirQualityResponse;
      airQuality = {
        aqi: air.list[0].main.aqi,
        pm2_5: Math.round(air.list[0].components.pm2_5 * 10) / 10,
        pm10: Math.round(air.list[0].components.pm10 * 10) / 10,
        no2: Math.round(air.list[0].components.no2 * 10) / 10,
        o3: Math.round(air.list[0].components.o3 * 10) / 10,
      };
    }
  } catch {
    // Air quality API call failed, continue without it
  }

  const hourly = forecast.list.slice(0, 8).map((item, index) => toForecastEntry(item, index));
  const daily = forecast.list.slice(0, 7).map((item, index) => toDailyEntry(item, index));

  return {
    current: {
      ...buildCurrentWeather(current, airQuality, forecast.city.timezone),
      city: label || current.name,
    },
    hourly,
    daily,
    airQuality,
  };
}
