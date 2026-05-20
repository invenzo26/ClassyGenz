import type { ClassMaterial } from "@/lib/supabase/types";

export function MaterialsList({ materials }: { materials: ClassMaterial[] }) {
  if (!materials.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        No study material uploaded yet. Once the teacher shares resources, they will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {materials.map((material) => (
        <article
          key={material.id}
          className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-panel"
        >
          <p className="text-sm font-semibold text-ink">{material.title}</p>
          <p className="mt-2 text-sm text-slate-500">
            Uploaded {new Date(material.created_at).toLocaleString()}
          </p>
          <a
            href={material.file_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Open material
          </a>
        </article>
      ))}
    </div>
  );
}
