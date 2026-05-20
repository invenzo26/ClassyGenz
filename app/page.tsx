import { AppShell } from "@/components/layout/app-shell";
import { DashboardHero } from "@/components/dashboard/hero";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ModuleCard } from "@/components/dashboard/module-card";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getSessionContext } from "@/lib/auth";
import { DashboardMetric } from "@/lib/supabase/types";

const metrics: DashboardMetric[] = [
  {
    label: "MVP Scope",
    value: "6 modules",
    detail: "Auth, classes, chat, assignments, event tracking, and teacher reports."
  },
  {
    label: "Realtime Layer",
    value: "Supabase",
    detail: "Presence, announcements, and live classroom updates can share one backend path."
  },
  {
    label: "Core Differentiator",
    value: "Integrity Score",
    detail: "Events are logged first, then translated into evidence-backed classroom insight."
  }
];

const foundationModules = [
  "Classroom operations: classes, members, announcements, materials, assignments",
  "Realtime experience: chat, session activity, teacher dashboard updates",
  "Proctoring pipeline: browser event collection, trusted event logging, evidence storage",
  "Analytics pipeline: rule-based engagement and integrity scoring"
];

export default function HomePage() {
  const sessionPromise = getSessionContext();

  return <HomePageContent sessionPromise={sessionPromise} />;
}

async function HomePageContent({
  sessionPromise
}: {
  sessionPromise: ReturnType<typeof getSessionContext>;
}) {
  const session = await sessionPromise;

  return (
    <AppShell
      currentPath="/"
      userName={session.profile?.name ?? null}
      userRole={session.profile?.role ?? null}
      showSignOut={Boolean(session.user)}
    >
      <div className="space-y-6">
        {!session.configured ? <SetupGuide /> : null}
        <DashboardHero />

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <ModuleCard
            eyebrow="Development Architecture"
            title="How we are structuring the product"
            description="We are separating product concerns by capability so each layer can grow without rewriting the rest of the app."
          >
            <div className="grid gap-3">
              {foundationModules.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </ModuleCard>

          <ModuleCard
            eyebrow="Build Order"
            title="What gets implemented first"
            description="The first delivery should make the classroom usable before we deepen proctoring and teacher intelligence."
          >
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-mist px-4 py-3">1. Auth and role-aware dashboard</div>
              <div className="rounded-2xl bg-mist px-4 py-3">2. Class creation, membership, and announcements</div>
              <div className="rounded-2xl bg-mist px-4 py-3">3. Assignments, submissions, and storage</div>
              <div className="rounded-2xl bg-mist px-4 py-3">4. Session event tracking and score reporting</div>
            </div>
          </ModuleCard>
        </section>
      </div>
    </AppShell>
  );
}
