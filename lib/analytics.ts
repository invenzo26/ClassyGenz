import { createClient } from "@/lib/supabase/server";
import { getSessionsForUser } from "@/lib/sessions";
import type {
  AnalyticsSummary,
  EventType,
  SessionEventRecord,
  SessionListItem,
  SessionParticipant,
  SessionScoreRow,
  TeacherInsightDashboard,
  UserRole
} from "@/lib/supabase/types";

const INTEGRITY_PENALTIES: Record<EventType, number> = {
  tab_switch: 10,
  camera_off: 20,
  multiple_face: 30,
  copy_paste: 10,
  presence_ping: 0,
  fullscreen_exit: 15
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

function getMinutesBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, diff / 60000);
}

function summarizeRows(rows: SessionScoreRow[]): AnalyticsSummary {
  if (!rows.length) {
    return {
      total_sessions: 0,
      average_engagement: 0,
      average_integrity: 0,
      suspicious_count: 0,
      low_engagement_count: 0
    };
  }

  const averageEngagement =
    rows.reduce((total, row) => total + row.engagement_score, 0) / rows.length;
  const averageIntegrity =
    rows.reduce((total, row) => total + row.integrity_score, 0) / rows.length;

  return {
    total_sessions: new Set(rows.map((row) => row.session_id)).size,
    average_engagement: round(averageEngagement),
    average_integrity: round(averageIntegrity),
    suspicious_count: rows.filter((row) => row.integrity_score < 70).length,
    low_engagement_count: rows.filter((row) => row.engagement_score < 60).length
  };
}

async function computeScoresForSession(session: SessionListItem) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const sessionEnd = session.end_time ?? nowIso;
  const plannedMinutes = Math.max(30, getMinutesBetween(session.start_time, sessionEnd) || 60);

  const [participantsResult, eventsResult, messagesResult, usersResult] = await Promise.all([
    supabase
      .from("session_participants")
      .select("id, session_id, user_id, joined_at, last_seen_at, left_at")
      .eq("session_id", session.id)
      .returns<SessionParticipant[]>(),
    supabase
      .from("events")
      .select("id, user_id, session_id, type, metadata, timestamp")
      .eq("session_id", session.id)
      .returns<SessionEventRecord[]>(),
    supabase
      .from("messages")
      .select("sender_id, created_at")
      .eq("class_id", session.class_id)
      .gte("created_at", session.start_time)
      .lte("created_at", sessionEnd)
      .returns<{ sender_id: string; created_at: string }[]>(),
    supabase
      .from("users")
      .select("id, name, role")
      .returns<{ id: string; name: string; role: UserRole }[]>()
  ]);

  if (participantsResult.error) {
    throw new Error(participantsResult.error.message);
  }

  if (eventsResult.error) {
    throw new Error(eventsResult.error.message);
  }

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  if (usersResult.error) {
    throw new Error(usersResult.error.message);
  }

  const participants = participantsResult.data ?? [];
  const events = eventsResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const users = new Map((usersResult.data ?? []).map((user) => [user.id, user]));

  const rows: SessionScoreRow[] = participants.map((participant) => {
    const participantEvents = events.filter((event) => event.user_id === participant.user_id);
    const messageCount = messages.filter((message) => message.sender_id === participant.user_id).length;
    const eventCounts = participantEvents.reduce<Partial<Record<EventType, number>>>((counts, event) => {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
      return counts;
    }, {});

    const attendanceEnd = participant.left_at ?? participant.last_seen_at ?? nowIso;
    const attendanceMinutes = round(getMinutesBetween(participant.joined_at, attendanceEnd));
    const attendanceRatio = clamp(attendanceMinutes / plannedMinutes, 0, 1);
    const presencePings = eventCounts.presence_ping ?? 0;
    const presenceRatio = clamp(presencePings / Math.max(1, Math.ceil(plannedMinutes / 10)), 0, 1);
    const messageRatio = clamp(messageCount / 3, 0, 1);

    const engagementScore = round(attendanceRatio * 55 + presenceRatio * 25 + messageRatio * 20);
    const integrityPenalty = participantEvents.reduce((total, event) => {
      return total + INTEGRITY_PENALTIES[event.type];
    }, 0);
    const integrityScore = clamp(100 - integrityPenalty, 0, 100);
    const user = users.get(participant.user_id);

    return {
      user_id: participant.user_id,
      user_name: user?.name ?? "Unknown user",
      user_role: user?.role ?? "student",
      session_id: session.id,
      class_id: session.class_id,
      class_name: session.class?.name ?? "Class",
      session_start: session.start_time,
      engagement_score: engagementScore,
      integrity_score: integrityScore,
      event_counts: eventCounts,
      message_count: messageCount,
      attendance_minutes: attendanceMinutes
    };
  });

  if (rows.length) {
    const { error } = await supabase.from("scores").upsert(
      rows.map((row) => ({
        user_id: row.user_id,
        session_id: row.session_id,
        engagement_score: row.engagement_score,
        integrity_score: row.integrity_score,
        updated_at: nowIso
      })),
      { onConflict: "user_id,session_id" }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  return rows;
}

async function getTeacherInsights(userId: string, rows: SessionScoreRow[]): Promise<TeacherInsightDashboard | null> {
  const supabase = await createClient();
  const teacherClassIds = Array.from(new Set(rows.map((row) => row.class_id)));

  if (!teacherClassIds.length) {
    return null;
  }

  const suspiciousStudents = rows
    .filter((row) => row.integrity_score < 70)
    .slice(0, 6)
    .map((row) => ({
      user_id: row.user_id,
      user_name: row.user_name,
      class_name: row.class_name,
      session_id: row.session_id,
      score: row.integrity_score,
      reason: Object.entries(row.event_counts)
        .filter(([, count]) => count)
        .map(([event, count]) => `${event}: ${count}`)
        .join(", ") || "Integrity score below threshold"
    }));

  const lowEngagementStudents = rows
    .filter((row) => row.engagement_score < 60)
    .sort((left, right) => left.engagement_score - right.engagement_score)
    .slice(0, 6)
    .map((row) => ({
      user_id: row.user_id,
      user_name: row.user_name,
      class_name: row.class_name,
      session_id: row.session_id,
      score: row.engagement_score,
      reason: `${row.attendance_minutes} attendance minutes, ${row.message_count} messages`
    }));

  const { data: submissions, error: submissionError } = await supabase
    .from("submissions")
    .select("id, assignment_id, student_id, marks, created_at, assignment:assignments(title, class_id, class:classes(name, teacher_id)), student:users(name)")
    .lte("marks", 50)
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<{
      id: string;
      assignment_id: string;
      student_id: string;
      marks: number | null;
      created_at: string;
      assignment: {
        title: string;
        class_id: string;
        class: { name: string; teacher_id: string } | null;
      } | null;
      student: { name: string } | null;
    }[]>();

  if (submissionError) {
    throw new Error(submissionError.message);
  }

  const weakSubmissions = (submissions ?? [])
    .filter((submission) => submission.assignment?.class?.teacher_id === userId)
    .map((submission) => ({
      submission_id: submission.id,
      assignment_id: submission.assignment_id,
      assignment_title: submission.assignment?.title ?? "Assignment",
      class_name: submission.assignment?.class?.name ?? "Class",
      student_name: submission.student?.name ?? "Student",
      marks: submission.marks,
      submitted_at: submission.created_at
    }));

  const { data: evidenceEvents, error: evidenceError } = await supabase
    .from("events")
    .select("id, user_id, session_id, type, metadata, timestamp, session:sessions(class_id, class:classes(name, teacher_id)), user:users(name)")
    .order("timestamp", { ascending: false })
    .limit(30)
    .returns<{
      id: string;
      user_id: string;
      session_id: string;
      type: EventType;
      metadata: Record<string, unknown>;
      timestamp: string;
      session: { class_id: string; class: { name: string; teacher_id: string } | null } | null;
      user: { name: string } | null;
    }[]>();

  if (evidenceError) {
    throw new Error(evidenceError.message);
  }

  const evidence = (evidenceEvents ?? [])
    .filter((event) => event.session?.class?.teacher_id === userId)
    .filter((event) => typeof event.metadata.evidence_url === "string")
    .slice(0, 6)
    .map((event) => ({
      event_id: event.id,
      user_id: event.user_id,
      user_name: event.user?.name ?? "Student",
      class_name: event.session?.class?.name ?? "Class",
      session_id: event.session_id,
      event_type: event.type,
      evidence_url: String(event.metadata.evidence_url),
      captured_at: typeof event.metadata.captured_at === "string" ? event.metadata.captured_at : event.timestamp
    }));


  return {
    suspicious_students: suspiciousStudents,
    low_engagement_students: lowEngagementStudents,
    weak_submissions: weakSubmissions,
    recent_evidence: evidence
  };
}

export async function getAnalyticsDashboard(userId: string, role: UserRole) {
  const sessions = await getSessionsForUser(userId, role);
  const recentSessions = [...sessions]
    .sort((left, right) => new Date(right.start_time).getTime() - new Date(left.start_time).getTime())
    .slice(0, 8);

  const scoreRows = (await Promise.all(recentSessions.map((session) => computeScoresForSession(session)))).flat();
  const visibleRows =
    role === "teacher" ? scoreRows : scoreRows.filter((row) => row.user_id === userId);

  visibleRows.sort((left, right) => {
    if (left.integrity_score !== right.integrity_score) {
      return left.integrity_score - right.integrity_score;
    }

    return left.engagement_score - right.engagement_score;
  });

  const teacherInsights = role === "teacher" ? await getTeacherInsights(userId, visibleRows) : null;

  return {
    rows: visibleRows,
    summary: summarizeRows(visibleRows),
    recentSessions,
    teacherInsights
  };
}
