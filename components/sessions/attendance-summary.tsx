import type { SessionParticipant } from "@/lib/supabase/types";

export function AttendanceSummary({ attendees }: { attendees: SessionParticipant[] }) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Attendance</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Session participation log</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Joined, heartbeat, and leave timestamps build the basis for attendance and engagement scoring.
      </p>

      <div className="mt-5 space-y-3">
        {!attendees.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
            No attendance records yet.
          </div>
        ) : (
          attendees.map((attendee) => (
            <div key={attendee.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>User ID: {attendee.user_id}</p>
              <p className="mt-1">Joined: {new Date(attendee.joined_at).toLocaleString()}</p>
              <p className="mt-1">Last seen: {attendee.last_seen_at ? new Date(attendee.last_seen_at).toLocaleString() : "Not yet"}</p>
              <p className="mt-1">Left: {attendee.left_at ? new Date(attendee.left_at).toLocaleString() : "Still active"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
