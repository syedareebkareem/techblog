/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, Heart, Clock, TrendingUp, Mail, Check } from "lucide-react";
import styles from "./Home.module.css";

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

// ============= INNER COMPONENT =============
function HomepageContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams?.get("search") || "";
  const urlSort = searchParams?.get("sort") || "latest";

  // Data
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  // Pagination (LOWERED TO 3 SO YOU CAN SEE THE LOAD MORE BUTTON WITH LESS POSTS)
  const [visibleCount, setVisibleCount] = useState(3);

  // Newsletter
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // ============= FETCH DATA =============
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("posts")
        .select(
          "id, title, slug, excerpt, cover_image, category, created_at, view_count, total_claps, reading_time_minutes",
        )
        .eq("published", true);

      if (urlSort === "popular") {
        query = query.order("view_count", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      const allPosts = data || [];
      setPosts(allPosts);

      // Extract unique categories
      const cats = Array.from(
        new Set(allPosts.map((p) => p.category).filter(Boolean)),
      );
      setCategories(["All", ...cats]);

      // Trending = top 5 by view_count published in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const trending = [...allPosts]
        .filter((p) => new Date(p.created_at) >= thirtyDaysAgo)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5);
      setTrendingPosts(trending.length > 0 ? trending : allPosts.slice(0, 5));
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, [urlSort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Sync URL search param to local state
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  // ============= FILTERING =============
  const filteredPosts = posts.filter((post) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(q));
    const matchesCat =
      activeCategory === "All" || post.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const featuredPost = filteredPosts[0] || null;
  const editorsPicks = filteredPosts.slice(1, 4);
  const remainingPosts = filteredPosts.slice(4, visibleCount + 4);
  const hasMore = filteredPosts.length > visibleCount + 4;

  // ============= NEWSLETTER HANDLER =============
  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus("loading");
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email: newsletterEmail, status: "active" }]);
      if (error && !error.message.includes("duplicate")) throw error;
      setNewsletterStatus("success");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
    }
  };

  // ============= HELPERS =============
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const readingTime = (post: Post) =>
    post.reading_time_minutes
      ? `${post.reading_time_minutes} min`
      : `${Math.max(1, Math.ceil((post.excerpt?.split(" ").length || 50) / 200))} min`;

  // ============= RENDER =============
  return (
    <div className={styles.pageWrapper}>
      {/* ===== HERO BANNER ===== */}
      <div className={styles.heroBanner}>
        <div className={styles.heroBannerInner}>
          <h1 className={styles.heroTitle}>
            Engineering <span className={styles.heroAccent}>Intelligence</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Deep dives on AI, architecture, hardware and the future of software.
          </p>
          <form
            onSubmit={handleNewsletter}
            className={styles.heroNewsletterForm}
          >
            <input
              type="email"
              placeholder="Enter your email..."
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              disabled={newsletterStatus === "success"}
              className={styles.heroNewsletterInput}
              required
            />
            <button
              type="submit"
              disabled={
                newsletterStatus === "loading" || newsletterStatus === "success"
              }
              className={styles.heroNewsletterBtn}
            >
              {newsletterStatus === "success" ? (
                <>
                  <Check size={16} /> Subscribed!
                </>
              ) : newsletterStatus === "loading" ? (
                "Subscribing..."
              ) : (
                "Subscribe"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ===== MAIN LAYOUT: FEED + SIDEBAR ===== */}
      <div className={styles.mainLayout}>
        <div className={styles.feedColumn}>
          {/* CATEGORY PILL FILTERS */}
          <div className={styles.pillBar}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`${styles.pill} ${activeCategory === cat ? styles.pillActive : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SEARCH BAR */}
          <div className={styles.searchBar}>
            <svg
              className={styles.searchIcon}
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={styles.searchClear}
              >
                ✕
              </button>
            )}
          </div>

          {loading ? (
            /* SKELETON LOADING CARDS */
            <div className={styles.skeletonGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={styles.skeletonCard}
                  style={{ borderColor: "var(--border-main)" }}
                >
                  <div className={styles.skeletonImg} />
                  <div className={styles.skeletonBody}>
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "60%", height: "12px" }}
                    />
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "90%", height: "20px", marginTop: "8px" }}
                    />
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "75%", height: "20px", marginTop: "4px" }}
                    />
                    <div
                      className={styles.skeletonLine}
                      style={{
                        width: "40%",
                        height: "12px",
                        marginTop: "16px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                {/* FIX: Escaped quotes */}
                No articles found for{" "}
                <strong>&quot;{searchQuery || activeCategory}&quot;</strong>
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className={styles.emptyReset}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* FEATURED POST */}
              {featuredPost && (
                <div className={styles.sectionBlock}>
                  <h2 className={styles.sectionLabel}>Latest Post</h2>
                  <Link
                    href={`/post/${featuredPost.slug}`}
                    className={styles.featuredCard}
                  >
                    <div className={styles.featuredImgWrapper}>
                      {featuredPost.cover_image ? (
                        <img
                          src={featuredPost.cover_image}
                          alt={featuredPost.title}
                          className={styles.featuredImg}
                        />
                      ) : (
                        <div className={styles.noImgPlaceholder}>📄</div>
                      )}
                      <span className={styles.categoryBadge}>
                        {featuredPost.category}
                      </span>
                    </div>
                    <div className={styles.featuredBody}>
                      <h3 className={styles.featuredTitle}>
                        {featuredPost.title}
                      </h3>
                      <p className={styles.featuredExcerpt}>
                        {featuredPost.excerpt}
                      </p>
                      <div className={styles.postMeta}>
                        <span className={styles.metaItem}>
                          <Clock size={12} /> {readingTime(featuredPost)}
                        </span>
                        <span className={styles.metaItem}>
                          <Eye size={12} /> {featuredPost.view_count || 0}
                        </span>
                        <span className={styles.metaItem}>
                          <Heart size={12} /> {featuredPost.total_claps || 0}
                        </span>
                        <span className={styles.metaDate}>
                          {formatDate(featuredPost.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* EDITOR'S PICKS */}
              {editorsPicks.length > 0 && (
                <div className={styles.sectionBlock}>
                  {/* FIX: Escaped apostrophe */}
                  <h2 className={styles.sectionLabel}>Editor&apos;s Picks</h2>
                  <div className={styles.picksGrid}>
                    {editorsPicks.map((post) => (
                      <Link
                        key={post.id}
                        href={`/post/${post.slug}`}
                        className={styles.pickCard}
                      >
                        <div className={styles.pickImgWrapper}>
                          {post.cover_image ? (
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              className={styles.pickImg}
                            />
                          ) : (
                            <div className={styles.noImgPlaceholder}>📄</div>
                          )}
                          <span className={styles.categoryBadge}>
                            {post.category}
                          </span>
                        </div>
                        <div className={styles.pickBody}>
                          <h3 className={styles.pickTitle}>{post.title}</h3>
                          <div className={styles.postMeta}>
                            <span className={styles.metaItem}>
                              <Eye size={12} /> {post.view_count || 0}
                            </span>
                            <span className={styles.metaDate}>
                              {formatDate(post.created_at)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* MORE POSTS GRID */}
              {remainingPosts.length > 0 && (
                <div className={styles.sectionBlock}>
                  <h2 className={styles.sectionLabel}>More Articles</h2>
                  <div className={styles.postsGrid}>
                    {remainingPosts.map((post) => (
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
                            <div className={styles.noImgPlaceholder}>📄</div>
                          )}
                          <span className={styles.categoryBadge}>
                            {post.category}
                          </span>
                        </div>
                        <div className={styles.postBody}>
                          <h3 className={styles.postTitle}>{post.title}</h3>
                          <p className={styles.postExcerpt}>{post.excerpt}</p>
                          <div className={styles.postMeta}>
                            <span className={styles.metaItem}>
                              <Clock size={12} /> {readingTime(post)}
                            </span>
                            <span className={styles.metaItem}>
                              <Eye size={12} /> {post.view_count || 0}
                            </span>
                            <span className={styles.metaDate}>
                              {formatDate(post.created_at)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* LOAD MORE BUTTON */}
                  {hasMore && (
                    <div className={styles.loadMoreWrapper}>
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 6)}
                        className={styles.loadMoreBtn}
                      >
                        Load More Articles
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== RIGHT: SIDEBAR ===== */}
        <aside className={styles.sidebarColumn}>
          {/* TRENDING THIS WEEK */}
          <div className={styles.sideWidget}>
            <div className={styles.widgetHeader}>
              <TrendingUp size={18} color="var(--brand-green)" />
              <h3 className={styles.widgetTitle}>Trending Now</h3>
            </div>
            <div className={styles.trendingList}>
              {trendingPosts.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className={styles.trendingItem}
                >
                  <span className={styles.trendingRank}>{i + 1}</span>
                  <div className={styles.trendingInfo}>
                    <p className={styles.trendingTitle}>{post.title}</p>
                    <div className={styles.trendingMeta}>
                      <span>
                        <Eye size={11} /> {post.view_count || 0}
                      </span>
                      <span>{post.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* NEWSLETTER SIDEBAR */}
          <div
            className={styles.sideWidget}
            style={{
              background: "var(--brand-light)",
              border: "1px solid var(--brand-green)",
            }}
          >
            <div className={styles.widgetHeader}>
              <Mail size={18} color="var(--brand-green)" />
              <h3
                className={styles.widgetTitle}
                style={{ color: "var(--brand-text)" }}
              >
                Newsletter
              </h3>
            </div>
            <p
              className={styles.widgetDesc}
              style={{ color: "var(--brand-text)" }}
            >
              Get top articles weekly. No spam, unsubscribe anytime.
            </p>
            <form onSubmit={handleNewsletter}>
              <input
                type="email"
                placeholder="your@email.com"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterStatus === "success"}
                className={styles.widgetInput}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--brand-green)",
                }}
                required
              />
              <button
                type="submit"
                disabled={
                  newsletterStatus === "loading" ||
                  newsletterStatus === "success"
                }
                className={styles.widgetBtn}
              >
                {newsletterStatus === "success"
                  ? "✓ Subscribed!"
                  : newsletterStatus === "loading"
                    ? "..."
                    : "Subscribe Free"}
              </button>
            </form>
          </div>

          {/* BROWSE CATEGORIES */}
          <div className={styles.sideWidget}>
            <h3 className={styles.widgetTitle}>Browse Topics</h3>
            <div className={styles.topicGrid}>
              {categories
                .filter((c) => c !== "All")
                .map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`${styles.topicPill} ${activeCategory === cat ? styles.topicPillActive : ""}`}
                  >
                    {cat}
                  </button>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============= MAIN EXPORT =============
export default function Homepage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "var(--bg-primary)",
            color: "var(--text-secondary)",
          }}
        >
          Loading intelligence...
        </div>
      }
    >
      <HomepageContent />
    </Suspense>
  );
}
