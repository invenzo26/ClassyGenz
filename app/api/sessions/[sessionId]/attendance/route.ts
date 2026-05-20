import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { getSessionDetailForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

type AttendanceStatus = "join" | "heartbeat" | "leave";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getSessionContext();

  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = (await request.json()) as { status?: AttendanceStatus };
  const status = body.status;

  if (!status || !["join", "heartbeat", "leave"].includes(status)) {
    return NextResponse.json({ error: "Invalid attendance status" }, { status: 400 });
  }

  const sessionItem = await getSessionDetailForUser(session.user.id, sessionId);

  if (!sessionItem) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const supabase = await createClient();

  if (status === "join") {
    const { error } = await supabase.from("session_participants").upsert(
      {
        session_id: sessionId,
        user_id: session.user.id,
        joined_at: now,
        last_seen_at: now,
        left_at: null
      },
      { onConflict: "session_id,user_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (status === "heartbeat") {
    const { error } = await supabase
      .from("session_participants")
      .update({ last_seen_at: now })
      .eq("session_id", sessionId)
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (status === "leave") {
    const { error } = await supabase
      .from("session_participants")
      .update({ last_seen_at: now, left_at: now })
      .eq("session_id", sessionId)
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
