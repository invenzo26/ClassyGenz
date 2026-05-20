type ActionState = {
  error?: string;
  success?: string;
};

export function AuthFormShell({
  title,
  description,
  submitLabel,
  pending,
  state,
  action,
  children
}: {
  title: string;
  description: string;
  submitLabel: string;
  pending: boolean;
  state: ActionState;
  action: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  return (
    <form action={action} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-6 space-y-4">{children}</div>

      {state.error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Please wait..." : submitLabel}
      </button>
    </form>
  );
}
