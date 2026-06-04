// src/app/profile/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, Heart, Clock, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

// ============= NATIVE BRAND ICONS =============
const TwitterIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

const GithubIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const LinkedinIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string;
  created_at: string;
  view_count: number;
  total_claps: number;
  reading_time_minutes: number | null;
}

export default function MyProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
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

      const [profileRes, postsRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single(),
        supabase
          .from("posts")
          .select(
            "id, title, slug, excerpt, cover_image, category, created_at, view_count, total_claps, reading_time_minutes",
          )
          .eq("author_id", session.user.id)
          .eq("published", true)
          .order("view_count", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      setLoading(false);
    }
    load();
  }, [router]);

  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const totalClaps = posts.reduce((sum, p) => sum + (p.total_claps || 0), 0);
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-primary)",
          color: "var(--text-secondary)",
        }}
      >
        Loading profile...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "48px 24px",
        transition: "var(--transition-theme)",
      }}
    >
      <div style={{ maxWidth: "880px", margin: "0 auto" }}>
        {/* PROFILE CARD */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-main)",
            borderRadius: "20px",
            padding: "40px",
            marginBottom: "32px",
            display: "flex",
            gap: "32px",
            alignItems: "flex-start",
            flexWrap: "wrap",
            transition: "var(--transition-theme)",
          }}
        >
          {/* Avatar */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid var(--brand-green)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "var(--brand-green)",
                color: "white",
                fontSize: "32px",
                fontWeight: 700,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initials}
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: "0 0 6px",
              }}
            >
              {profile?.full_name || "Anonymous"}
            </h1>
            {profile?.bio && (
              <p
                style={{
                  fontSize: "15px",
                  color: "var(--text-secondary)",
                  margin: "0 0 16px",
                  lineHeight: 1.6,
                }}
              >
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {profile?.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#1DA1F2" }}
                >
                  <TwitterIcon size={18} />
                </a>
              )}
              {profile?.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--text-primary)" }}
                >
                  <GithubIcon size={18} />
                </a>
              )}
              {profile?.linkedin && (
                <a
                  href={`https://linkedin.com/in/${profile.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#0A66C2" }}
                >
                  <LinkedinIcon size={18} />
                </a>
              )}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--brand-green)" }}
                >
                  <Globe size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
            {[
              { label: "Articles", value: posts.length },
              { label: "Views", value: totalViews.toLocaleString() },
              { label: "Claps", value: totalClaps.toLocaleString() },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  textAlign: "center",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-main)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-tertiary)",
                    marginTop: "4px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Edit Button */}
          <Link
            href="/settings"
            style={{
              display: "inline-block",
              padding: "8px 18px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-main)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            Edit Profile
          </Link>
        </div>

        {/* ARTICLES */}
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "20px",
          }}
        >
          Published Articles ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px",
              color: "var(--text-secondary)",
              background: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border-main)",
            }}
          >
            <p>No articles published yet.</p>
            <Link
              href="/admin/write"
              style={{
                color: "var(--brand-green)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Write your first article →
            </Link>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
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
                  alignItems: "flex-start",
                  transition: "all 0.2s",
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
                      lineHeight: 1.3,
                    }}
                  >
                    {post.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "14px",
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
                      <Heart size={12} /> {post.total_claps || 0}
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
