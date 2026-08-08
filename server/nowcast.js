/**
 * Very small heuristic nowcast for MVP.
 * - Uses 'minutely' if available to detect immediate precipitation onset
 * - Uses hourly probabilities to estimate rain in next 1-3 hours with simple trend
 */

export function computeNowcast(weather) {
  const now = Date.now();
  const result = { precipitationNow: false, onsetMinutes: null, confidence: 'low', description: '' };

  if (weather.minutely && weather.minutely.length) {
    // minutely: [{ dt, precipitation }, ...]
    const precip = weather.minutely.reduce((acc, m) => acc + (m.precipitation || 0), 0);
    const any = weather.minutely.some(m => (m.precipitation || 0) > 0);
    result.precipitationNow = any;
    result.onsetMinutes = any ? 0 : null;
    result.confidence = any ? 'high' : result.confidence;
    result.description = any ? 'Precipitation reported in minutely data.' : result.description;
  }

  // hourly trend for 1-3 hours
  if (weather.hourly && weather.hourly.length) {
    const next3 = weather.hourly.slice(0, 3);
    // use 'pop' (probability of precipitation) and any rain field
    let likelyHour = null;
    for (let i = 0; i < next3.length; i++) {
      const h = next3[i];
      const pop = h.pop || 0;
      const hasRain = (h.rain && Object.values(h.rain).some(v => v > 0));
      if (pop >= 0.5 || hasRain) { likelyHour = i; break; }
    }
    if (likelyHour !== null) {
      result.onsetMinutes = result.onsetMinutes === 0 ? 0 : likelyHour * 60;
      if (result.confidence !== 'high') result.confidence = 'medium';
      result.description = result.description || `Precipitation likely in about ${likelyHour} hour(s).`;
    }
  }

  if (!result.description) result.description = 'No short-term precipitation detected.';
  return result;
}
