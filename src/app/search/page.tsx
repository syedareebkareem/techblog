// src/app/search/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Search, Eye, Clock, X, SlidersHorizontal } from "lucide-react";
import styles from "./Search.module.css";

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
  tags: string[] | null;
}

// ---- highlight matching text ----
function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className={styles.highlight}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams?.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [results, setResults] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCat, setFilterCat] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load all posts once on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("posts")
        .select(
          "id, title, slug, excerpt, cover_image, category, created_at, view_count, total_claps, reading_time_minutes, tags",
        )
        .eq("published", true)
        .order("created_at", { ascending: false });

      const posts = data || [];
      setAllPosts(posts);
      const cats = Array.from(
        new Set(posts.map((p) => p.category).filter(Boolean)),
      );
      setCategories(cats);
      setLoading(false);
    }
    load();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Sync URL param → input
  useEffect(() => {
    if (initialQ) setQuery(initialQ);
  }, [initialQ]);

  // Filter + sort posts
  useEffect(() => {
    let filtered = allPosts;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        // Fix: Safely handle tags whether they are an array of strings or array of objects
        const tagStrings = p.tags
          ? p.tags
              .map((t) => (typeof t === "string" ? t : (t as any).name || ""))
              .join(" ")
          : "";

        return (
          p.title.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          tagStrings.toLowerCase().includes(q)
        );
      });
    }

    if (filterCat !== "All") {
      filtered = filtered.filter((p) => p.category === filterCat);
    }

    if (sortBy === "popular") {
      filtered = [...filtered].sort(
        (a, b) => (b.view_count || 0) - (a.view_count || 0),
      );
    }

    setResults(filtered);

    // Update URL
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, allPosts, filterCat, sortBy, router]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const readingTime = (p: Post) =>
    p.reading_time_minutes ? `${p.reading_time_minutes} min` : "1 min";

  // Helper to safely render tag pills
  const renderTags = (tags: any[]) => {
    if (!tags || tags.length === 0) return null;
    return (
      <div className={styles.tagRow}>
        {tags.slice(0, 4).map((tag, i) => {
          const tagLabel = typeof tag === "string" ? tag : tag.name;
          return tagLabel ? (
            <span key={i} className={styles.tagPill}>
              #{tagLabel}
            </span>
          ) : null;
        })}
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Search Articles</h1>
          <p className={styles.pageSubtitle}>
            {allPosts.length} articles available
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className={styles.searchBox}>
          <Search size={22} className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, keyword, category, or tag..."
            className={styles.searchInput}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className={styles.clearBtn}>
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`${styles.filterToggleBtn} ${filtersOpen ? styles.filterToggleActive : ""}`}
            title="Filters"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* FILTERS PANEL */}
        {filtersOpen && (
          <div className={styles.filtersPanel}>
            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}>Category</p>
              <div className={styles.filterPills}>
                {["All", ...categories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`${styles.pill} ${filterCat === cat ? styles.pillActive : ""}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}>Sort By</p>
              <div className={styles.filterPills}>
                {[
                  { value: "newest", label: "Newest First" },
                  { value: "popular", label: "Most Viewed" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as "newest" | "popular")}
                    className={`${styles.pill} ${sortBy === opt.value ? styles.pillActive : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS COUNT */}
        {debouncedQuery && (
          <p className={styles.resultCount}>
            {loading
              ? "Searching..."
              : `${results.length} result${results.length !== 1 ? "s" : ""} for "${debouncedQuery}"`}
          </p>
        )}

        {/* RESULTS */}
        {loading ? (
          <div className={styles.loadingState}>Searching...</div>
        ) : results.length === 0 && debouncedQuery ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              No results for &quot;{debouncedQuery}&quot;
            </p>
            <p className={styles.emptyDesc}>
              Try different keywords or browse by category.
            </p>
            <div className={styles.emptySuggestions}>
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setQuery(cat);
                    setFilterCat("All");
                  }}
                  className={styles.pill}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.resultsList}>
            {(debouncedQuery ? results : allPosts.slice(0, 20)).map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                className={styles.resultCard}
              >
                {post.cover_image && (
                  <div className={styles.resultImg}>
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className={styles.resultImgEl}
                    />
                  </div>
                )}
                <div className={styles.resultBody}>
                  <span className={styles.resultCat}>{post.category}</span>
                  <h3 className={styles.resultTitle}>
                    {debouncedQuery
                      ? highlight(post.title, debouncedQuery)
                      : post.title}
                  </h3>
                  {post.excerpt && (
                    <p className={styles.resultExcerpt}>
                      {debouncedQuery
                        ? highlight(post.excerpt, debouncedQuery)
                        : post.excerpt}
                    </p>
                  )}

                  {/* TAGS RENDER FIX */}
                  {renderTags(post.tags || [])}

                  <div className={styles.resultMeta}>
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
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "80px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          Loading search...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
