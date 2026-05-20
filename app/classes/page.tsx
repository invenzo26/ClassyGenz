import Link from "next/link";
import { ClassList } from "@/components/classes/class-list";
import { CreateClassForm } from "@/components/classes/create-class-form";
import { ModuleCard } from "@/components/dashboard/module-card";
import { AppShell } from "@/components/layout/app-shell";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getSessionContext } from "@/lib/auth";
import { getClassesForUser } from "@/lib/classroom";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await getSessionContext();

  if (!session.configured) {
    return (
      <AppShell currentPath="/classes">
        <SetupGuide />
      </AppShell>
    );
  }

  if (!session.user || !session.profile) {
    return (
      <AppShell currentPath="/classes">
        <ModuleCard
          eyebrow="Access Needed"
          title="Sign in to access your classroom space"
          description="The classes module is database-backed now, so we need an authenticated user to load the right teacher or student view."
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

  const classes = await getClassesForUser(session.user.id, session.profile.role);

  return (
    <AppShell
      currentPath="/classes"
      userName={session.profile.name}
      userRole={session.profile.role}
      showSignOut
    >
      <div className="space-y-6">
        <ModuleCard
          eyebrow="Classes"
          title={
            session.profile.role === "teacher"
              ? "Your teaching spaces"
              : "Your joined classrooms"
          }
          description={
            session.profile.role === "teacher"
              ? "Create classes here first. Announcements, assignments, materials, and sessions will hang off this foundation."
              : "This is where students will see each class they are enrolled in, along with the activity we add in the next phases."
          }
        >
          <ClassList classes={classes} role={session.profile.role} />
        </ModuleCard>

        {session.profile.role === "teacher" ? <CreateClassForm /> : null}
      </div>
    </AppShell>
  );
}
