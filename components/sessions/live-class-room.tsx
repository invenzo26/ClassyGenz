"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

type RoomStatus = "idle" | "starting" | "live" | "error";
type ProctorStatus = "idle" | "monitoring" | "flagged";

type LiveParticipant = {
  id: string;
  name: string;
  role: UserRole;
};

type PresenceMeta = LiveParticipant & {
  joined_at: string;
};

type SignalPayload = {
  from: string;
  to: string;
  kind: "offer" | "answer" | "ice";
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type RemoteTile = LiveParticipant & {
  stream: MediaStream;
  connectionState: RTCPeerConnectionState;
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function logEvent(
  sessionId: string,
  type: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, type, metadata })
    });
  } catch {
    // Silent fail - don't interrupt UX
  }
}

async function markAttendance(
  sessionId: string,
  status: "join" | "heartbeat" | "leave"
) {
  try {
    await fetch(`/api/sessions/${sessionId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      keepalive: status === "leave"
    });
  } catch {
    // Silent fail
  }
}

function StreamTile({
  stream,
  title,
  subtitle,
  muted,
  isLocal,
  videoEnabled,
  videoRef: externalRef
}: {
  stream: MediaStream | null;
  title: string;
  subtitle: string;
  muted?: boolean;
  isLocal?: boolean;
  videoEnabled?: boolean;
  videoRef?: React.MutableRefObject<HTMLVideoElement | null>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    if (externalRef) {
      externalRef.current = videoRef.current;
    }
  }, [stream, externalRef]);

  return (
    <div className="group relative min-h-[230px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink text-white shadow-panel">
      {stream && videoEnabled !== false ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="h-full min-h-[230px] w-full object-cover"
        />
      ) : (
        <div className="flex min-h-[230px] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(77,195,255,0.25),_transparent_35%),linear-gradient(135deg,_#07111d,_#142235)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl font-semibold">
            {title.slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-slate-300">{subtitle}{isLocal ? " - you" : ""}</p>
      </div>
    </div>
  );
}

export function LiveClassRoom({
  sessionId,
  currentUser,
  fallbackMeetingUrl
}: {
  sessionId: string;
  currentUser: LiveParticipant;
  fallbackMeetingUrl: string | null;
}) {
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [proctorStatus, setProctorStatus] = useState<ProctorStatus>("idle");
  const [note, setNote] = useState("Start the native ClassyGenz room to teach or join from inside this page.");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [remoteTiles, setRemoteTiles] = useState<RemoteTile[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [faceCount, setFaceCount] = useState(0);
  const [eventCounts, setEventCounts] = useState({
    tab_switch: 0,
    camera_off: 0,
    fullscreen_exit: 0,
    multiple_face: 0
  });

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const participantRef = useRef<Map<string, LiveParticipant>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const heartbeatRef = useRef<number | null>(null);
  const faceDetectionRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const topic = useMemo(() => `live-session-${sessionId}`, [sessionId]);

  const broadcastSignal = async (payload: Omit<SignalPayload, "from">) => {
    const channel = channelRef.current;

    if (!channel) {
      return;
    }

    await channel.send({
      type: "broadcast",
      event: "signal",
      payload: { ...payload, from: currentUser.id }
    });
  };

  const refreshRemoteTiles = () => {
    setRemoteTiles((existing) =>
      existing.map((tile) => ({
        ...tile,
        ...(participantRef.current.get(tile.id) ?? {}),
        connectionState: peersRef.current.get(tile.id)?.connectionState ?? tile.connectionState
      }))
    );
  };

  const flushQueuedIce = async (remoteUserId: string, peer: RTCPeerConnection) => {
    const queued = pendingIceRef.current.get(remoteUserId) ?? [];
    pendingIceRef.current.delete(remoteUserId);

    for (const candidate of queued) {
      await peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
    }
  };

  const addIce = async (remoteUserId: string, candidate: RTCIceCandidateInit) => {
    const peer = peersRef.current.get(remoteUserId);

    if (!peer || !peer.remoteDescription) {
      const queued = pendingIceRef.current.get(remoteUserId) ?? [];
      queued.push(candidate);
      pendingIceRef.current.set(remoteUserId, queued);
      return;
    }

    await peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
  };

  const closePeer = (remoteUserId: string) => {
    const peer = peersRef.current.get(remoteUserId);
    peer?.close();
    peersRef.current.delete(remoteUserId);
    pendingIceRef.current.delete(remoteUserId);
    setRemoteTiles((tiles) => tiles.filter((tile) => tile.id !== remoteUserId));
  };

  const getPeer = (remoteUserId: string) => {
    const existing = peersRef.current.get(remoteUserId);

    if (existing) {
      return existing;
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(remoteUserId, peer);

    localStreamRef.current?.getTracks().forEach((track) => {
      localStreamRef.current?.getTracks();
      peer.addTrack(track, localStreamRef.current as MediaStream);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        void broadcastSignal({
          to: remoteUserId,
          kind: "ice",
          candidate: event.candidate.toJSON()
        });
      }
    };

    peer.ontrack = (event) => {
      const stream = event.streams[0];
      const participant = participantRef.current.get(remoteUserId) ?? {
        id: remoteUserId,
        name: "Class participant",
        role: "student"
      };

      setRemoteTiles((tiles) => {
        const existingTile = tiles.find((tile) => tile.id === remoteUserId);

        if (existingTile) {
          return tiles.map((tile) =>
            tile.id === remoteUserId
              ? { ...tile, ...participant, stream, connectionState: peer.connectionState }
              : tile
          );
        }

        return [...tiles, { ...participant, stream, connectionState: peer.connectionState }];
      });
    };

    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
        setRemoteTiles((tiles) =>
          tiles.map((tile) =>
            tile.id === remoteUserId ? { ...tile, connectionState: peer.connectionState } : tile
          )
        );
        return;
      }

      refreshRemoteTiles();
    };

    return peer;
  };

  const createOffer = async (remoteUserId: string) => {
    const peer = getPeer(remoteUserId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await broadcastSignal({ to: remoteUserId, kind: "offer", description: offer });
  };

  const handleSignal = async (payload: SignalPayload) => {
    if (payload.from === currentUser.id || payload.to !== currentUser.id) {
      return;
    }

    const peer = getPeer(payload.from);

    if (payload.kind === "offer" && payload.description) {
      await peer.setRemoteDescription(new RTCSessionDescription(payload.description));
      await flushQueuedIce(payload.from, peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await broadcastSignal({ to: payload.from, kind: "answer", description: answer });
      return;
    }

    if (payload.kind === "answer" && payload.description) {
      if (peer.signalingState !== "stable") {
        await peer.setRemoteDescription(new RTCSessionDescription(payload.description));
        await flushQueuedIce(payload.from, peer);
      }
      return;
    }

    if (payload.kind === "ice" && payload.candidate) {
      await addIce(payload.from, payload.candidate);
    }
  };

  const syncPresence = async () => {
    const channel = channelRef.current;

    if (!channel) {
      return;
    }

    const state = channel.presenceState() as Record<string, PresenceMeta[]>;
    const nextParticipants = Object.entries(state)
      .map(([id, metas]) => metas[0] ?? { id, name: "Class participant", role: "student", joined_at: new Date().toISOString() })
      .filter((participant) => participant.id !== currentUser.id);

    participantRef.current = new Map(nextParticipants.map((participant) => [participant.id, participant]));
    setParticipants(nextParticipants);

    const presentIds = new Set(nextParticipants.map((participant) => participant.id));

    for (const remoteUserId of Array.from(peersRef.current.keys())) {
      if (!presentIds.has(remoteUserId)) {
        closePeer(remoteUserId);
      }
    }

    for (const participant of nextParticipants) {
      if (!peersRef.current.has(participant.id) && currentUser.id > participant.id) {
        await createOffer(participant.id);
      }
    }

    refreshRemoteTiles();
  };

  const startRoom = async () => {
    try {
      setStatus("starting");
      setNote("Requesting camera and microphone permission for the native live classroom.");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioEnabled(stream.getAudioTracks().every((track) => track.enabled));
      setVideoEnabled(stream.getVideoTracks().every((track) => track.enabled));

      // Mark attendance for proctoring
      await markAttendance(sessionId, "join");
      void logEvent(sessionId, "presence_ping", { source: "room_start" });
      setProctorStatus("monitoring");

      const supabase = createClient();
      supabaseRef.current = supabase;
      const channel = supabase.channel(topic, {
        config: {
          broadcast: { self: false },
          presence: { key: currentUser.id }
        }
      });

      channelRef.current = channel;

      channel
        .on("broadcast", { event: "signal" }, ({ payload }) => {
          void handleSignal(payload as SignalPayload);
        })
        .on("presence", { event: "sync" }, () => {
          void syncPresence();
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          if (typeof key === "string") {
            closePeer(key);
          }
        })
        .subscribe(async (subscriptionStatus) => {
          if (subscriptionStatus === "SUBSCRIBED") {
            await channel.track({
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
              joined_at: new Date().toISOString()
            });
            setStatus("live");
            setNote("ClassyGenz Live is active. Monitoring is enabled. Keep this tab visible during the session.");

            // Setup browser monitoring for proctoring
            const handleVisibilityChange = () => {
              if (document.hidden) {
                void logEvent(sessionId, "tab_switch", { hidden: true });
                setEventCounts((prev) => ({ ...prev, tab_switch: prev.tab_switch + 1 }));
                if (proctorStatus !== "flagged") {
                  setProctorStatus("flagged");
                }
              }
            };

            const handleFullscreenChange = () => {
              if (!document.fullscreenElement) {
                void logEvent(sessionId, "fullscreen_exit", { source: "fullscreenchange" });
                setEventCounts((prev) => ({ ...prev, fullscreen_exit: prev.fullscreen_exit + 1 }));
              }
            };

            const handlePageHide = () => {
              void markAttendance(sessionId, "leave", true);
            };

            document.addEventListener("visibilitychange", handleVisibilityChange);
            document.addEventListener("fullscreenchange", handleFullscreenChange);
            window.addEventListener("pagehide", handlePageHide);

            // Attendance heartbeat every 30 seconds
            heartbeatRef.current = window.setInterval(() => {
              void markAttendance(sessionId, "heartbeat");
              void logEvent(sessionId, "presence_ping", {
                source: "heartbeat",
                visible: !document.hidden,
                fullscreen: Boolean(document.fullscreenElement)
              });
            }, 30000);

            // Basic face detection loop every 2 seconds
            faceDetectionRef.current = window.setInterval(async () => {
              if (videoRef.current && videoRef.current.srcObject) {
                // Simple canvas-based face count (placeholder for MediaPipe later)
                const video = videoRef.current;
                if (video.videoWidth && video.videoHeight) {
                  // Placeholder: detect if video is flowing
                  // Real implementation would use MediaPipe Face Detection API
                  const canvas = document.createElement("canvas");
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const context = canvas.getContext("2d");
                  if (context) {
                    context.drawImage(video, 0, 0);
                    // Basic pixel analysis (very simple; real face detection should use ML)
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    let nonBlackPixels = 0;
                    for (let i = 0; i < data.length; i += 4) {
                      if (data[i] + data[i + 1] + data[i + 2] > 30) {
                        nonBlackPixels++;
                      }
                    }
                    // If significant non-black pixels, mark as face detected
                    const isPresent = nonBlackPixels > (canvas.width * canvas.height) / 10;
                    if (!isPresent) {
                      setFaceCount(0);
                    }
                  }
                }
              }
            }, 2000);

            cleanupRef.current = () => {
              document.removeEventListener("visibilitychange", handleVisibilityChange);
              document.removeEventListener("fullscreenchange", handleFullscreenChange);
              window.removeEventListener("pagehide", handlePageHide);
            };
          }
        });
    } catch (error) {
      setStatus("error");
      setNote(error instanceof Error ? error.message : "Unable to start the native live room.");
    }
  };

  const stopRoom = async () => {
    channelRef.current?.untrack();
    await channelRef.current?.unsubscribe();
    channelRef.current = null;

    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    participantRef.current.clear();
    pendingIceRef.current.clear();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setParticipants([]);
    setRemoteTiles([]);

    // Cleanup monitoring
    if (heartbeatRef.current) {
      window.clearInterval(heartbeatRef.current);
    }
    if (faceDetectionRef.current) {
      window.clearInterval(faceDetectionRef.current);
    }
    cleanupRef.current?.();

    // Mark attendance leave
    await markAttendance(sessionId, "leave", true);

    setStatus("idle");
    setProctorStatus("idle");
    setNote("Native room stopped. You can start it again when the class resumes.");
  };

  useEffect(() => {
    return () => {
      void stopRoom();
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
      }
      if (faceDetectionRef.current) {
        window.clearInterval(faceDetectionRef.current);
      }
      cleanupRef.current?.();
    };
  }, []);

  const toggleAudio = () => {
    const next = !audioEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setAudioEnabled(next);
  };

  const toggleVideo = () => {
    const next = !videoEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setVideoEnabled(next);
  };

  const reconnectPeers = async () => {
    for (const participant of participants) {
      closePeer(participant.id);
    }

    for (const participant of participants) {
      if (currentUser.id > participant.id) {
        await createOffer(participant.id);
      }
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-sky">ClassyGenz Live</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Native meeting room</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{note}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-mist px-3 py-2 text-slate-600">Room: {status}</span>
          <span className="rounded-full bg-mist px-3 py-2 text-slate-600">Peers: {participants.length}</span>
          <span className="rounded-full bg-mist px-3 py-2 text-slate-600">Mic: {audioEnabled ? "on" : "muted"}</span>
          <span className="rounded-full bg-mist px-3 py-2 text-slate-600">Camera: {videoEnabled ? "on" : "off"}</span>
          {proctorStatus === "monitoring" ? (
            <span className="rounded-full bg-sky/10 px-3 py-2 text-sky">🛡️ Monitoring active</span>
          ) : proctorStatus === "flagged" ? (
            <span className="rounded-full bg-rose-100 px-3 py-2 text-rose-700">⚠️ Flags: {Object.values(eventCounts).reduce((a, b) => a + b, 0)}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <StreamTile
          stream={localStream}
          title={currentUser.name}
          subtitle={currentUser.role === "teacher" ? "Teacher host" : "Student participant"}
          muted
          isLocal
          videoEnabled={videoEnabled}
          videoRef={videoRef}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {remoteTiles.length ? remoteTiles.map((tile) => (
            <StreamTile
              key={tile.id}
              stream={tile.stream}
              title={tile.name}
              subtitle={`${tile.role} - ${tile.connectionState}`}
              videoEnabled
            />
          )) : (
            <div className="flex min-h-[230px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No one else is connected yet. When classmates join this same session page, their video appears here.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {status === "live" || status === "starting" ? (
          <button
            type="button"
            onClick={() => void stopRoom()}
            className="inline-flex rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Leave room
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startRoom()}
            disabled={status === "starting"}
            className="inline-flex rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "starting" ? "Starting room..." : "Start ClassyGenz Live"}
          </button>
        )}

        <button
          type="button"
          onClick={toggleAudio}
          disabled={!localStream}
          className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {audioEnabled ? "Mute mic" : "Unmute mic"}
        </button>

        <button
          type="button"
          onClick={toggleVideo}
          disabled={!localStream}
          className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {videoEnabled ? "Turn camera off" : "Turn camera on"}
        </button>

        <button
          type="button"
          onClick={() => void reconnectPeers()}
          disabled={status !== "live" || !participants.length}
          className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reconnect peers
        </button>

        {fallbackMeetingUrl ? (
          <a
            href={fallbackMeetingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            Backup external link
          </a>
        ) : null}
      </div>
    </section>
  );
}