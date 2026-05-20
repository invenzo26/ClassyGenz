import { AppShell } from "@/components/layout/app-shell";
import { ModuleCard } from "@/components/dashboard/module-card";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getSessionContext } from "@/lib/auth";

const events = [
  "tab_switch",
  "camera_off",
  "multiple_face",
  "copy_paste",
  "presence_ping"
];

export const dynamic = "force-dynamic";

export default async function ProctoringPage() {
  const session = await getSessionContext();

  return (
    <AppShell
      currentPath="/proctoring"
      userName={session.profile?.name ?? null}
      userRole={session.profile?.role ?? null}
      showSignOut={Boolean(session.user)}
    >
      <div className="space-y-6">
        {!session.configured ? <SetupGuide /> : null}
        <ModuleCard
          eyebrow="Proctoring"
          title="Client tracking and trusted logging"
          description="The first monitoring pipeline is now session-based: students and teachers open a session room, start monitoring, and the browser sends authenticated events to the backend."
        >
          <div className="flex flex-wrap gap-3">
            {events.map((event) => (
              <span
                key={event}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                {event}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">Attendance tracked with join, heartbeat, and leave updates</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">Browser events captured through authenticated API routes</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">Session detail pages show event evidence in a transparent feed</div>
          </div>
        </ModuleCard>
      </div>
    </AppShell>
  );
}
