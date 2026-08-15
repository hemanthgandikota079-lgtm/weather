import { type ReactNode } from "react";
import type { ForecastEntry } from "../types";

interface ForecastChartProps {
  title: string;
  series: ForecastEntry[];
  accent: string;
}

export function ForecastChart({ title, series, accent }: ForecastChartProps) {
  const maxTemp = Math.max(...series.map(s => s.temp));
  const minTemp = Math.min(...series.map(s => s.temp));
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-slate-900/70 p-4">
      <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
      <div className="space-y-3">
        {series.map((entry, idx) => {
          const normalizedTemp = ((entry.temp - minTemp) / tempRange) * 100;
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-12 text-xs text-slate-400 text-right">
                <div>{entry.label}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-full overflow-hidden rounded-full bg-slate-800/50">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${normalizedTemp}%`,
                        backgroundColor: accent,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="w-12 text-xs font-semibold text-white text-right">{entry.temp}°</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
