import { ReactNode } from "react";

export function ModuleCard({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
