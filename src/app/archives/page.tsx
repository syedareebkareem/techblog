// src/app/archives/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, ChevronDown } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  created_at: string;
  view_count: number;
  cover_image: string | null;
}

export default function ArchivesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("posts")
        .select(
          "id, title, slug, category, created_at, view_count, cover_image",
        )
        .eq("published", true)
        .order("created_at", { ascending: false });

      setPosts(data || []);

      // Auto-open the most recent 2 months
      if (data && data.length > 0) {
        const months = new Set<string>();
        data.slice(0, 20).forEach((p) => {
          const key = new Date(p.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          });
          months.add(key);
        });
        setOpenGroups(new Set(Array.from(months).slice(0, 2)));
      }

      setLoading(false);
    }
    load();
  }, []);

  // Group by Year → Month
  const grouped: Record<string, Record<string, Post[]>> = {};
  posts.forEach((post) => {
    const d = new Date(post.created_at);
    const year = d.getFullYear().toString();
    const month = d.toLocaleDateString("en-US", { month: "long" });
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(post);
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 8px",
              letterSpacing: "-1px",
            }}
          >
            Archives
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {posts.length} articles published across{" "}
            {Object.keys(grouped).length} year
            {Object.keys(grouped).length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading archives...</p>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([year, months]) => (
              <div key={year} style={{ marginBottom: "40px" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: "0 0 20px",
                    paddingBottom: "12px",
                    borderBottom: "2px solid var(--brand-green)",
                    display: "inline-block",
                  }}
                >
                  {year}
                </h2>

                {Object.entries(months)
                  .sort((a, b) => {
                    const monthOrder = [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ];
                    return monthOrder.indexOf(b[0]) - monthOrder.indexOf(a[0]);
                  })
                  .map(([month, monthPosts]) => {
                    const groupKey = `${year}-${month}`;
                    const isOpen = openGroups.has(groupKey);

                    return (
                      <div
                        key={month}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-main)",
                          borderRadius: "12px",
                          overflow: "hidden",
                          marginBottom: "12px",
                        }}
                      >
                        {/* Month Header */}
                        <button
                          onClick={() => toggleGroup(groupKey)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "16px 20px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "var(--bg-hover)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "transparent";
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <h3
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                margin: 0,
                              }}
                            >
                              {month}
                            </h3>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                padding: "2px 8px",
                                background: "var(--brand-light)",
                                color: "var(--brand-green)",
                                borderRadius: "999px",
                              }}
                            >
                              {monthPosts.length} article
                              {monthPosts.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <ChevronDown
                            size={18}
                            color="var(--text-tertiary)"
                            style={{
                              transform: isOpen ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </button>

                        {/* Posts List */}
                        {isOpen && (
                          <div
                            style={{
                              borderTop: "1px solid var(--border-main)",
                            }}
                          >
                            {monthPosts.map((post, i) => (
                              <Link
                                key={post.id}
                                href={`/post/${post.slug}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "14px",
                                  padding: "14px 20px",
                                  borderBottom:
                                    i < monthPosts.length - 1
                                      ? "1px solid var(--border-subtle)"
                                      : "none",
                                  textDecoration: "none",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLElement
                                  ).style.background = "var(--bg-hover)";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLElement
                                  ).style.background = "transparent";
                                }}
                              >
                                {/* Date */}
                                <div
                                  style={{
                                    width: "44px",
                                    flexShrink: 0,
                                    textAlign: "center",
                                    background: "var(--bg-secondary)",
                                    borderRadius: "8px",
                                    padding: "6px",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "18px",
                                      fontWeight: 800,
                                      color: "var(--text-primary)",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {new Date(post.created_at).getDate()}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "10px",
                                      color: "var(--text-tertiary)",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {new Date(
                                      post.created_at,
                                    ).toLocaleDateString("en-US", {
                                      weekday: "short",
                                    })}
                                  </div>
                                </div>

                                {/* Title + meta */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 600,
                                      color: "var(--text-primary)",
                                      margin: "0 0 3px",
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
                                    {post.category}
                                  </p>
                                </div>

                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    color: "var(--text-tertiary)",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Eye size={12} /> {post.view_count || 0}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
