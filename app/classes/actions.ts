"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

type ClassActionState = {
  error?: string;
  success?: string;
};

export async function createClassAction(
  _prevState: ClassActionState,
  formData: FormData
): Promise<ClassActionState> {
  const { user, profile } = await requireUser();

  if (!profile || profile.role !== "teacher") {
    return { error: "Only teachers can create classes." };
  }

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Class name is required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("classes")
    .insert({
      name,
      teacher_id: user.id
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return { error: error.message };
  }

  const { error: membershipError } = await supabase.from("class_members").insert({
    class_id: data.id,
    user_id: user.id,
    role: "teacher"
  });

  if (membershipError) {
    return { error: membershipError.message };
  }

  revalidatePath("/classes");

  return { success: "Class created successfully." };
}
