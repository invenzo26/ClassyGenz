"use client";

import { useActionState } from "react";
import { signUpAction } from "@/app/auth/actions";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { FormField } from "@/components/auth/form-field";
import { RoleSelect } from "@/components/auth/role-select";

const initialState = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <AuthFormShell
      title="Create account"
      description="Start as a teacher or student and we will use that role to shape the dashboard."
      submitLabel="Create account"
      pending={pending}
      state={state}
      action={formAction}
    >
      <FormField label="Full name" name="name" placeholder="Alex Johnson" />
      <FormField label="Email" name="email" type="email" placeholder="alex@example.com" />
      <FormField label="Password" name="password" type="password" placeholder="Create a strong password" />
      <RoleSelect />
    </AuthFormShell>
  );
}
