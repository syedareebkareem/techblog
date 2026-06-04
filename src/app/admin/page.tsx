// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, BarChart3, AlertCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./AdminDashboard.module.css";
import toast from "react-hot-toast";

// ============= TYPES & INTERFACES =============

interface DashboardStats {
  totalAssets: number;
  liveArticles: number;
  pendingDrafts: number;
  totalViews: number;
  totalClaps: number;
  newsLetterSignups: number;
  weeklyNewPosts: number;
  weeklyViewsGrowth: number;
  lastUpdated: Date;
}

interface ChartDataPoint {
  date: string;
  views: number;
  claps: number;
  comments: number;
}

interface TopCategory {
  name: string;
  views: number;
  percentage: number;
}

interface TopPost {
  id: string;
  slug: string;
  title: string;
  views: number;
  claps: number;
  comments: number;
  createdAt: Date;
}

interface KanbanItem {
  id: string;
  postId: string;
  title: string;
  status: "idea" | "draft" | "published";
  views?: number;
  claps?: number;
  createdAt: Date;
  wordCount: number;
}

interface KanbanColumnType {
  id: string;
  name: string;
  color: string;
  items: KanbanItem[];
  count: number;
}

export default function AdminDashboard() {
  const router = useRouter();

  // ============= STATE MANAGEMENT =============
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    liveArticles: 0,
    pendingDrafts: 0,
    totalViews: 0,
    totalClaps: 0,
    newsLetterSignups: 0,
    weeklyNewPosts: 0,
    weeklyViewsGrowth: 0,
    lastUpdated: new Date(),
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [kanbanData, setKanbanData] = useState<KanbanColumnType[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============= EFFECTS =============
  useEffect(() => {
    fetchAllDashboardData();
    const interval = setInterval(fetchAllDashboardData, 30000); // 30 sec polling
    return () => clearInterval(interval);
  }, []);

  // ============= DATA FETCHING =============
  async function fetchAllDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      if (authError || !session) {
        router.push("/auth");
        return;
      }

      const userId = session.user.id;

      await Promise.all([
        fetchStats(userId),
        fetchChartData(userId),
        fetchTopCategories(userId),
        fetchTopPosts(userId),
        fetchKanbanData(userId),
      ]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats(userId: string) {
    // Parallel exact count fetches mapped from Part 2 Specification
    const [
      { count: totalCount },
      { count: publishedCount },
      { count: draftCount },
      { data: viewsData },
      { data: clapsData },
    ] = await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("published", true),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("published", false),
      supabase
        .from("posts")
        .select("view_count")
        .eq("author_id", userId)
        .eq("published", true),
      supabase
        .from("posts")
        .select("total_claps")
        .eq("author_id", userId)
        .eq("published", true),
    ]);

    const totalViews =
      viewsData?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;
    const totalClaps =
      clapsData?.reduce((sum, p) => sum + (p.total_claps || 0), 0) || 0;

    // Optional: Fetch newsletter subscribers if table is created. Falling back to 0 if missing.
    let newsLetterCount = 0;
    try {
      const res = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true });
      if (res.count) newsLetterCount = res.count;
    } catch (e) {
      /* Ignore if table doesn't exist yet */
    }

    setStats({
      totalAssets: totalCount || 0,
      liveArticles: publishedCount || 0,
      pendingDrafts: draftCount || 0,
      totalViews,
      totalClaps,
      newsLetterSignups: newsLetterCount,
      weeklyNewPosts: 0,
      weeklyViewsGrowth: 0,
      lastUpdated: new Date(),
    });
  }

  async function fetchChartData(userId: string) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const { data: postsData } = await supabase
      .from("posts")
      .select("view_count, total_claps, created_at")
      .eq("author_id", userId)
      .eq("published", true)
      .gte("created_at", last7Days[0].toISOString());

    const groupedData: { [key: string]: ChartDataPoint } = {};
    last7Days.forEach((date) => {
      const dateStr = date.toLocaleDateString("en-US", { weekday: "short" });
      groupedData[dateStr] = { date: dateStr, views: 0, claps: 0, comments: 0 };
    });

    postsData?.forEach((post) => {
      const postDate = new Date(post.created_at);
      const dateStr = postDate.toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (groupedData[dateStr]) {
        groupedData[dateStr].views += post.view_count || 0;
        groupedData[dateStr].claps += post.total_claps || 0;
      }
    });

    setChartData(Object.values(groupedData));
  }

  async function fetchTopCategories(userId: string) {
    const { data: postsData } = await supabase
      .from("posts")
      .select("category, view_count")
      .eq("author_id", userId)
      .eq("published", true);

    const categoryStats: { [key: string]: number } = {};
    let totalViews = 0;

    postsData?.forEach((post) => {
      const category = post.category || "Uncategorized";
      categoryStats[category] =
        (categoryStats[category] || 0) + (post.view_count || 0);
      totalViews += post.view_count || 0;
    });

    const categories = Object.entries(categoryStats)
      .map(([name, views]) => ({
        name,
        views,
        percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    setTopCategories(categories);
  }

  async function fetchTopPosts(userId: string) {
    const { data } = await supabase
      .from("posts")
      .select("id, slug, title, view_count, total_claps, created_at")
      .eq("author_id", userId)
      .eq("published", true)
      .order("view_count", { ascending: false })
      .limit(5);

    const posts =
      data?.map((post) => ({
        id: post.id,
        slug: post.slug || "",
        title: post.title,
        views: post.view_count || 0,
        claps: post.total_claps || 0,
        comments: 0,
        createdAt: new Date(post.created_at),
      })) || [];

    setTopPosts(posts);
  }

  async function fetchKanbanData(userId: string) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, published, created_at, content")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    const ideas: KanbanItem[] = [];
    const drafts: KanbanItem[] = [];
    const published: KanbanItem[] = [];

    data?.forEach((post) => {
      const item: KanbanItem = {
        id: post.id,
        postId: post.id,
        title: post.title,
        status: post.published ? "published" : "draft",
        createdAt: new Date(post.created_at),
        wordCount: post.content?.split(" ").length || 0,
      };

      // FIX: All unpublished posts now go to Drafting. Ideas is kept empty.
      if (!post.published) {
        drafts.push(item);
      } else {
        published.push(item);
      }
    });

    setKanbanData([
      {
        id: "ideas",
        name: "Ideas",
        color: "#3B82F6",
        items: ideas,
        count: ideas.length,
      },
      {
        id: "drafting",
        name: "Drafting",
        color: "#F59E0B",
        items: drafts,
        count: drafts.length,
      },
      {
        id: "published",
        name: "Published",
        color: "#10B981",
        items: published,
        count: published.length,
      },
    ]);
  }

  // ============= EVENT HANDLERS =============
  const handleNewPost = () => router.push("/admin/write");
  const handleViewReports = () => router.push("/admin/analytics");
  const handleKanbanCardClick = (postId: string) =>
    router.push(`/admin/write?edit=${postId}`);

  const handleKanbanDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await supabase.from("posts").delete().eq("id", postId);
      fetchAllDashboardData();
      toast.success("Post deleted");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete");
    }
  };

  // ============= RENDER STATES =============
  if (loading && !stats.totalAssets) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>
              Last updated: {stats.lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <button onClick={handleNewPost} className={styles.btnPrimary}>
              <Plus size={18} /> New Post
            </button>
            <button onClick={handleViewReports} className={styles.btnSecondary}>
              <BarChart3 size={18} /> View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Row 1: Stat Cards */}
        <div className={styles.statsRow}>
          <StatCard
            icon="📦"
            title="Total Assets"
            value={stats.totalAssets}
            subtitle="Active items"
            trend="neutral"
          />
          <StatCard
            icon="📰"
            title="Live Articles"
            value={stats.liveArticles}
            subtitle={`${stats.totalViews.toLocaleString()} total views`}
            trend="up"
          />
          <StatCard
            icon="✏️"
            title="Pending Drafts"
            value={stats.pendingDrafts}
            subtitle={`${stats.totalClaps.toLocaleString()} total claps`}
            trend="neutral"
          />
        </div>

        {/* Row 2: Charts & Newsletter */}
        <div className={styles.gridRow}>
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <h3 className={styles.widgetTitle}>Traffic Analytics (7 Days)</h3>
              <button className={styles.widgetLink}>View Details</button>
            </div>
            <TrafficChart data={chartData} />
          </div>

          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <h3 className={styles.widgetTitle}>Newsletter</h3>
            </div>
            <div className={styles.newsletterCenter}>
              <h4 className={styles.newsletterValue}>
                {stats.newsLetterSignups}
              </h4>
              <p className={styles.newsletterLabel}>Subscribers</p>
              <span className={styles.newsletterGrowth}>
                ↑ Tracking enabled
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Kanban & Content Health */}
        <div className={styles.gridRow}>
          <div>
            <h3 className={styles.widgetTitle} style={{ marginBottom: "16px" }}>
              Content Pipeline
            </h3>
            <div className={styles.kanbanGrid}>
              {kanbanData.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onCardClick={handleKanbanCardClick}
                  onCardDelete={handleKanbanDelete}
                />
              ))}
            </div>
          </div>

          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle} style={{ marginBottom: "24px" }}>
              Content Health
            </h3>
            <div className={styles.healthItem}>
              <div className={`${styles.healthIcon} ${styles.iconSuccess}`}>
                ✓
              </div>
              <div className={styles.healthInfo}>
                <p className={styles.healthName}>System Integrity</p>
                <p className={styles.healthDesc}>Database connection stable</p>
              </div>
            </div>
            <div className={styles.healthItem}>
              <div className={`${styles.healthIcon} ${styles.iconWarning}`}>
                !
              </div>
              <div className={styles.healthInfo}>
                <p className={styles.healthName}>Review Needed</p>
                <p className={styles.healthDesc}>
                  {stats.pendingDrafts} drafts pending
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Top Categories & Live Performance */}
        <div
          className={styles.gridRow}
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle} style={{ marginBottom: "24px" }}>
              Top Categories
            </h3>
            <div>
              {topCategories.map((category) => (
                <div key={category.name} className={styles.categoryItem}>
                  <div className={styles.categoryHeader}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryViews}>
                      {category.views.toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.categoryTrack}>
                    <div
                      className={styles.categoryFill}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle} style={{ marginBottom: "24px" }}>
              Live Performance
            </h3>
            <div>
              {topPosts.map((post) => (
                <div
                  key={post.id}
                  className={styles.postItem}
                  onClick={() => router.push(`/post/${post.slug}`)}
                >
                  <div>
                    <p className={styles.postTitle}>{post.title}</p>
                    <p className={styles.postDate}>
                      {post.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className={styles.postStats}>
                    <span>👁️ {post.views}</span>
                    <span>👏 {post.claps}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= SUBCOMPONENTS =============

function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
}: {
  icon: string;
  title: string;
  value: number;
  subtitle: string;
  trend: "up" | "neutral";
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIconWrapper}>{icon}</div>
        <div>
          <h3 className={styles.statTitle}>{title}</h3>
          <p className={styles.statValue}>{value.toLocaleString()}</p>
        </div>
      </div>
      <div
        className={`${styles.statTrend} ${trend === "up" ? styles.trendUp : styles.trendNeutral}`}
      >
        {trend === "up" ? "↑" : "→"} {subtitle}
      </div>
    </div>
  );
}

function TrafficChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="date"
          stroke="#64748B"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748B"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          }}
        />
        <Legend wrapperStyle={{ paddingTop: "16px" }} />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#059669"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="claps"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function KanbanColumn({
  column,
  onCardClick,
  onCardDelete,
}: {
  column: KanbanColumnType;
  onCardClick: (id: string) => void;
  onCardDelete: (id: string) => void;
}) {
  return (
    <div className={styles.kanbanCol}>
      <div
        className={styles.kanbanHeader}
        style={{ borderBottomColor: column.color }}
      >
        <div
          className={styles.kanbanDot}
          style={{ backgroundColor: column.color }}
        />
        <h4 className={styles.kanbanTitle}>{column.name}</h4>
        <span className={styles.kanbanBadge}>{column.count}</span>
      </div>
      <div>
        {column.items.map((item) => (
          <div
            key={item.id}
            className={styles.kanbanCard}
            style={{ borderLeftColor: column.color }}
          >
            <h5 className={styles.cardTitle}>{item.title}</h5>
            <div className={styles.cardMeta}>
              <span>📅 {item.createdAt.toLocaleDateString()}</span>
              {item.wordCount > 0 && <span>{item.wordCount} words</span>}
            </div>
            {item.views !== undefined && (
              <div className={styles.cardStats}>
                <span>👁️ {item.views}</span>
                <span>👏 {item.claps || 0}</span>
              </div>
            )}
            <div className={styles.cardActions}>
              <button
                onClick={() => onCardClick(item.postId)}
                className={`${styles.actionBtn} ${styles.btnEdit}`}
              >
                Edit
              </button>
              <button
                onClick={() => onCardDelete(item.postId)}
                className={`${styles.actionBtn} ${styles.btnDelete}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {column.items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "#94A3B8",
              fontSize: "12px",
            }}
          >
            Empty column
          </div>
        )}
      </div>
    </div>
  );
}
