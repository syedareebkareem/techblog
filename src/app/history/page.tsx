/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { History, Eye, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface HistoryPost {
  historyId: string;
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  category: string;
  view_count: number;
  readAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const { data } = await supabase
        .from("reading_history")
        .select(
          `
          id,
          read_at,
          posts (id, title, slug, cover_image, category, view_count)
        `,
        )
        .eq("user_id", session.user.id)
        .order("read_at", { ascending: false })
        .limit(100);

      if (data) {
        // FIX: Safely extract the post object just like we did in bookmarks
        const mapped: HistoryPost[] = data
          .filter((h) => h.posts)
          .map((h) => {
            const postData = Array.isArray(h.posts) ? h.posts[0] : h.posts;

            return {
              historyId: h.id,
              readAt: h.read_at,
              ...postData,
            };
          });
        setHistory(mapped);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const clearHistory = async () => {
    if (!window.confirm("Clear all reading history?")) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await supabase
      .from("reading_history")
      .delete()
      .eq("user_id", session.user.id);
    setHistory([]);
    toast.success("History cleared");
  };

  // Group by date
  const grouped: Record<string, HistoryPost[]> = {};
  history.forEach((h) => {
    const date = new Date(h.readAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(h);
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                background: "var(--bg-secondary)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <History size={26} color="var(--text-secondary)" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Reading History
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {history.length} articles read
              </p>
            </div>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "transparent",
                border: "1px solid var(--color-error)",
                borderRadius: "8px",
                color: "var(--color-error)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {loading ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              padding: "48px",
            }}
          >
            Loading...
          </p>
        ) : history.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--border-main)",
            }}
          >
            <p style={{ color: "var(--text-secondary)" }}>
              No reading history yet. Start reading!
            </p>
            <Link
              href="/"
              style={{
                color: "var(--brand-green)",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
                marginTop: "12px",
              }}
            >
              Browse Articles →
            </Link>
          </div>
        ) : (
          Object.entries(grouped).map(([date, posts]) => (
            <div key={date} style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: "0 0 12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--border-main)",
                }}
              >
                {date}
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {posts.map((post) => (
                  <Link
                    key={post.historyId}
                    href={`/post/${post.slug}`}
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "center",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-main)",
                      borderRadius: "10px",
                      padding: "12px",
                      textDecoration: "none",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--brand-green)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--border-main)";
                    }}
                  >
                    {post.cover_image && (
                      <img
                        src={post.cover_image}
                        alt=""
                        style={{
                          width: "60px",
                          height: "44px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          margin: "0 0 2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.title}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-tertiary)",
                          margin: 0,
                        }}
                      >
                        {post.category} · {post.view_count || 0} views
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-tertiary)",
                        flexShrink: 0,
                      }}
                    >
                      {new Date(post.readAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
