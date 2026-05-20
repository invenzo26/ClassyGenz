import type { Route } from "next";
import Link from "next/link";
import { Activity, BookOpenText, FileCheck2, LayoutDashboard, ShieldCheck, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { siteConfig } from "@/lib/site";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: BookOpenText },
  { href: "/sessions", label: "Sessions", icon: Video },
  { href: "/assignments", label: "Assignments", icon: FileCheck2 },
  { href: "/proctoring", label: "Proctoring", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: Activity }
] satisfies { href: Route; label: string; icon: typeof LayoutDashboard }[];

export function AppShell({
  children,
  currentPath,
  userName,
  userRole,
  showSignOut = false
}: {
  children: React.ReactNode;
  currentPath: string;
  userName?: string | null;
  userRole?: string | null;
  showSignOut?: boolean;
}) {
  return (
    <div className="shell-grid min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-panel backdrop-blur lg:block">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Smart Classroom</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">{siteConfig.name}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {siteConfig.tagline}
            </p>
          </div>

          <nav className="space-y-2">
            {links.map(({ href, label, icon: Icon }) => {
              const active = currentPath === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-ink text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
        <div className="fixed right-4 top-4 z-10 hidden items-center gap-3 rounded-full border border-white/80 bg-white/85 px-4 py-3 shadow-panel backdrop-blur lg:flex">
          <div className="text-right">
            <p className="text-sm font-semibold text-ink">{userName ?? "Guest mode"}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {userRole ?? "setup"}
            </p>
          </div>
          {showSignOut ? <SignOutButton /> : null}
        </div>
      </div>
    </div>
  );
}
