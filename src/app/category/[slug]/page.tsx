"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, Heart, Clock, ArrowUpDown, Grid, List } from "lucide-react";
import styles from "./Category.module.css";

// ============= TYPES =============
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

// ============= CATEGORY META MAP =============
// Maps URL slug to display info
const CATEGORY_META: Record<
  string,
  {
    icon: string;
    description: string;
    color: string;
  }
> = {
  "ai-updates": {
    icon: "🤖",
    description:
      "Breaking news in artificial intelligence, machine learning, LLMs, and neural networks.",
    color: "#8B5CF6",
  },
  software: {
    icon: "💻",
    description:
      "Updates on developer tools, frameworks, SaaS products, and software engineering.",
    color: "#3B82F6",
  },
  hardware: {
    icon: "🔧",
    description:
      "The latest in silicon, devices, computing machinery, and hardware engineering.",
    color: "#F59E0B",
  },
  "web-dev": {
    icon: "🌐",
    description:
      "Frontend, backend, DevOps, and modern web architecture patterns.",
    color: "#059669",
  },
  cybersecurity: {
    icon: "🔒",
    description:
      "Threat intelligence, data protection, and enterprise security news.",
    color: "#DC2626",
  },
  "tech-deals": {
    icon: "💸",
    description:
      "The best discounts and sales on gear, software, and subscriptions.",
    color: "#F59E0B",
  },
  economy: {
    icon: "📈",
    description:
      "World markets, tech stock analysis, and global economic trends.",
    color: "#06B6D4",
  },
};

// ============= MAIN COMPONENT =============
export default function CategoryPage() {
  const params = useParams();
  const categorySlug = (params?.slug as string) || "";

  // Derive display title from slug
  const displayTitle = categorySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const meta = CATEGORY_META[categorySlug.toLowerCase()] || {
    icon: "📰",
    description: `Explore all articles in ${displayTitle}.`,
    color: "#059669",
  };

  // ============= STATE =============
  const [posts, setPosts] = useState<Post[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(12);

  // ============= FETCH =============
  useEffect(() => {
    const fetchCategoryPosts = async () => {
      try {
        setLoading(true);

        // Build query — ilike matches both "AI Updates" and "ai-updates"
        const matchTitle = displayTitle;
        const matchSlug = categorySlug.replace(/-/g, " ");

        const { data, error } = await supabase
          .from("posts")
          .select(
            "id, title, slug, excerpt, cover_image, category, created_at, view_count, total_claps, reading_time_minutes",
          )
          .eq("published", true)
          .or(`category.ilike.%${matchTitle}%,category.ilike.%${matchSlug}%`)
          .order(sortBy === "popular" ? "view_count" : "created_at", {
            ascending: false,
          });

        if (error) throw error;
        setPosts(data || []);

        // Fetch all category names for sidebar
        const { data: allPosts } = await supabase
          .from("posts")
          .select("category")
          .eq("published", true);

        const cats = Array.from(
          new Set(allPosts?.map((p) => p.category).filter(Boolean) || []),
        );
        setAllCategories(cats);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) fetchCategoryPosts();
  }, [categorySlug, displayTitle, sortBy]);

  // ============= HELPERS =============
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getReadingTime = (post: Post) =>
    post.reading_time_minutes ? `${post.reading_time_minutes} min` : "1 min";

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = posts.length > visibleCount;

  // ============= RENDER =============
  return (
    <div className={styles.pageWrapper}>
      {/* ===== HERO BANNER ===== */}
      <div
        className={styles.heroBanner}
        style={{ borderBottom: `3px solid ${meta.color}` }}
      >
        <div className={styles.heroBannerInner}>
          <span className={styles.heroIcon}>{meta.icon}</span>
          <div className={styles.heroTextBlock}>
            <p className={styles.heroLabel}>Category Archive</p>
            <h1 className={styles.heroTitle}>{displayTitle}</h1>
            <p className={styles.heroDescription}>{meta.description}</p>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{posts.length}</span>
              <span className={styles.heroStatLabel}>Articles</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className={styles.mainLayout}>
        {/* ===== POSTS COLUMN ===== */}
        <div className={styles.postsColumn}>
          {/* TOOLBAR: Sort + View Mode */}
          <div className={styles.toolbar}>
            <p className={styles.resultCount}>
              {loading
                ? "Loading..."
                : `${posts.length} article${posts.length !== 1 ? "s" : ""} found`}
            </p>
            <div className={styles.toolbarRight}>
              {/* Sort Toggle */}
              <div className={styles.sortGroup}>
                <button
                  onClick={() => setSortBy("newest")}
                  className={`${styles.sortBtn} ${sortBy === "newest" ? styles.sortBtnActive : ""}`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSortBy("popular")}
                  className={`${styles.sortBtn} ${sortBy === "popular" ? styles.sortBtnActive : ""}`}
                >
                  Most Viewed
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className={styles.viewToggle}>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
                  title="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* POSTS */}
          {loading ? (
            <div className={styles.skeletonGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImg} />
                  <div style={{ padding: "14px" }}>
                    <div
                      className={styles.skeletonLine}
                      style={{
                        width: "40%",
                        height: "10px",
                        marginBottom: "8px",
                      }}
                    />
                    <div
                      className={styles.skeletonLine}
                      style={{
                        width: "90%",
                        height: "18px",
                        marginBottom: "6px",
                      }}
                    />
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "60%", height: "18px" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                No articles published in <strong>{displayTitle}</strong> yet.
              </p>
              <Link href="/" className={styles.emptyLink}>
                ← Back to Homepage
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className={styles.postsGrid}>
              {visiblePosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className={styles.postCard}
                >
                  <div className={styles.postImgWrapper}>
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className={styles.postImg}
                      />
                    ) : (
                      <div className={styles.noImg}>{meta.icon}</div>
                    )}
                    <span
                      className={styles.categoryBadge}
                      style={{ background: meta.color }}
                    >
                      {post.category}
                    </span>
                  </div>
                  <div className={styles.postBody}>
                    <h3 className={styles.postTitle}>{post.title}</h3>
                    {post.excerpt && (
                      <p className={styles.postExcerpt}>{post.excerpt}</p>
                    )}
                    <div className={styles.postMeta}>
                      <span className={styles.metaItem}>
                        <Clock size={12} /> {getReadingTime(post)}
                      </span>
                      <span className={styles.metaItem}>
                        <Eye size={12} /> {post.view_count || 0}
                      </span>
                      <span className={styles.metaItem}>
                        <Heart size={12} /> {post.total_claps || 0}
                      </span>
                      <span className={styles.metaDate}>
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* LIST VIEW */
            <div className={styles.postsList}>
              {visiblePosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className={styles.listCard}
                >
                  {post.cover_image && (
                    <div className={styles.listImgWrapper}>
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className={styles.listImg}
                      />
                    </div>
                  )}
                  <div className={styles.listBody}>
                    <span
                      className={styles.listCatBadge}
                      style={{ color: meta.color }}
                    >
                      {post.category}
                    </span>
                    <h3 className={styles.listTitle}>{post.title}</h3>
                    {post.excerpt && (
                      <p className={styles.listExcerpt}>{post.excerpt}</p>
                    )}
                    <div className={styles.postMeta}>
                      <span className={styles.metaItem}>
                        <Clock size={12} /> {getReadingTime(post)}
                      </span>
                      <span className={styles.metaItem}>
                        <Eye size={12} /> {post.view_count || 0}
                      </span>
                      <span className={styles.metaItem}>
                        <Heart size={12} /> {post.total_claps || 0}
                      </span>
                      <span className={styles.metaDate}>
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* LOAD MORE */}
          {hasMore && !loading && (
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <button
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className={styles.loadMoreBtn}
              >
                Load More Articles
              </button>
            </div>
          )}
        </div>

        {/* ===== SIDEBAR ===== */}
        <aside className={styles.sidebar}>
          {/* OTHER CATEGORIES */}
          <div className={styles.sideWidget}>
            <h3 className={styles.widgetTitle}>Browse Topics</h3>
            <div className={styles.otherCats}>
              {allCategories
                .filter((c) => c.toLowerCase() !== displayTitle.toLowerCase())
                .map((cat) => {
                  const catSlug = cat.toLowerCase().replace(/\s+/g, "-");
                  const catMeta = CATEGORY_META[catSlug] || {
                    icon: "📰",
                    color: "#059669",
                  };
                  return (
                    <Link
                      key={cat}
                      href={`/category/${catSlug}`}
                      className={styles.catLink}
                    >
                      <span>{catMeta.icon}</span>
                      <span className={styles.catLinkText}>{cat}</span>
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "var(--text-tertiary)",
                          fontSize: "12px",
                        }}
                      >
                        →
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* BACK TO HOME */}
          <div className={styles.sideWidget}>
            <Link href="/" className={styles.backHomeBtn}>
              ← Back to All Articles
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
