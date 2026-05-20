import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionReviewList } from "@/components/assignments/submission-review-list";
import { SubmissionStatus } from "@/components/assignments/submission-status";
import { SubmitAssignmentForm } from "@/components/assignments/submit-assignment-form";
import { ModuleCard } from "@/components/dashboard/module-card";
import { AppShell } from "@/components/layout/app-shell";
import { SetupGuide } from "@/components/setup/setup-guide";
import {
  getAssignmentDetailForUser,
  getSubmissionForStudent,
  getSubmissionsForAssignment
} from "@/lib/assignments";
import { getSessionContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({
  params
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const session = await getSessionContext();
  const { assignmentId } = await params;

  if (!session.configured) {
    return (
      <AppShell currentPath="/assignments">
        <SetupGuide />
      </AppShell>
    );
  }

  if (!session.user || !session.profile) {
    return (
      <AppShell currentPath="/assignments">
        <ModuleCard
          eyebrow="Access Needed"
          title="Sign in to open this assignment"
          description="Assignment details are permission-aware and tied to your classroom membership."
        >
          <Link href="/auth" className="inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
            Go to auth
          </Link>
        </ModuleCard>
      </AppShell>
    );
  }

  const assignment = await getAssignmentDetailForUser(session.user.id, assignmentId);

  if (!assignment) {
    notFound();
  }

  const isTeacher = session.profile.role === "teacher";
  const [submissions, ownSubmission] = await Promise.all([
    isTeacher ? getSubmissionsForAssignment(assignmentId) : Promise.resolve([]),
    !isTeacher ? getSubmissionForStudent(assignmentId, session.user.id) : Promise.resolve(null)
  ]);

  return (
    <AppShell currentPath="/assignments" userName={session.profile.name} userRole={session.profile.role} showSignOut>
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-white/70 bg-ink p-6 text-white shadow-panel">
          <p className="text-xs uppercase tracking-[0.25em] text-sky">{assignment.class?.name ?? "Class Assignment"}</p>
          <h1 className="mt-3 text-3xl font-semibold">{assignment.title}</h1>
          {assignment.description ? <p className="mt-4 text-sm leading-7 text-slate-300">{assignment.description}</p> : null}
          <p className="mt-5 text-sm text-slate-300">
            {assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleString()}` : "No due date"}
          </p>
        </section>

        {isTeacher ? (
          <ModuleCard
            eyebrow="Teacher Review"
            title="Submitted work"
            description="Open student files, add marks, and leave concise feedback."
          >
            <SubmissionReviewList assignmentId={assignmentId} submissions={submissions} />
          </ModuleCard>
        ) : (
          <section className="grid gap-6 xl:grid-cols-2">
            <SubmitAssignmentForm assignmentId={assignmentId} />
            <SubmissionStatus submission={ownSubmission} />
          </section>
        )}
      </div>
    </AppShell>
  );
}
