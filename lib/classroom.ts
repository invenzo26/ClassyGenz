import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ClassDetail,
  ClassListItem,
  ClassMaterial,
  ClassMemberRecord,
  ClassMessage,
  UserRole
} from "@/lib/supabase/types";

export async function getClassesForUser(userId: string, role: UserRole) {
  if (!hasSupabaseEnv()) {
    return [] as ClassListItem[];
  }

  const supabase = await createClient();

  if (role === "teacher") {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, teacher_id, created_at")
      .eq("teacher_id", userId)
      .order("created_at", { ascending: false })
      .returns<ClassListItem[]>();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  const { data, error } = await supabase
    .from("class_members")
    .select("class:classes(id, name, teacher_id, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<{ class: ClassListItem | null }[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((entry) => entry.class)
    .filter((entry): entry is ClassListItem => Boolean(entry));
}

export async function getClassDetailForUser(userId: string, classId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("class_members")
    .select("id")
    .eq("class_id", classId)
    .eq("user_id", userId)
    .maybeSingle();

  const { data: classItem, error } = await supabase
    .from("classes")
    .select("id, name, teacher_id, created_at, teacher:users(name, email)")
    .eq("id", classId)
    .maybeSingle<ClassDetail>();

  if (error) {
    throw new Error(error.message);
  }

  if (!classItem) {
    return null;
  }

  const allowed = classItem.teacher_id === userId || Boolean(membership);

  if (!allowed) {
    return null;
  }

  return classItem;
}

export async function getMessagesForClass(classId: string) {
  if (!hasSupabaseEnv()) {
    return [] as ClassMessage[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, class_id, sender_id, message, type, created_at, sender:users(name, role)")
    .eq("class_id", classId)
    .order("created_at", { ascending: true })
    .returns<ClassMessage[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getMaterialsForClass(classId: string) {
  if (!hasSupabaseEnv()) {
    return [] as ClassMaterial[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("id, class_id, title, file_url, created_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: false })
    .returns<ClassMaterial[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getClassMembers(classId: string) {
  if (!hasSupabaseEnv()) {
    return [] as ClassMemberRecord[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_members")
    .select("id, class_id, user_id, role, created_at, user:users(name, email, role)")
    .eq("class_id", classId)
    .order("created_at", { ascending: true })
    .returns<ClassMemberRecord[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
