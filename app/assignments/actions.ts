"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getAssignmentDetailForUser } from "@/lib/assignments";
import { createClient } from "@/lib/supabase/server";

type AssignmentActionState = {
  error?: string;
  success?: string;
};

export async function createAssignmentAction(
  _prevState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  const { user, profile } = await requireUser();

  if (profile?.role !== "teacher") {
    return { error: "Only teachers can create assignments." };
  }

  const classId = String(formData.get("classId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!classId || !title) {
    return { error: "Class and title are required." };
  }

  const supabase = await createClient();
  const { data: classItem, error: classError } = await supabase
    .from("classes")
    .select("id, teacher_id")
    .eq("id", classId)
    .maybeSingle<{ id: string; teacher_id: string }>();

  if (classError) {
    return { error: classError.message };
  }

  if (!classItem || classItem.teacher_id !== user.id) {
    return { error: "You can only create assignments for your own classes." };
  }

  const { error } = await supabase.from("assignments").insert({
    class_id: classId,
    title,
    description: description || null,
    due_date: dueDate ? new Date(dueDate).toISOString() : null
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/assignments");

  return { success: "Assignment created." };
}

export async function submitAssignmentAction(
  _prevState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  const { user, profile } = await requireUser();

  if (profile?.role !== "student") {
    return { error: "Only students can submit assignments." };
  }

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const file = formData.get("file");

  if (!assignmentId || !(file instanceof File) || file.size === 0) {
    return { error: "Assignment file is required." };
  }

  const assignment = await getAssignmentDetailForUser(user.id, assignmentId);

  if (!assignment) {
    return { error: "You do not have access to this assignment." };
  }

  const supabase = await createClient();
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const filePath = `${assignmentId}/${user.id}-${Date.now()}${extension}`;

  const { error: uploadError } = await supabase.storage.from("submissions").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("submissions").getPublicUrl(filePath);

  const { error } = await supabase.from("submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: user.id,
      file_url: publicUrlData.publicUrl,
      marks: null,
      feedback: null
    },
    { onConflict: "assignment_id,student_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/assignments/${assignmentId}`);
  revalidatePath("/assignments");

  return { success: "Assignment submitted." };
}

export async function evaluateSubmissionAction(
  _prevState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  const { user, profile } = await requireUser();

  if (profile?.role !== "teacher") {
    return { error: "Only teachers can evaluate submissions." };
  }

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");
  const marksValue = String(formData.get("marks") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!assignmentId || !submissionId || !marksValue) {
    return { error: "Submission and marks are required." };
  }

  const marks = Number(marksValue);

  if (!Number.isFinite(marks) || marks < 0 || marks > 100) {
    return { error: "Marks must be between 0 and 100." };
  }

  const assignment = await getAssignmentDetailForUser(user.id, assignmentId);

  if (!assignment || assignment.class?.teacher_id !== user.id) {
    return { error: "You can only evaluate submissions for your own assignments." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .update({
      marks,
      feedback: feedback || null
    })
    .eq("id", submissionId)
    .eq("assignment_id", assignmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/assignments/${assignmentId}`);

  return { success: "Evaluation saved." };
}
