import Link from "next/link";
import { notFound } from "next/navigation";
import { AddStudentForm } from "@/components/classes/add-student-form";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleCard } from "@/components/dashboard/module-card";
import { SetupGuide } from "@/components/setup/setup-guide";
import { ClassMemberList } from "@/components/classes/class-member-list";
import { ClassSummary } from "@/components/classes/class-summary";
import { MessageFeed } from "@/components/classes/message-feed";
import { MaterialsList } from "@/components/classes/materials-list";
import { PostMessageForm } from "@/components/classes/post-message-form";
import { RealtimeMessageListener } from "@/components/classes/realtime-message-listener";
import { UploadMaterialForm } from "@/components/classes/upload-material-form";
import { getSessionContext } from "@/lib/auth";
import {
  getClassDetailForUser,
  getClassMembers,
  getMaterialsForClass,
  getMessagesForClass
} from "@/lib/classroom";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await getSessionContext();
  const { classId } = await params;

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
          title="Sign in to open this classroom"
          description="Class streams are personalized and permission-aware, so we need an authenticated user session before loading them."
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

  const classItem = await getClassDetailForUser(session.user.id, classId);

  if (!classItem) {
    notFound();
  }

  const [messages, materials, members] = await Promise.all([
    getMessagesForClass(classId),
    getMaterialsForClass(classId),
    getClassMembers(classId)
  ]);

  return (
    <AppShell
      currentPath="/classes"
      userName={session.profile.name}
      userRole={session.profile.role}
      showSignOut
    >
      <RealtimeMessageListener classId={classId} />

      <div className="space-y-6">
        <ClassSummary classItem={classItem} />

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <PostMessageForm classId={classId} role={session.profile.role} />
            <ModuleCard
              eyebrow="Class Stream"
              title="Announcements and discussion"
              description="This combines teacher announcements and class chat in one timeline so the classroom feels alive."
            >
              <MessageFeed
                messages={messages}
                currentUserId={session.user.id}
                currentRole={session.profile.role}
              />
            </ModuleCard>
          </div>

          <div className="space-y-6">
            <ModuleCard
              eyebrow="Resources"
              title="Study materials"
              description="Teachers can upload notes, PDFs, and worksheets here for controlled classroom access."
            >
              <MaterialsList materials={materials} />
            </ModuleCard>

            {session.profile.role === "teacher" ? <UploadMaterialForm classId={classId} /> : null}

            <ModuleCard
              eyebrow="Members"
              title="Class roster"
              description="Students added here can access this class, its assignments, sessions, and classroom stream."
            >
              <ClassMemberList members={members} />
            </ModuleCard>

            {session.profile.role === "teacher" ? <AddStudentForm classId={classId} /> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
