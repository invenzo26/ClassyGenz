import { AppShell } from "@/components/layout/app-shell";
import { FormulaCard } from "@/components/analytics/formula-card";
import { ScoreTable } from "@/components/analytics/score-table";
import { AnalyticsSummaryCards } from "@/components/analytics/summary-cards";
import { TeacherInsights } from "@/components/analytics/teacher-insights";
import { ModuleCard } from "@/components/dashboard/module-card";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getSessionContext } from "@/lib/auth";
import { getAnalyticsDashboard } from "@/lib/analytics";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getSessionContext();

  if (!session.configured) {
    return (
      <AppShell currentPath="/analytics">
        <SetupGuide />
      </AppShell>
    );
  }

  if (!session.user || !session.profile) {
    return (
      <AppShell currentPath="/analytics">
        <ModuleCard
          eyebrow="Access Needed"
          title="Sign in to open analytics"
          description="Score generation depends on authenticated classroom data, so we need a real user session before computing analytics."
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

  const dashboard = await getAnalyticsDashboard(session.user.id, session.profile.role);

  return (
    <AppShell
      currentPath="/analytics"
      userName={session.profile.name}
      userRole={session.profile.role}
      showSignOut
    >
      <div className="space-y-6">
        <AnalyticsSummaryCards summary={dashboard.summary} />
        {session.profile.role === "teacher" ? (
          <ModuleCard
            eyebrow="Teacher Dashboard"
            title="Students needing attention"
            description="A focused view of integrity risk, engagement risk, weak assignment results, and recent evidence."
          >
            <TeacherInsights insights={dashboard.teacherInsights} />
          </ModuleCard>
        ) : null}

        <FormulaCard />
        <ModuleCard
          eyebrow="Scoreboard"
          title={
            session.profile.role === "teacher"
              ? "Student risk and engagement view"
              : "Your session-by-session score view"
          }
          description={
            session.profile.role === "teacher"
              ? "This is the first teacher-facing integrity and engagement dashboard powered directly by attendance and event logs."
              : "These scores come from your own attendance, presence pings, and session behavior signals."
          }
        >
          <ScoreTable rows={dashboard.rows} role={session.profile.role} />
        </ModuleCard>
      </div>
    </AppShell>
  );
}
