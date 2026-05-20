"use client";

import { useActionState } from "react";
import { addStudentToClassAction } from "@/app/classes/enrollment-actions";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

export function AddStudentForm({ classId }: { classId: string }) {
  const [state, formAction, pending] = useActionState(addStudentToClassAction, initialState);

  return (
    <form action={formAction} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <input type="hidden" name="classId" value={classId} />
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Enrollment</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Add student</h2>
      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Student email</span>
        <input required name="email" type="email" placeholder="student@example.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky focus:bg-white" />
      </label>
      {state.error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="mt-5 inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
        {pending ? "Adding..." : "Add student"}
      </button>
    </form>
  );
}
