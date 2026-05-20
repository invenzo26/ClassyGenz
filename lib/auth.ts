import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/supabase/types";

export const getSessionContext = cache(async () => {
  if (!hasSupabaseEnv()) {
    return {
      user: null,
      profile: null,
      configured: false
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      configured: true
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, created_at")
    .eq("id", user.id)
    .maybeSingle<UserProfile>();

  return {
    user,
    profile: profile ?? null,
    configured: true
  };
});

export async function requireUser() {
  const context = await getSessionContext();

  if (!context.configured) {
    redirect("/auth");
  }

  if (!context.user) {
    redirect("/auth");
  }

  return context;
}
