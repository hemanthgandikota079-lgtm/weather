import { type ReactNode } from "react";

interface MetricTileProps {
  label: string;
  value: string;
  secondary?: string;
  icon: ReactNode;
  accent?: string;
}

export function MetricTile({ label, value, secondary, icon, accent = "#8b5cf6" }: MetricTileProps) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-slate-900/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span className="rounded-full p-2" style={{ backgroundColor: `${accent}20`, color: accent }}>
          {icon}
        </span>
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
      {secondary && <p className="mt-1 text-xs text-slate-500">{secondary}</p>}
    </div>
  );
}
