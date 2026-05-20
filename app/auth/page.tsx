import Link from "next/link";
import { redirect } from "next/navigation";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getSessionContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const session = await getSessionContext();

  if (session.user) {
    redirect("/");
  }

  return (
    <div className="shell-grid min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center">
        <div className="grid w-full gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-white/70 bg-ink p-8 text-white shadow-panel">
            <p className="text-xs uppercase tracking-[0.35em] text-sky">{siteConfig.name}</p>
            <h1 className="mt-4 text-4xl font-semibold">{siteConfig.tagline}</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
              Teachers can create and manage classrooms, while students can join sessions, track assignments, and view engagement or integrity insights.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                JWT-based auth through Supabase
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Role-aware app behavior for students and teachers
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Database-backed class creation and listing
              </div>
            </div>
            <Link href="/" className="mt-8 inline-flex text-sm text-sky underline underline-offset-4">
              Back to overview
            </Link>
          </section>

          <div className="space-y-6">
            {!hasSupabaseEnv() ? <SetupGuide /> : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <SignInForm />
              <SignUpForm />
            </div>

            <ResendConfirmationForm />
          </div>
        </div>
      </div>
    </div>
  );
}
