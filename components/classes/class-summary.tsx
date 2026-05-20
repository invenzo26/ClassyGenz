import type { ClassDetail } from "@/lib/supabase/types";

export function ClassSummary({ classItem }: { classItem: ClassDetail }) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-ink p-6 text-white shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-sky">Classroom Space</p>
      <h1 className="mt-3 text-3xl font-semibold">{classItem.name}</h1>
      <p className="mt-4 text-sm leading-7 text-slate-300">
        This page groups the class stream, announcements, and materials so teachers and students
        have one operational home for day-to-day activity.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Teacher</p>
          <p className="mt-2 text-sm font-medium text-white">{classItem.teacher?.name ?? "Unknown"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact</p>
          <p className="mt-2 text-sm font-medium text-white">{classItem.teacher?.email ?? "Not available"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
          <p className="mt-2 text-sm font-medium text-white">
            {new Date(classItem.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </section>
  );
}
