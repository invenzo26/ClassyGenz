import Link from "next/link";
import type { SessionListItem, UserRole } from "@/lib/supabase/types";

export function SessionList({
  sessions,
  role
}: {
  sessions: SessionListItem[];
  role: UserRole;
}) {
  if (!sessions.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        {role === "teacher"
          ? "No sessions scheduled yet. Create one and we can start tying attendance and behavior events to it."
          : "No sessions are available yet. Scheduled live classes will appear here."}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {sessions.map((session) => (
        <article key={session.id} className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-panel">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{session.class?.name ?? "Class"}</p>
          <h3 className="mt-3 text-xl font-semibold text-ink">
            {new Date(session.start_time).toLocaleString()}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {session.meeting_url ? "Native room with backup link" : "Native ClassyGenz room"}
          </p>
          {session.end_time ? (
            <p className="mt-2 text-sm text-slate-500">
              Ends {new Date(session.end_time).toLocaleString()}
            </p>
          ) : null}
          <Link
            href={`/sessions/${session.id}`}
            className="mt-4 inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Open session room
          </Link>
        </article>
      ))}
    </div>
  );
}
