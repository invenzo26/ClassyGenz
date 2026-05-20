import Link from "next/link";
import type { AssignmentListItem, UserRole } from "@/lib/supabase/types";

export function AssignmentList({ assignments, role }: { assignments: AssignmentListItem[]; role: UserRole }) {
  if (!assignments.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        {role === "teacher" ? "No assignments yet. Create the first one to start collecting student submissions." : "No assignments are available yet. Work assigned to your joined classes will appear here."}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {assignments.map((assignment) => (
        <article key={assignment.id} className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-panel">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{assignment.class?.name ?? "Class"}</p>
          <h3 className="mt-3 text-xl font-semibold text-ink">{assignment.title}</h3>
          {assignment.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{assignment.description}</p> : null}
          <p className="mt-3 text-sm text-slate-500">
            {assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleString()}` : "No due date"}
          </p>
          <Link href={`/assignments/${assignment.id}`} className="mt-4 inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
            Open assignment
          </Link>
        </article>
      ))}
    </div>
  );
}
