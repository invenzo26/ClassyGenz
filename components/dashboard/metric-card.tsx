import { DashboardMetric } from "@/lib/supabase/types";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-panel backdrop-blur">
      <p className="text-sm font-medium text-slate-500">{metric.label}</p>
      <p className="mt-4 text-3xl font-semibold text-ink">{metric.value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{metric.detail}</p>
    </article>
  );
}
