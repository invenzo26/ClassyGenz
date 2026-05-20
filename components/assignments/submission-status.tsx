import type { SubmissionRecord } from "@/lib/supabase/types";

export function SubmissionStatus({ submission }: { submission: SubmissionRecord | null }) {
  if (!submission) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        No submission yet.
      </div>
    );
  }

  return (
    <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Your Submission</p>
      <p className="mt-3 text-sm text-slate-600">Submitted {new Date(submission.created_at).toLocaleString()}</p>
      <a href={submission.file_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
        Open submitted file
      </a>
      <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Marks: {submission.marks ?? "Pending"}
      </div>
      {submission.feedback ? <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">{submission.feedback}</p> : null}
    </article>
  );
}
