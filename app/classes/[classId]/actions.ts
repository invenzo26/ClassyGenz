"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getClassDetailForUser } from "@/lib/classroom";

type ClassRoomActionState = {
  error?: string;
  success?: string;
};


async function ensureClassAccess(userId: string, classId: string) {
  const classItem = await getClassDetailForUser(userId, classId);

  if (!classItem) {
    throw new Error("You do not have access to this class.");
  }

  return classItem;
}

export async function postMessageAction(
  _prevState: ClassRoomActionState,
  formData: FormData
): Promise<ClassRoomActionState> {
  const { user } = await requireUser();
  const classId = String(formData.get("classId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const type = String(formData.get("type") ?? "text");

  if (!classId || !message) {
    return { error: "Class and message are required." };
  }

  if (type !== "text" && type !== "announcement") {
    return { error: "Invalid message type." };
  }

  try {
    await ensureClassAccess(user.id, classId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Access denied." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    class_id: classId,
    sender_id: user.id,
    message,
    type
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/classes/${classId}`);

  return { success: type === "announcement" ? "Announcement posted." : "Message sent." };
}

export async function uploadMaterialAction(
  _prevState: ClassRoomActionState,
  formData: FormData
): Promise<ClassRoomActionState> {
  const { user, profile } = await requireUser();
  const classId = String(formData.get("classId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");

  if (profile?.role !== "teacher") {
    return { error: "Only teachers can upload materials." };
  }

  if (!classId || !title || !(file instanceof File) || file.size === 0) {
    return { error: "Title and file are required." };
  }

  try {
    await ensureClassAccess(user.id, classId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Access denied." };
  }

  const supabase = await createClient();
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const filePath = `${classId}/${Date.now()}-${safeTitle || "material"}${extension}`;

  const { error: uploadError } = await supabase.storage.from("materials").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("materials").getPublicUrl(filePath);

  const { error: insertError } = await supabase.from("materials").insert({
    class_id: classId,
    title,
    file_url: publicUrlData.publicUrl
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/classes/${classId}`);

  return { success: "Material uploaded." };
}
