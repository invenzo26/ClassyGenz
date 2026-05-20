export function SetupGuide() {
  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Supabase Setup Needed</p>
      <h2 className="mt-3 text-2xl font-semibold text-amber-950">Connect your backend to unlock auth and classes</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-900">
        Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
        `.env.local`, then apply the SQL in `docs/schema.sql`. After that, the auth
        forms and class creation flow will work against your Supabase project.
      </p>
    </section>
  );
}
