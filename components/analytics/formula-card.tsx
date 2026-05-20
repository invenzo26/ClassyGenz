export function FormulaCard() {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">MVP Formula</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">How scores are calculated right now</h2>
      <div className="mt-5 grid gap-3 text-sm text-slate-700">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          Engagement = `55% attendance ratio + 25% presence heartbeat ratio + 20% message activity`
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          Integrity starts at `100` and deducts `10` for tab switch, `20` for camera off, `10` for copy/paste, `15` for fullscreen exit, and `30` for multiple faces.
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          Scores are rule-based and transparent for MVP, which keeps them explainable to teachers and easier to tune.
        </div>
      </div>
    </section>
  );
}
