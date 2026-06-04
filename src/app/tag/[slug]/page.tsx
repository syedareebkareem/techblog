// src/app/tag/[slug]/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, Hash } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string;
  created_at: string;
  view_count: number;
  tags: string[] | null;
}

export default function TagPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const displayTag = slug.replace(/-/g, " ");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTagPosts() {
      setLoading(true);
      // PostgreSQL array contains operator: tags @> ARRAY[tag]
      const { data } = await supabase
        .from("posts")
        .select(
          "id, title, slug, excerpt, cover_image, category, created_at, view_count, tags",
        )
        .eq("published", true)
        .contains("tags", [displayTag])
        .order("created_at", { ascending: false });

      setPosts(data || []);
      setLoading(false);
    }
    if (slug) fetchTagPosts();
  }, [slug, displayTag]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-main)",
            borderRadius: "16px",
            padding: "40px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "var(--brand-light)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Hash size={32} color="var(--brand-green)" />
          </div>
          <div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--brand-green)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                margin: "0 0 6px",
              }}
            >
              Tag Archive
            </p>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: "0 0 4px",
                textTransform: "capitalize",
              }}
            >
              #{displayTag}
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {loading ? "..." : `${posts.length} articles`}
            </p>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <p
            style={{
              color: "var(--text-secondary)",
              textAlign: "center",
              padding: "40px",
            }}
          >
            Loading...
          </p>
        ) : posts.length === 0 ? (
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
              No articles tagged &quot;#{displayTag}&quot; yet.
            </p>
            <Link
              href="/search"
              style={{
                color: "var(--brand-green)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Browse all articles →
            </Link>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                style={{
                  display: "flex",
                  gap: "16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-main)",
                  borderRadius: "12px",
                  padding: "16px",
                  textDecoration: "none",
                  transition: "all 0.15s",
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
                    alt={post.title}
                    style={{
                      width: "100px",
                      height: "70px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
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
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      margin: "4px 0 6px",
                    }}
                  >
                    {post.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
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
                    <span>
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
