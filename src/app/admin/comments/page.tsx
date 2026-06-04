"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  author_id: string;
  post: { title: string; slug: string } | null;
  user_profiles: { full_name: string | null; avatar_url: string | null } | null;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("comments")
        .select(
          `
          id, post_id, content, created_at, author_id,
          posts (title, slug),
          user_profiles (full_name, avatar_url)
        `,
        )
        .order("created_at", { ascending: false });

      setComments(data as Comment[]);
      setLoading(false);
    }
    load();
  }, []);

  const deleteComment = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast.success("Comment deleted");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: "24px",
        }}
      >
        Comments ({comments.length})
      </h1>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : comments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-main)",
            borderRadius: "12px",
            color: "var(--text-secondary)",
          }}
        >
          No comments yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-main)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                {comment.user_profiles?.avatar_url ? (
                  <img
                    src={comment.user_profiles.avatar_url}
                    alt=""
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "var(--brand-green)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {comment.user_profiles?.full_name?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: "0 0 2px",
                    }}
                  >
                    {comment.user_profiles?.full_name || "Anonymous"}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      margin: 0,
                    }}
                  >
                    on "{comment.post?.title || "Unknown Post"}" •{" "}
                    {formatDate(comment.created_at)}
                  </p>
                </div>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  margin: "0 0 12px",
                }}
              >
                {comment.content}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => deleteComment(comment.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "transparent",
                    border: "1px solid var(--color-error)",
                    borderRadius: "6px",
                    color: "var(--color-error)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--color-error)";
                    (e.currentTarget as HTMLElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--color-error)";
                  }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
