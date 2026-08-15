import { type ReactNode } from "react";

interface SectionCardProps {
  title: string;
  content?: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  accent?: string;
}

export function SectionCard({ title, content, description, icon, children, accent = "#8b5cf6" }: SectionCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
        {icon ? <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} /> : null}
      </div>
      {content ? <p className="text-sm text-slate-300">{content}</p> : children}
    </section>
  );
}
