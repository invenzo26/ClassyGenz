"use client";

import { useActionState } from "react";
import { createSessionAction } from "@/app/sessions/actions";
import type { ClassListItem } from "@/lib/supabase/types";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

export function CreateSessionForm({ classes }: { classes: ClassListItem[] }) {
  const [state, formAction, pending] = useActionState(createSessionAction, initialState);

  if (!classes.length) {
    return null;
  }

  return (
    <form action={formAction} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Teacher Action</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Schedule a live session</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        ClassyGenz now creates a native live room for every session. Add an external link only as a backup.
      </p>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Class</span>
        <select
          required
          name="classId"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none focus:border-sky focus:bg-white"
        >
          <option value="">Select class</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Backup meeting link (optional)</span>
        <input
          name="meetingUrl"
          placeholder="Optional backup link"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none focus:border-sky focus:bg-white"
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Start time</span>
          <input
            required
            type="datetime-local"
            name="startTime"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none focus:border-sky focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">End time</span>
          <input
            type="datetime-local"
            name="endTime"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none focus:border-sky focus:bg-white"
          />
        </label>
      </div>

      {state.error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center justify-center rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Scheduling..." : "Schedule session"}
      </button>
    </form>
  );
}
