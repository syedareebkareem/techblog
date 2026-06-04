"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ViewCounter({
  postId,
  initialViews,
}: {
  postId: string;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    const storageKey = `viewed_${postId}`;
    const hasViewed = localStorage.getItem(storageKey);

    if (!hasViewed) {
      // Optimistic UI: Instantly show +1 on the screen so it never says 0 for a new reader
      setViews((prev) => prev + 1);

      const registerView = async () => {
        await supabase.rpc("increment_view_count", { post_id: postId });
      };

      registerView();
      localStorage.setItem(storageKey, "true");
    }

    // Real-time WebSocket listener
    const channel = supabase
      .channel(`public:posts:id=eq.${postId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${postId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.view_count === "number") {
            setViews(payload.new.view_count);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return (
    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-1 rounded-md transition-all">
      <svg
        className="w-4 h-4 text-emerald-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span className="font-medium tabular-nums">{views}</span> views
    </span>
  );
}
