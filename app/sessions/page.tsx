import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CreateSessionForm } from "@/components/sessions/create-session-form";
import { SessionList } from "@/components/sessions/session-list";
import { ModuleCard } from "@/components/dashboard/module-card";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getSessionContext } from "@/lib/auth";
import { getClassesForUser } from "@/lib/classroom";
import { getSessionsForUser } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const session = await getSessionContext();

  if (!session.configured) {
    return (
      <AppShell currentPath="/sessions">
        <SetupGuide />
      </AppShell>
    );
  }

  if (!session.user || !session.profile) {
    return (
      <AppShell currentPath="/sessions">
        <ModuleCard
          eyebrow="Access Needed"
          title="Sign in to manage or join sessions"
          description="The sessions area is now connected to attendance and proctoring flows, so it needs a real authenticated user."
        >
          <Link
            href="/auth"
            className="inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Go to auth
          </Link>
        </ModuleCard>
      </AppShell>
    );
  }

  const [sessions, teacherClasses] = await Promise.all([
    getSessionsForUser(session.user.id, session.profile.role),
    session.profile.role === "teacher"
      ? getClassesForUser(session.user.id, session.profile.role)
      : Promise.resolve([])
  ]);

  return (
    <AppShell
      currentPath="/sessions"
      userName={session.profile.name}
      userRole={session.profile.role}
      showSignOut
    >
      <div className="space-y-6">
        <ModuleCard
          eyebrow="Sessions"
          title="Live class sessions"
          description="Every session now opens a native ClassyGenz live room with attendance and browser-side proctoring attached."
        >
          <SessionList sessions={sessions} role={session.profile.role} />
        </ModuleCard>

        {session.profile.role === "teacher" ? <CreateSessionForm classes={teacherClasses} /> : null}
      </div>
    </AppShell>
  );
}
