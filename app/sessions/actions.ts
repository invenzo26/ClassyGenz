"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

type SessionActionState = {
  error?: string;
  success?: string;
};

export async function createSessionAction(
  _prevState: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  const { user, profile } = await requireUser();

  if (profile?.role !== "teacher") {
    return { error: "Only teachers can schedule sessions." };
  }

  const classId = String(formData.get("classId") ?? "");
  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!classId || !startTime) {
    return { error: "Class and session start time are required." };
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
    return { error: "You can only schedule sessions for your own classes." };
  }

  const { error } = await supabase.from("sessions").insert({
    class_id: classId,
    meeting_url: meetingUrl || null,
    start_time: new Date(startTime).toISOString(),
    end_time: endTime ? new Date(endTime).toISOString() : null
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/sessions");

  return { success: "Session scheduled." };
}
