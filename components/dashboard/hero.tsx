import { siteConfig } from "@/lib/site";

export function DashboardHero() {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-ink px-6 py-8 text-white shadow-panel sm:px-8">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.35em] text-sky">{siteConfig.name}</p>
        <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
          {siteConfig.tagline}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          A focused smart classroom workspace for class operations, live session monitoring,
          engagement scoring, and integrity insights.
        </p>
      </div>
    </section>
  );
}
