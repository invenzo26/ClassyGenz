import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AssignmentListItem, SubmissionRecord, UserRole } from "@/lib/supabase/types";

export async function getAssignmentsForUser(userId: string, role: UserRole) {
  if (!hasSupabaseEnv()) {
    return [] as AssignmentListItem[];
  }

  const supabase = await createClient();

  if (role === "teacher") {
    const { data, error } = await supabase
      .from("assignments")
      .select("id, class_id, title, description, due_date, created_at, class:classes(id, name, teacher_id)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .returns<AssignmentListItem[]>();

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).filter((assignment) => assignment.class?.teacher_id === userId);
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("user_id", userId)
    .returns<{ class_id: string }[]>();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const classIds = (memberships ?? []).map((membership) => membership.class_id);

  if (!classIds.length) {
    return [] as AssignmentListItem[];
  }

  const { data, error } = await supabase
    .from("assignments")
    .select("id, class_id, title, description, due_date, created_at, class:classes(id, name, teacher_id)")
    .in("class_id", classIds)
    .order("due_date", { ascending: true, nullsFirst: false })
    .returns<AssignmentListItem[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAssignmentDetailForUser(userId: string, assignmentId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("id, class_id, title, description, due_date, created_at, class:classes(id, name, teacher_id)")
    .eq("id", assignmentId)
    .maybeSingle<AssignmentListItem>();

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

export async function getSubmissionsForAssignment(assignmentId: string) {
  if (!hasSupabaseEnv()) {
    return [] as SubmissionRecord[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, assignment_id, student_id, file_url, marks, feedback, created_at, student:users(name, email)")
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: false })
    .returns<SubmissionRecord[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getSubmissionForStudent(assignmentId: string, studentId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, assignment_id, student_id, file_url, marks, feedback, created_at, student:users(name, email)")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle<SubmissionRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}
