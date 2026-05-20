"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeMessageListener({ classId }: { classId: string }) {
  const router = useRouter();

  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`class-stream-${classId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `class_id=eq.${classId}`
          },
          () => {
            router.refresh();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "materials",
            filter: `class_id=eq.${classId}`
          },
          () => {
            router.refresh();
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      return;
    }
  }, [classId, router]);

  return null;
}
