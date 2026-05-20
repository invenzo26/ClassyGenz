import type { ClassMemberRecord } from "@/lib/supabase/types";

export function ClassMemberList({ members }: { members: ClassMemberRecord[] }) {
  if (!members.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        No members yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{member.user?.name ?? "Unknown user"}</p>
              <p className="mt-1 text-sm text-slate-500">{member.user?.email ?? member.user_id}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {member.role}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
