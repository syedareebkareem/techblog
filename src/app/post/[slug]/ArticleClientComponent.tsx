/* eslint-disable @next/next/no-img-element */
"use client";

import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import BookmarkButton from "@/components/BookmarkButton";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import AIArticleSummary from "@/components/AIArticleSummary";

// Utilities & Components
import { extractHeadings } from "@/lib/articleUtils";
import TableOfContents from "@/components/TableOfContents";
import ShareButtons from "@/components/ShareButtons";
import AuthorCard from "@/components/AuthorCard";
import RelatedPosts from "@/components/RelatedPosts";
import NewsletterCTA from "@/components/NewsletterCTA";
import ClapButton from "@/components/ClapButton";
import Comments from "@/components/Comments"; // IMPORTED YOUR COMMENTS COMPONENT

import styles from "./Article.module.css";

// ============= TYPES =============
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  created_at: string;
  cover_image: string | null;
  category: string;
  author_id: string;
  view_count: number;
  total_claps: number;
  reading_time_minutes: number | null;
  ai_summary: string | null;
  tags: { id: string; name: string; slug: string }[] | null;
}

interface Author {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
}

interface Props {
  slug: string;
}

export default function ArticleClientComponent({ slug }: Props) {
  // ============= STATE =============
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // ============= COMPUTED VARIABLES =============
  const headings = post?.content ? extractHeadings(post.content) : [];

  // ============= EFFECTS =============
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchAndTrackPost = async () => {
      if (!slug) return;

      try {
        setLoading(true);

        // 1. Fetch Post Data
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select(
            `
              id, title, slug, content, excerpt, cover_image, 
              category, created_at, view_count, reading_time_minutes,
              ai_summary, author_id, total_claps,
              tags ( id, name, slug )
            `,
          )
          .eq("slug", slug)
          .eq("published", true)
          .single();

        if (postError) throw postError;

        if (postData) {
          setPost(postData);

          // 2. Fetch Author Data
          if (postData.author_id) {
            const { data: authorData } = await supabase
              .from("user_profiles")
              .select("id, full_name, avatar_url, bio")
              .eq("id", postData.author_id)
              .single();

            if (authorData) setAuthor(authorData);
          }

          // 3. Track View
          await supabase
            .from("posts")
            .update({ view_count: (postData.view_count || 0) + 1 })
            .eq("id", postData.id);

          // 4. Track Reading History
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.user) {
              await supabase.from("reading_history").upsert(
                {
                  user_id: session.user.id,
                  post_id: postData.id,
                  read_at: new Date().toISOString(),
                },
                { onConflict: "user_id,post_id" },
              );
            }
          } catch (err) {
            console.error("History tracking failed", err);
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndTrackPost();
  }, [slug]);

  useEffect(() => {
    if (typeof window !== "undefined" && Prism && post?.content) {
      const articleEl = document.querySelector(".article-content");
      if (articleEl) Prism.highlightAllUnder(articleEl);
    }
  }, [post?.content]);

  // ============= RENDER STATES =============
  if (loading) {
    return <div className={styles.loadingState}>Loading Intelligence...</div>;
  }

  if (!post) {
    return <div className={styles.loadingState}>Article not found.</div>;
  }

  const currentUrl = isMounted ? window.location.href : "";

  // ============= MAIN RENDER =============
  return (
    <div className={styles.container}>
      <ReadingProgressBar />

      <article className={styles.articleWrapper}>
        {/* --- HERO HEADER --- */}
        <header className={styles.heroHeader}>
          <span className={styles.categoryBadge}>{post.category}</span>
          <h1 className={styles.articleTitle}>{post.title}</h1>

          {/* META INFO */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "20px 0",
              marginBottom: "32px",
              flexWrap: "wrap",
            }}
          >
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.full_name}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "var(--brand-green, #10B981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "16px",
                }}
              >
                {author?.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {author?.full_name || "Unknown Author"}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  flexWrap: "wrap",
                }}
              >
                <span>📖 {post.reading_time_minutes || 1} min read</span>
                <span>
                  📅{" "}
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* --- COVER IMAGE --- */}
        {post.cover_image && (
          <div
            style={{
              marginBottom: "40px",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid var(--border-main)",
              width: "100%",
              maxHeight: "450px",
              background: "var(--bg-secondary)",
            }}
          >
            <Image
              src={post.cover_image}
              alt={post.title}
              width={1200}
              height={600}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              unoptimized
            />
          </div>
        )}

        {/* --- AI SUMMARY BOX --- */}
        <AIArticleSummary
          postId={post.id}
          content={post.content}
          title={post.title}
          cached={post.ai_summary}
        />

        {/* --- MAIN 3-COLUMN GRID --- */}
        <div className={styles.articleLayout}>
          {/* LEFT: Table of Contents */}
          <aside className={styles.leftSidebar}>
            {headings.length > 0 && <TableOfContents headings={headings} />}
          </aside>

          {/* CENTER: Rich Text Content */}
          <article className={styles.centerContent}>
            <div
              className={`${styles.richText} article-content`}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Engagement Footer */}
            <div className={styles.engagementSection}>
              <ClapButton
                postId={post.id}
                initialClaps={post.total_claps || 0}
              />
              <BookmarkButton postId={post.id} showLabel={true} />
              <ShareButtons
                title={post.title}
                url={currentUrl}
                description={post.excerpt}
              />
            </div>

            {/* Author Bio Card */}
            {author && (
              <div style={{ marginTop: "48px" }}>
                <AuthorCard
                  author={{
                    name: author.full_name,
                    avatar: author.avatar_url,
                    bio: author.bio,
                  }}
                />
              </div>
            )}

            {/* Bottom Newsletter and Comments Hook */}
            <hr
              style={{
                margin: "48px 0",
                borderTop: "1px solid var(--border-main)",
              }}
            />
            <div style={{ marginBottom: "40px" }}>
              <NewsletterCTA />
            </div>

            {/* REPLACED COMING SOON WITH ACTUAL COMPONENT */}
            <div id="comments">
              <Comments postId={post.id} />
            </div>
          </article>

          {/* RIGHT: Sidebar Widgets */}
          <aside className={styles.rightSidebar}>
            <ShareButtons
              title={post.title}
              url={currentUrl}
              description={post.excerpt}
              variant="vertical"
            />
            <NewsletterCTA />
            <RelatedPosts
              category={post.category}
              excludeId={post.id}
              limit={3}
            />
          </aside>
        </div>
      </article>
    </div>
  );
}
