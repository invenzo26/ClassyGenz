"use client";

import { useActionState } from "react";
import { postMessageAction } from "@/app/classes/[classId]/actions";
import type { UserRole } from "@/lib/supabase/types";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

export function PostMessageForm({
  classId,
  role
}: {
  classId: string;
  role: UserRole;
}) {
  const [state, formAction, pending] = useActionState(postMessageAction, initialState);

  return (
    <form action={formAction} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <input type="hidden" name="classId" value={classId} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Class Stream</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {role === "teacher" ? "Post an update" : "Join the discussion"}
          </h2>
        </div>
        <select
          name="type"
          defaultValue="text"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none focus:border-sky focus:bg-white"
        >
          <option value="text">Message</option>
          {role === "teacher" ? <option value="announcement">Announcement</option> : null}
        </select>
      </div>

      <textarea
        required
        name="message"
        rows={5}
        placeholder={
          role === "teacher"
            ? "Share an announcement, class update, or guidance for students..."
            : "Ask a doubt or send a class message..."
        }
        className="mt-5 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-ink outline-none transition focus:border-sky focus:bg-white"
      />

      {state.error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center justify-center rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Posting..." : "Post to class"}
      </button>
    </form>
  );
}
