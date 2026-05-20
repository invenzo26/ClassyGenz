import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { getSessionDetailForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/supabase/types";

const allowedEvents = new Set<EventType>([
  "tab_switch",
  "camera_off",
  "multiple_face",
  "copy_paste",
  "presence_ping",
  "fullscreen_exit"
]);

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    sessionId?: string;
    type?: EventType;
    metadata?: Record<string, unknown>;
  };

  if (!body.sessionId || !body.type || !allowedEvents.has(body.type)) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  const sessionItem = await getSessionDetailForUser(session.user.id, body.sessionId);

  if (!sessionItem) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    user_id: session.user.id,
    session_id: body.sessionId,
    type: body.type,
    metadata: body.metadata ?? {}
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
