import Link from "next/link";
import type { ClassListItem, UserRole } from "@/lib/supabase/types";

export function ClassList({
  classes,
  role
}: {
  classes: ClassListItem[];
  role: UserRole;
}) {
  if (!classes.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        {role === "teacher"
          ? "No classes yet. Create the first class and we can start wiring announcements, assignments, and sessions into it."
          : "You have not joined any classes yet. Once teachers enroll you, your classroom list will appear here."}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {classes.map((classItem) => (
        <article
          key={classItem.id}
          className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-panel"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {role === "teacher" ? "Owned class" : "Joined class"}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-ink">{classItem.name}</h3>
          <p className="mt-3 text-sm text-slate-600">Teacher ID: {classItem.teacher_id}</p>
          <p className="mt-2 text-sm text-slate-500">
            Created {new Date(classItem.created_at).toLocaleDateString()}
          </p>
          <Link
            href={`/classes/${classItem.id}`}
            className="mt-4 inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Open classroom
          </Link>
        </article>
      ))}
    </div>
  );
}
