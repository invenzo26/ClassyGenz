import { cn } from "@/lib/utils";
import type { ClassMessage, UserRole } from "@/lib/supabase/types";

export function MessageFeed({
  messages,
  currentUserId,
  currentRole
}: {
  messages: ClassMessage[];
  currentUserId: string;
  currentRole: UserRole;
}) {
  if (!messages.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm leading-7 text-slate-600">
        No messages yet. {currentRole === "teacher" ? "Post the first announcement to set the tone for this class." : "Start the conversation by asking a question or responding to an update."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const ownMessage = message.sender_id === currentUserId;

        return (
          <article
            key={message.id}
            className={cn(
              "rounded-[1.5rem] border p-5 shadow-panel",
              message.type === "announcement"
                ? "border-amber-200 bg-amber-50"
                : "border-white/70 bg-white/90",
              ownMessage && message.type === "text" ? "ring-2 ring-sky/40" : ""
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                  message.type === "announcement"
                    ? "bg-amber-200 text-amber-900"
                    : "bg-mist text-slate-700"
                )}
              >
                {message.type}
              </span>
              <p className="text-sm font-medium text-ink">{message.sender?.name ?? "Unknown user"}</p>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                {message.sender?.role ?? "member"}
              </p>
              <p className="text-sm text-slate-500">
                {new Date(message.created_at).toLocaleString()}
              </p>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{message.message}</p>
          </article>
        );
      })}
    </div>
  );
}
