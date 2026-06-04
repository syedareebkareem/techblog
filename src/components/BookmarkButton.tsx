"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bookmark, BookmarkCheck } from "lucide-react";
import toast from "react-hot-toast";

interface BookmarkButtonProps {
  postId: string;
  showLabel?: boolean;
}

export default function BookmarkButton({
  postId,
  showLabel = false,
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if already bookmarked
  useEffect(() => {
    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;
      setUserId(session.user.id);

      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("post_id", postId)
        .maybeSingle();

      if (data) setSaved(true);
    }
    check();
  }, [postId]);

  const toggle = async () => {
    if (!userId) {
      toast.error("Sign in to bookmark articles");
      return;
    }

    setLoading(true);

    if (saved) {
      // Remove bookmark by matching user_id and post_id directly
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (!error) {
        setSaved(false);
        toast.success("Bookmark removed");
      } else {
        toast.error("Could not remove bookmark");
      }
    } else {
      // Add bookmark
      const { error } = await supabase
        .from("bookmarks")
        .insert([{ user_id: userId, post_id: postId }]);

      if (!error) {
        setSaved(true);
        toast.success("Article bookmarked!");
      } else {
        toast.error("Could not save bookmark");
      }
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? "Remove bookmark" : "Save for later"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: showLabel ? "8px 14px" : "8px",
        borderRadius: "8px",
        border: `1px solid ${saved ? "var(--brand-green)" : "var(--border-main)"}`,
        background: saved ? "var(--brand-light)" : "transparent",
        color: saved ? "var(--brand-green)" : "var(--text-secondary)",
        cursor: loading ? "wait" : "pointer",
        fontSize: "14px",
        fontWeight: 500,
        transition: "all 0.15s",
      }}
    >
      {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      {showLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
