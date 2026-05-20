"use client";

import { useActionState } from "react";
import { resendConfirmationAction } from "@/app/auth/actions";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { FormField } from "@/components/auth/form-field";

const initialState = {};

export function ResendConfirmationForm() {
  const [state, formAction, pending] = useActionState(resendConfirmationAction, initialState);

  return (
    <AuthFormShell
      title="Confirm email"
      description="If Supabase asks for email confirmation, resend the verification link here after the rate limit clears."
      submitLabel="Resend confirmation"
      pending={pending}
      state={state}
      action={formAction}
    >
      <FormField label="Email" name="email" type="email" placeholder="you@example.com" />
    </AuthFormShell>
  );
}
