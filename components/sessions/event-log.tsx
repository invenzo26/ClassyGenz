import type { SessionEventRecord } from "@/lib/supabase/types";

export function EventLog({ events }: { events: SessionEventRecord[] }) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Event Feed</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Recent proctoring signals</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This feed is a transparent record of captured browser and presence events for the session.
      </p>

      <div className="mt-5 space-y-3">
        {!events.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
            No event signals recorded yet.
          </div>
        ) : (
          events.map((event) => {
            const evidenceUrl =
              typeof event.metadata.evidence_url === "string" ? event.metadata.evidence_url : null;

            return (
              <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    {event.type}
                  </span>
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                  {evidenceUrl ? (
                    <a href={evidenceUrl} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink underline underline-offset-4">
                      Open evidence
                    </a>
                  ) : null}
                </div>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-white px-3 py-2 text-xs text-slate-600">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
