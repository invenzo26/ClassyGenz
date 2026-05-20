import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleCard } from "@/components/dashboard/module-card";
import { SetupGuide } from "@/components/setup/setup-guide";
import { AttendanceSummary } from "@/components/sessions/attendance-summary";
import { EventLog } from "@/components/sessions/event-log";
import { LiveClassRoom } from "@/components/sessions/live-class-room";
import { SessionMonitor } from "@/components/sessions/session-monitor";
import { getSessionContext } from "@/lib/auth";
import { getAttendanceForSession, getRecentEventsForSession, getSessionDetailForUser } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await getSessionContext();
  const { sessionId } = await params;

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
          title="Sign in to open this session room"
          description="Sessions are attendance-aware and permission-aware, so we need an authenticated user before loading them."
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

  const sessionItem = await getSessionDetailForUser(session.user.id, sessionId);

  if (!sessionItem) {
    notFound();
  }

  const [attendance, events] = await Promise.all([
    getAttendanceForSession(sessionId),
    getRecentEventsForSession(sessionId)
  ]);

  return (
    <AppShell
      currentPath="/sessions"
      userName={session.profile.name}
      userRole={session.profile.role}
      showSignOut
    >
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-white/70 bg-ink p-6 text-white shadow-panel">
          <p className="text-xs uppercase tracking-[0.25em] text-sky">Live Session Room</p>
          <h1 className="mt-3 text-3xl font-semibold">{sessionItem.class?.name ?? "Session"}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            This room now hosts the live class inside ClassyGenz, while attendance, browser monitoring, and evidence logs stay tied to one session record.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Starts</p>
              <p className="mt-2 text-sm font-medium text-white">
                {new Date(sessionItem.start_time).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ends</p>
              <p className="mt-2 text-sm font-medium text-white">
                {sessionItem.end_time ? new Date(sessionItem.end_time).toLocaleString() : "Open-ended"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Mode</p>
              <p className="mt-2 text-sm font-medium text-white">
                Native ClassyGenz room{sessionItem.meeting_url ? " + backup link" : ""}
              </p>
            </div>
          </div>
        </section>

        <LiveClassRoom
          sessionId={sessionId}
          currentUser={{
            id: session.user.id,
            name: session.profile.name,
            role: session.profile.role
          }}
          fallbackMeetingUrl={sessionItem.meeting_url}
        />

        <SessionMonitor sessionId={sessionId} />

        <section className="grid gap-6 xl:grid-cols-2">
          <AttendanceSummary attendees={attendance} />
          <EventLog events={events} />
        </section>
      </div>
    </AppShell>
  );
}
