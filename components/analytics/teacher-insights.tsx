import type { TeacherInsightDashboard } from "@/lib/supabase/types";

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">{text}</p>;
}

export function TeacherInsights({ insights }: { insights: TeacherInsightDashboard | null }) {
  if (!insights) {
    return <EmptyState text="No teacher insight data yet. Run sessions and evaluate assignments to fill this dashboard." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section>
        <h3 className="text-base font-semibold text-ink">Suspicious students</h3>
        <div className="mt-4 space-y-3">
          {insights.suspicious_students.length ? insights.suspicious_students.map((item) => (
            <div key={`${item.session_id}-${item.user_id}`} className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <p className="font-semibold">{item.user_name} - {item.score}% integrity</p>
              <p className="mt-1">{item.class_name}</p>
              <p className="mt-1 text-rose-700">{item.reason}</p>
            </div>
          )) : <EmptyState text="No suspicious integrity rows yet." />}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-ink">Low engagement</h3>
        <div className="mt-4 space-y-3">
          {insights.low_engagement_students.length ? insights.low_engagement_students.map((item) => (
            <div key={`${item.session_id}-${item.user_id}`} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">{item.user_name} - {item.score}% engagement</p>
              <p className="mt-1">{item.class_name}</p>
              <p className="mt-1 text-amber-800">{item.reason}</p>
            </div>
          )) : <EmptyState text="No low-engagement rows yet." />}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-ink">Weak assignment performance</h3>
        <div className="mt-4 space-y-3">
          {insights.weak_submissions.length ? insights.weak_submissions.map((item) => (
            <div key={item.submission_id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-ink">{item.student_name} - {item.marks ?? "Pending"}/100</p>
              <p className="mt-1">{item.assignment_title}</p>
              <p className="mt-1 text-slate-500">{item.class_name}</p>
            </div>
          )) : <EmptyState text="No evaluated low marks yet." />}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-ink">Recent evidence</h3>
        <div className="mt-4 space-y-3">
          {insights.recent_evidence.length ? insights.recent_evidence.map((item) => (
            <div key={item.event_id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-ink">{item.user_name} - {item.event_type}</p>
              <p className="mt-1">{item.class_name}</p>
              <a href={item.evidence_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-ink underline underline-offset-4">
                Open evidence
              </a>
            </div>
          )) : <EmptyState text="No evidence snapshots captured yet." />}
        </div>
      </section>
    </div>
  );
}
