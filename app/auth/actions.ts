"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: string;
};

function friendlyAuthError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("email not confirmed")) {
    return "Please confirm your email first. Open the verification email from Supabase, then sign in again.";
  }

  if (lowerMessage.includes("rate limit")) {
    return "Supabase has temporarily rate-limited confirmation emails. Wait a few minutes before trying again, or disable email confirmation for local development.";
  }

  return message;
}

function getProfileFromMetadata(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const name =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name.trim()
      : user.email?.split("@")[0] ?? "ClassyGenz user";
  const metadataRole = user.user_metadata?.role;
  const role = metadataRole === "teacher" || metadataRole === "student" ? metadataRole : "student";

  return {
    id: user.id,
    name,
    email: user.email ?? "",
    role
  };
}

async function ensureProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return userError?.message ?? "Could not load authenticated user.";
  }

  const { error } = await supabase.from("users").upsert(getProfileFromMetadata(user));

  return error?.message;
}

export async function signInAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  const profileError = await ensureProfile();

  if (profileError) {
    return { error: profileError };
  }

  revalidatePath("/");
  redirect("/");
}

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "").trim();

  if (!name || !email || !password || !role) {
    return { error: "Name, email, password, and role are required." };
  }

  if (role !== "student" && role !== "teacher") {
    return { error: "Please choose a valid role." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role
      }
    }
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  const user = data.user;

  if (!user || !data.session) {
    return {
      success: "Account created. Check your email to confirm your account before signing in."
    };
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: user.id,
    name,
    email,
    role
  });

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/");

  if (data.session) {
    redirect("/");
  }

  return {
    success: "Account created. If email confirmation is enabled, verify your email before signing in."
  };
}

export async function resendConfirmationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  return {
    success: "Confirmation email sent. Check your inbox, then sign in after confirming."
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/auth");
}
