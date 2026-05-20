"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EventType } from "@/lib/supabase/types";

type Status = "idle" | "starting" | "active" | "error";

async function postJson(url: string, payload: Record<string, unknown>, keepalive = false) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive
  });
}

export function SessionMonitor({
  sessionId
}: {
  sessionId: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [cameraState, setCameraState] = useState<"unknown" | "on" | "off">("unknown");
  const [note, setNote] = useState("Monitoring is off until you start the session room.");
  const [evidenceEnabled, setEvidenceEnabled] = useState(false);
  const [lastEvidenceAt, setLastEvidenceAt] = useState<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const snapshotRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
      }
      if (snapshotRef.current) {
        window.clearInterval(snapshotRef.current);
      }
    };
  }, []);

  const logEvent = async (type: EventType, metadata: Record<string, unknown> = {}) => {
    await postJson("/api/events", { sessionId, type, metadata });
  };

  const markAttendance = async (state: "join" | "heartbeat" | "leave", keepalive = false) => {
    await postJson(`/api/sessions/${sessionId}/attendance`, { status: state }, keepalive);
  };

  const captureSnapshot = async (reason: "session_start" | "interval") => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((snapshotBlob) => resolve(snapshotBlob), "image/jpeg", 0.72);
    });

    if (!blob) {
      return;
    }

    const supabase = createClient();
    const filePath = `${sessionId}/${Date.now()}-${reason}.jpg`;
    const { error } = await supabase.storage.from("snapshots").upload(filePath, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg"
    });

    if (error) {
      await logEvent("presence_ping", {
        source: "webcam_snapshot_failed",
        reason,
        message: error.message
      });
      return;
    }

    const { data } = supabase.storage.from("snapshots").getPublicUrl(filePath);
    const capturedAt = new Date().toISOString();
    setLastEvidenceAt(capturedAt);

    await logEvent("presence_ping", {
      source: "webcam_snapshot",
      reason,
      evidence_url: data.publicUrl,
      captured_at: capturedAt
    });
  };


  const startMonitoring = async () => {
    try {
      setStatus("starting");
      setNote("Requesting session monitoring permissions and starting attendance tracking.");

      await markAttendance("join");
      await logEvent("presence_ping", { source: "session_start" });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraState("on");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setCameraState("off");
          setNote("Camera monitoring was interrupted.");
          void logEvent("camera_off", { source: "track_ended" });
        };
      });

      const handleVisibility = () => {
        if (document.hidden) {
          void logEvent("tab_switch", { hidden: true });
        }
      };

      const handleCopy = () => {
        void logEvent("copy_paste", { action: "copy" });
      };

      const handleFullscreen = () => {
        if (!document.fullscreenElement) {
          void logEvent("fullscreen_exit", { source: "fullscreenchange" });
        }
      };

      const handlePageHide = () => {
        void markAttendance("leave", true);
      };

      document.addEventListener("visibilitychange", handleVisibility);
      document.addEventListener("copy", handleCopy);
      document.addEventListener("cut", handleCopy);
      document.addEventListener("paste", handleCopy);
      document.addEventListener("fullscreenchange", handleFullscreen);
      window.addEventListener("pagehide", handlePageHide);

      heartbeatRef.current = window.setInterval(() => {
        void markAttendance("heartbeat");
        void logEvent("presence_ping", {
          source: "heartbeat",
          fullscreen: Boolean(document.fullscreenElement),
          visible: !document.hidden
        });
      }, 30000);

      if (evidenceEnabled) {
        void captureSnapshot("session_start");
        snapshotRef.current = window.setInterval(() => {
          void captureSnapshot("interval");
        }, 120000);
      }

      setStatus("active");
      setNote("Monitoring is active. Keep the ClassyGenz Live room visible during the session.");

      cleanupRef.current = () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        document.removeEventListener("copy", handleCopy);
        document.removeEventListener("cut", handleCopy);
        document.removeEventListener("paste", handleCopy);
        document.removeEventListener("fullscreenchange", handleFullscreen);
        window.removeEventListener("pagehide", handlePageHide);
      };
    } catch (error) {
      setStatus("error");
      setCameraState("off");
      setNote("Camera permission was denied or unavailable, so a camera-off event was recorded.");
      await logEvent("camera_off", {
        source: "permission_denied",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setNote("Fullscreen request was blocked by the browser.");
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Session Monitor</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Attendance and proctoring controls</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>

      <video ref={videoRef} muted playsInline className="hidden" />

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-mist px-4 py-2 text-slate-700">Status: {status}</span>
        <span className="rounded-full bg-mist px-4 py-2 text-slate-700">Camera: {cameraState}</span>
        <span className="rounded-full bg-mist px-4 py-2 text-slate-700">Evidence: {evidenceEnabled ? "on" : "off"}</span>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={evidenceEnabled}
          disabled={status === "active" || status === "starting"}
          onChange={(event) => setEvidenceEnabled(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          Capture optional webcam evidence snapshots during this monitored session.
          {lastEvidenceAt ? ` Last snapshot: ${new Date(lastEvidenceAt).toLocaleTimeString()}` : ""}
        </span>
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void startMonitoring()}
          disabled={status === "starting" || status === "active"}
          className="inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "active" ? "Monitoring active" : status === "starting" ? "Starting..." : "Start monitoring"}
        </button>

        <button
          type="button"
          onClick={() => void enterFullscreen()}
          className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-ink"
        >
          Enter fullscreen
        </button>
      </div>
    </div>
  );
}
