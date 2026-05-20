"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getClassDetailForUser } from "@/lib/classroom";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ClassRoomActionState = {
  error?: string;
  success?: string;
};

async function findOrCreateStudentProfile(email: string) {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, name, email, role")
    .eq("email", email)
    .maybeSingle<{ id: string; name: string; email: string; role: string }>();

  if (profileError) {
    return { error: profileError.message };
  }

  if (profile) {
    return { student: profile };
  }

  const admin = createAdminClient();

  if (!admin) {
    return {
      error:
        "No profile row exists for that email. Ask the student to sign in once, or add SUPABASE_SERVICE_ROLE_KEY to .env.local so ClassyGenz can backfill the profile."
    };
  }

  const { data, error } = await admin.auth.admin.listUsers();

  if (error) {
    return { error: error.message };
  }

  const authUser = data.users.find((candidate) => candidate.email?.toLowerCase() === email);

  if (!authUser) {
    return { error: "No Supabase Auth user found with that email. Ask the student to sign up first." };
  }

  const metadataRole = authUser.user_metadata?.role;
  const role = metadataRole === "teacher" || metadataRole === "student" ? metadataRole : "student";

  if (role !== "student") {
    return { error: "Only student accounts can be enrolled as students." };
  }

  const name =
    typeof authUser.user_metadata?.name === "string" && authUser.user_metadata.name.trim()
      ? authUser.user_metadata.name.trim()
      : authUser.email?.split("@")[0] ?? "ClassyGenz student";

  const student = {
    id: authUser.id,
    name,
    email: authUser.email ?? email,
    role
  };

  const { error: upsertError } = await admin.from("users").upsert(student);

  if (upsertError) {
    return { error: upsertError.message };
  }

  return { student };
}

export async function addStudentToClassAction(
  _prevState: ClassRoomActionState,
  formData: FormData
): Promise<ClassRoomActionState> {
  const { user, profile } = await requireUser();
  const classId = String(formData.get("classId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (profile?.role !== "teacher") {
    return { error: "Only teachers can add students." };
  }

  if (!classId || !email) {
    return { error: "Class and student email are required." };
  }

  const classItem = await getClassDetailForUser(user.id, classId);

  if (!classItem || classItem.teacher_id !== user.id) {
    return { error: "You can only add students to your own classes." };
  }

  const result = await findOrCreateStudentProfile(email);

  if (result.error || !result.student) {
    return { error: result.error ?? "Could not load student profile." };
  }

  if (result.student.role !== "student") {
    return { error: "Only student accounts can be enrolled as students." };
  }

  const writer = createAdminClient() ?? (await createClient());
  const { error } = await writer.from("class_members").upsert(
    {
      class_id: classId,
      user_id: result.student.id,
      role: "student"
    },
    { onConflict: "class_id,user_id" }
  );

  if (error) {
    return {
      error:
        error.message === 'new row violates row-level security policy for table "class_members"'
          ? "Supabase blocked the enrollment insert. Add SUPABASE_SERVICE_ROLE_KEY to .env.local, restart the dev server, then try again."
          : error.message
    };
  }

  revalidatePath(`/classes/${classId}`);
  revalidatePath("/classes");

  return { success: "Student added to class." };
}
