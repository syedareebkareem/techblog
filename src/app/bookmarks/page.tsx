/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bookmark, Eye, Clock, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface BookmarkedPost {
  bookmarkId: string;
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string;
  created_at: string;
  view_count: number;
  reading_time_minutes: number | null;
  savedAt: string;
}

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
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

      // Join bookmarks with posts
      const { data, error } = await supabase
        .from("bookmarks")
        .select(
          `
          id,
          created_at,
          posts (
            id, title, slug, excerpt, cover_image,
            category, created_at, view_count, reading_time_minutes
          )
        `,
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // FIX: Safely extract the post object whether Supabase returns an object or an array of 1 object
        const mapped: BookmarkedPost[] = data
          .filter((b) => b.posts)
          .map((b) => {
            // If it's an array, grab the first item. Otherwise, use the object directly.
            const postData = Array.isArray(b.posts) ? b.posts[0] : b.posts;

            return {
              bookmarkId: b.id,
              savedAt: b.created_at,
              ...postData,
            };
          });
        setBookmarks(mapped);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const removeBookmark = async (bookmarkId: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId);
    if (!error) {
      setBookmarks((prev) => prev.filter((b) => b.bookmarkId !== bookmarkId));
      toast.success("Bookmark removed");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "var(--brand-light)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bookmark size={26} color="var(--brand-green)" />
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
              Saved Articles
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {loading ? "..." : `${bookmarks.length} saved`}
            </p>
          </div>
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
        ) : bookmarks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--border-main)",
            }}
          >
            <Bookmark
              size={48}
              color="var(--text-tertiary)"
              style={{ marginBottom: "16px" }}
            />
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px",
              }}
            >
              No saved articles yet
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                margin: "0 0 20px",
              }}
            >
              Click the bookmark icon on any article to save it for later.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "var(--brand-green)",
                color: "white",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Browse Articles
            </Link>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {bookmarks.map((post) => (
              <div
                key={post.bookmarkId}
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-main)",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    style={{
                      width: "100px",
                      height: "72px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--brand-green)",
                      textTransform: "uppercase",
                    }}
                  >
                    {post.category}
                  </span>
                  <Link
                    href={`/post/${post.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        margin: "4px 0 6px",
                        lineHeight: 1.3,
                      }}
                    >
                      {post.title}
                    </h3>
                  </Link>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Eye size={12} /> {post.view_count || 0}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Clock size={12} /> {post.reading_time_minutes || 1} min
                    </span>
                    <span>Saved {formatDate(post.savedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeBookmark(post.bookmarkId)}
                  title="Remove bookmark"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                    padding: "4px",
                    borderRadius: "6px",
                    flexShrink: 0,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--color-error)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--text-tertiary)";
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
