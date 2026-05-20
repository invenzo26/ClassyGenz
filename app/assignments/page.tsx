import Link from "next/link";
import { AssignmentList } from "@/components/assignments/assignment-list";
import { CreateAssignmentForm } from "@/components/assignments/create-assignment-form";
import { ModuleCard } from "@/components/dashboard/module-card";
import { AppShell } from "@/components/layout/app-shell";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getAssignmentsForUser } from "@/lib/assignments";
import { getSessionContext } from "@/lib/auth";
import { getClassesForUser } from "@/lib/classroom";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const session = await getSessionContext();

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
          title="Sign in to open assignments"
          description="Assignments are tied to your classes, submissions, and teacher feedback."
        >
          <Link href="/auth" className="inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
            Go to auth
          </Link>
        </ModuleCard>
      </AppShell>
    );
  }

  const [assignments, teacherClasses] = await Promise.all([
    getAssignmentsForUser(session.user.id, session.profile.role),
    session.profile.role === "teacher" ? getClassesForUser(session.user.id, "teacher") : Promise.resolve([])
  ]);

  return (
    <AppShell currentPath="/assignments" userName={session.profile.name} userRole={session.profile.role} showSignOut>
      <div className="space-y-6">
        <ModuleCard
          eyebrow="Assignments"
          title={session.profile.role === "teacher" ? "Class work and submissions" : "Your assigned work"}
          description={session.profile.role === "teacher" ? "Create assignments, review submitted files, and return marks with feedback." : "Open assigned work, upload submissions, and review marks or feedback from teachers."}
        >
          <AssignmentList assignments={assignments} role={session.profile.role} />
        </ModuleCard>

        {session.profile.role === "teacher" ? <CreateAssignmentForm classes={teacherClasses} /> : null}
      </div>
    </AppShell>
  );
}
