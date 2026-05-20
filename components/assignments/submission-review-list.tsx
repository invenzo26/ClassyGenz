"use client";

import { useActionState } from "react";
import { evaluateSubmissionAction } from "@/app/assignments/actions";
import type { SubmissionRecord } from "@/lib/supabase/types";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

function ReviewForm({ assignmentId, submission }: { assignmentId: string; submission: SubmissionRecord }) {
  const [state, formAction, pending] = useActionState(evaluateSubmissionAction, initialState);

  return (
    <form action={formAction} className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-panel">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="submissionId" value={submission.id} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{submission.student?.name ?? "Student"}</p>
          <p className="mt-1 text-sm text-slate-500">{submission.student?.email ?? submission.student_id}</p>
          <p className="mt-1 text-sm text-slate-500">Submitted {new Date(submission.created_at).toLocaleString()}</p>
        </div>
        <a href={submission.file_url} target="_blank" rel="noreferrer" className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
          Open file
        </a>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Marks</span>
          <input required name="marks" type="number" min="0" max="100" step="0.01" defaultValue={submission.marks ?? ""} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none focus:border-sky focus:bg-white" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Feedback</span>
          <input name="feedback" defaultValue={submission.feedback ?? ""} placeholder="Short feedback for the student" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none focus:border-sky focus:bg-white" />
        </label>
      </div>

      {state.error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="mt-4 inline-flex rounded-2xl bg-tide px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70">
        {pending ? "Saving..." : "Save evaluation"}
      </button>
    </form>
  );
}

export function SubmissionReviewList({ assignmentId, submissions }: { assignmentId: string; submissions: SubmissionRecord[] }) {
  if (!submissions.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        No submissions yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <ReviewForm key={submission.id} assignmentId={assignmentId} submission={submission} />
      ))}
    </div>
  );
}
