import type { AnalyticsSummary } from "@/lib/supabase/types";

export function AnalyticsSummaryCards({ summary }: { summary: AnalyticsSummary }) {
  const cards = [
    {
      label: "Sessions covered",
      value: String(summary.total_sessions),
      detail: "Recent sessions included in the current analytics pass."
    },
    {
      label: "Avg engagement",
      value: `${summary.average_engagement}%`,
      detail: "Attendance, heartbeat presence, and in-class messaging."
    },
    {
      label: "Avg integrity",
      value: `${summary.average_integrity}%`,
      detail: "Starts at 100 and drops as suspicious signals accumulate."
    },
    {
      label: "Suspicious rows",
      value: String(summary.suspicious_count),
      detail: "Users with integrity below 70 in the analyzed sessions."
    }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-panel"
        >
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-4 text-3xl font-semibold text-ink">{card.value}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}
