"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/auth/actions";
import { FormField } from "@/components/auth/form-field";
import { AuthFormShell } from "@/components/auth/auth-form-shell";

const initialState = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <AuthFormShell
      title="Sign in"
      description="Use your existing classroom account to continue."
      submitLabel="Sign in"
      pending={pending}
      state={state}
      action={formAction}
    >
      <FormField label="Email" name="email" type="email" placeholder="you@example.com" />
      <FormField label="Password" name="password" type="password" placeholder="Enter your password" />
    </AuthFormShell>
  );
}
