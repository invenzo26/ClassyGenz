import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  SessionEventRecord,
  SessionListItem,
  SessionParticipant,
  UserRole
} from "@/lib/supabase/types";

export async function getSessionsForUser(userId: string, role: UserRole) {
  if (!hasSupabaseEnv()) {
    return [] as SessionListItem[];
  }

  const supabase = await createClient();

  if (role === "teacher") {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, class_id, meeting_url, start_time, end_time, created_at, class:classes(id, name, teacher_id)")
      .order("start_time", { ascending: true })
      .returns<SessionListItem[]>();

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).filter((session) => session.class?.teacher_id === userId);
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("user_id", userId)
    .returns<{ class_id: string }[]>();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const classIds = (memberships ?? []).map((entry) => entry.class_id);

  if (!classIds.length) {
    return [] as SessionListItem[];
  }

  const { data, error } = await supabase
    .from("sessions")
    .select("id, class_id, meeting_url, start_time, end_time, created_at, class:classes(id, name, teacher_id)")
    .in("class_id", classIds)
    .order("start_time", { ascending: true })
    .returns<SessionListItem[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getSessionDetailForUser(userId: string, sessionId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, class_id, meeting_url, start_time, end_time, created_at, class:classes(id, name, teacher_id)")
    .eq("id", sessionId)
    .maybeSingle<SessionListItem>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.class) {
    return null;
  }

  if (data.class.teacher_id === userId) {
    return data;
  }

  const { data: membership } = await supabase
    .from("class_members")
    .select("id")
    .eq("class_id", data.class_id)
    .eq("user_id", userId)
    .maybeSingle();

  return membership ? data : null;
}

export async function getAttendanceForSession(sessionId: string) {
  if (!hasSupabaseEnv()) {
    return [] as SessionParticipant[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_participants")
    .select("id, session_id, user_id, joined_at, last_seen_at, left_at")
    .eq("session_id", sessionId)
    .order("joined_at", { ascending: false })
    .returns<SessionParticipant[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getRecentEventsForSession(sessionId: string, limit = 25) {
  if (!hasSupabaseEnv()) {
    return [] as SessionEventRecord[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, user_id, session_id, type, metadata, timestamp")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: false })
    .limit(limit)
    .returns<SessionEventRecord[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
