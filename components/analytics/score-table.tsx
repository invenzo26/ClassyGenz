import type { SessionScoreRow, UserRole } from "@/lib/supabase/types";

export function ScoreTable({
  rows,
  role
}: {
  rows: SessionScoreRow[];
  role: UserRole;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        No score rows yet. Run a session with attendance and events first, then analytics will start filling in here.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {role === "teacher" ? <th className="px-4 py-3 font-medium">Student</th> : null}
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Engagement</th>
              <th className="px-4 py-3 font-medium">Integrity</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
              <th className="px-4 py-3 font-medium">Messages</th>
              <th className="px-4 py-3 font-medium">Signals</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.session_id}-${row.user_id}`} className="border-t border-slate-100 text-slate-700">
                {role === "teacher" ? <td className="px-4 py-4">{row.user_name}</td> : null}
                <td className="px-4 py-4">{row.class_name}</td>
                <td className="px-4 py-4">{new Date(row.session_start).toLocaleString()}</td>
                <td className="px-4 py-4">{row.engagement_score}%</td>
                <td className="px-4 py-4">{row.integrity_score}%</td>
                <td className="px-4 py-4">{row.attendance_minutes} min</td>
                <td className="px-4 py-4">{row.message_count}</td>
                <td className="px-4 py-4">
                  {Object.entries(row.event_counts)
                    .filter(([, count]) => count)
                    .map(([event, count]) => `${event}:${count}`)
                    .join(", ") || "clean"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
