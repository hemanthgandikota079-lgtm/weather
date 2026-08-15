import { ArrowRight, Bookmark, Trash2 } from "lucide-react";
import { NavLink } from "react-router-dom";

interface SavedLocationsPageProps {
  savedLocations: string[];
  onSelect: (city: string) => void;
  onRemove: (city: string) => void;
}

export function SavedLocationsPage({ savedLocations, onSelect, onRemove }: SavedLocationsPageProps) {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-[2rem] border border-white/10 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-cyan-300">
            <Bookmark size={16} />
            <span className="text-xs font-mono uppercase tracking-widest">Saved locations</span>
          </div>
          <h2 className="text-2xl font-semibold text-white">Your bookmarks</h2>
        </div>
        <nav className="flex gap-2">
          <NavLink to="/" className="rounded-full px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">Home</NavLink>
          <NavLink to="/history" className="rounded-full px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">History</NavLink>
        </nav>
      </div>

      {savedLocations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/60">
          No saved locations yet. Start by searching for a city and saving it.
        </div>
      ) : (
        <div className="space-y-3">
          {savedLocations.map((city) => (
            <div
              key={city}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
            >
              <span className="font-medium">{city}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelect(city)}
                  className="flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
                >
                  View weather <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => onRemove(city)}
                  className="rounded-full p-1 text-white/50 transition hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
