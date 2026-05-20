"use client";

import { useActionState } from "react";
import { createClassAction } from "@/app/classes/actions";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

export function CreateClassForm() {
  const [state, formAction, pending] = useActionState(createClassAction, initialState);

  return (
    <form action={formAction} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Teacher Action</p>
      <h3 className="mt-3 text-xl font-semibold text-ink">Create a class</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Start with a clean class shell, then add announcements, materials, assignments, and session links.
      </p>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Class name</span>
        <input
          required
          name="name"
          placeholder="e.g. Grade 10 Science"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky focus:bg-white"
        />
      </label>

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
        {pending ? "Creating..." : "Create class"}
      </button>
    </form>
  );
}
