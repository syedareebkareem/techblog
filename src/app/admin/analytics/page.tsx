// src/app/admin/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
import {
  Download,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Users,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import styles from "./Analytics.module.css";

// ============= TYPES =============
interface AnalyticsMetric {
  label: string;
  value: number;
  trend: number;
  trendDirection: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

interface TopPost {
  id: string;
  title: string;
  views: number;
  claps: number;
  engagement_rate: number;
}

interface TopCategory {
  name: string;
  views: number;
  posts: number;
  avg_engagement: string;
}

interface ChartData {
  date: string;
  views: number;
  claps: number;
  readers: number;
}

// ============= MAIN COMPONENT =============
export default function AnalyticsPage() {
  const router = useRouter();

  // ============= STATE =============
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState<"7" | "30" | "90" | "custom">("7");

  // Lazy initialization: avoids "setState in effect" and calculates instantly
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Data State
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);

  // ============= EFFECTS =============
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ALL FETCHING MOVED INSIDE EFFECT TO SATISFY COMPILER IMMUTABILITY RULES
  useEffect(() => {
    if (!isMounted || !startDate || !endDate) return;

    let isCancelled = false; // Prevents state updates if component unmounts

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();
        if (authError || !session) {
          router.push("/auth");
          return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Include end date

        // ONE SINGLE OPTIMIZED QUERY FOR ALL METRICS
        const { data: postsData } = await supabase
          .from("posts")
          .select("id, title, category, view_count, total_claps, created_at")
          .eq("author_id", session.user.id)
          .eq("published", true)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: true });

        if (isCancelled) return;
        const safePosts = postsData || [];

        // 1. Process Top Level Metrics
        const totalViews = safePosts.reduce(
          (sum, p) => sum + (p.view_count || 0),
          0,
        );
        const totalClaps = safePosts.reduce(
          (sum, p) => sum + (p.total_claps || 0),
          0,
        );
        const uniqueReaders = Math.round(totalViews * 0.85);

        let commentsCount = 0;
        try {
          const { count } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString());
          if (count) commentsCount = count;
        } catch {
          // Ignore if table doesn't exist yet
        }

        setMetrics([
          {
            label: "Total Views",
            value: totalViews,
            trend: 12,
            trendDirection: "up",
            icon: <Eye color="#059669" size={24} />,
          },
          {
            label: "Total Claps",
            value: totalClaps,
            trend: 8,
            trendDirection: "up",
            icon: <Heart color="#DC2626" size={24} />,
          },
          {
            label: "Comments",
            value: commentsCount,
            trend: 15,
            trendDirection: "up",
            icon: <MessageCircle color="#3B82F6" size={24} />,
          },
          {
            label: "Unique Readers",
            value: uniqueReaders,
            trend: 5,
            trendDirection: "up",
            icon: <Users color="#8B5CF6" size={24} />,
          },
        ]);

        // 2. Process Chart Data
        const groupedData: { [key: string]: ChartData } = {};
        const chartStart = new Date(startDate);
        const chartEnd = new Date(endDate);

        for (
          let d = new Date(chartStart);
          d <= chartEnd;
          d.setDate(d.getDate() + 1)
        ) {
          const dateStr = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          groupedData[dateStr] = {
            date: dateStr,
            views: 0,
            claps: 0,
            readers: 0,
          };
        }

        safePosts.forEach((post) => {
          const date = new Date(post.created_at);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          if (groupedData[dateStr]) {
            groupedData[dateStr].views += post.view_count || 0;
            groupedData[dateStr].claps += post.total_claps || 0;
            groupedData[dateStr].readers += Math.round(
              (post.view_count || 0) * 0.85,
            );
          }
        });

        setChartData(Object.values(groupedData));

        // 3. Process Top Posts
        const sortedPosts = [...safePosts]
          .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 5);
        setTopPosts(
          sortedPosts.map((p) => ({
            id: p.id,
            title: p.title,
            views: p.view_count || 0,
            claps: p.total_claps || 0,
            engagement_rate:
              (p.view_count || 0) > 0
                ? ((p.total_claps || 0) / (p.view_count || 1)) * 100
                : 0,
          })),
        );

        // 4. Process Top Categories
        const categoryMap: {
          [key: string]: { views: number; claps: number; posts: number };
        } = {};
        safePosts.forEach((post) => {
          const cat = post.category || "Uncategorized";
          if (!categoryMap[cat])
            categoryMap[cat] = { views: 0, claps: 0, posts: 0 };
          categoryMap[cat].views += post.view_count || 0;
          categoryMap[cat].claps += post.total_claps || 0;
          categoryMap[cat].posts += 1;
        });

        const categories = Object.entries(categoryMap)
          .map(([name, stats]) => ({
            name,
            views: stats.views,
            posts: stats.posts,
            avg_engagement:
              stats.posts > 0 ? (stats.claps / stats.posts).toFixed(2) : "0",
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);

        setTopCategories(categories);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchAnalyticsData();

    return () => {
      isCancelled = true;
    };
  }, [dateRange, startDate, endDate, isMounted, router]);

  // ============= HANDLERS =============

  // Replaced impure Date.now() with compiler-safe new Date() math
  const handleDateRangeChange = (range: "7" | "30" | "90" | "custom") => {
    setDateRange(range);
    if (range !== "custom") {
      const days = parseInt(range, 10);
      const startD = new Date();
      startD.setDate(startD.getDate() - days);
      setStartDate(startD.toISOString().split("T")[0]);

      const endD = new Date();
      setEndDate(endD.toISOString().split("T")[0]);
    }
  };

  const exportAnalytics = () => {
    try {
      setExporting(true);
      let csvContent = "Analytics Report\n";
      csvContent += `Date Range: ${startDate} to ${endDate}\n\n`;

      csvContent += "KEY METRICS\nMetric,Value,Trend\n";
      metrics.forEach((m) => {
        csvContent += `"${m.label}",${m.value},${m.trend}%\n`;
      });

      csvContent += "\n\nTOP POSTS\nTitle,Views,Claps,Engagement Rate\n";
      topPosts.forEach((p) => {
        csvContent += `"${p.title}",${p.views},${p.claps},${p.engagement_rate.toFixed(2)}%\n`;
      });

      csvContent += "\n\nTOP CATEGORIES\nCategory,Views,Posts,Avg Engagement\n";
      topCategories.forEach((c) => {
        csvContent += `"${c.name}",${c.views},${c.posts},${c.avg_engagement}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  // ============= RENDER =============
  if (!isMounted || loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading analytics engine...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header & Controls */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Analytics</h1>
            <div className={styles.headerActions}>
              <ThemeToggle />
              <button
                onClick={exportAnalytics}
                disabled={exporting}
                className={styles.btnExport}
              >
                <Download size={18} />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>

          <div className={styles.filterRow}>
            {["7", "30", "90"].map((days) => (
              <button
                key={days}
                onClick={() => handleDateRangeChange(days as "7" | "30" | "90")}
                className={`${styles.filterBtn} ${dateRange === days ? styles.filterActive : styles.filterInactive}`}
              >
                Last {days} Days
              </button>
            ))}
            <button
              onClick={() => handleDateRangeChange("custom")}
              className={`${styles.filterBtn} ${dateRange === "custom" ? styles.filterActive : styles.filterInactive}`}
            >
              <Calendar size={16} /> Custom
            </button>
          </div>

          {dateRange === "custom" && (
            <div className={styles.customDateRow}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Metric Cards */}
        <div className={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.metricHeader}>
                <div className={styles.iconBox}>{metric.icon}</div>
                <div
                  className={`${styles.trendBadge} ${metric.trendDirection === "up" ? styles.trendUp : metric.trendDirection === "down" ? styles.trendDown : styles.trendNeutral}`}
                >
                  {metric.trendDirection === "up" && <ArrowUp size={16} />}
                  {metric.trendDirection === "down" && <ArrowDown size={16} />}
                  {Math.abs(metric.trend)}%
                </div>
              </div>
              <p className={styles.metricLabel}>{metric.label}</p>
              <p className={styles.metricValue}>
                {metric.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Traffic Chart */}
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Views & Engagement Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
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
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
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
              <Line
                type="monotone"
                dataKey="readers"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers Grid */}
        <div className={styles.listsGrid}>
          {/* Top Posts */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Top Performing Posts</h2>
            <div>
              {topPosts.length === 0 ? (
                <p style={{ color: "#64748B" }}>No data available.</p>
              ) : (
                topPosts.map((post, index) => (
                  <div key={post.id} className={styles.listItem}>
                    <div className={styles.rankBadge}>{index + 1}</div>
                    <div className={styles.itemMain}>
                      <h3 className={styles.itemTitle}>{post.title}</h3>
                      <div className={styles.itemStats}>
                        <span>{post.views} views</span>
                        <span>{post.claps} claps</span>
                      </div>
                    </div>
                    <div className={styles.itemRight}>
                      <p className={styles.engagementRate}>
                        {post.engagement_rate.toFixed(1)}%
                      </p>
                      <p className={styles.engagementLabel}>engagement</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Categories */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Top Categories</h2>
            <div>
              {topCategories.length === 0 ? (
                <p style={{ color: "#64748B" }}>No data available.</p>
              ) : (
                topCategories.map((cat) => (
                  <div
                    key={cat.name}
                    className={styles.listItem}
                    style={{ flexDirection: "column", alignItems: "stretch" }}
                  >
                    <div className={styles.catHeader}>
                      <h3 className={styles.catTitle}>{cat.name}</h3>
                      <span className={styles.catBadge}>{cat.posts} posts</span>
                    </div>
                    <div className={styles.itemStats} style={{ marginTop: 0 }}>
                      <span>{cat.views} views</span>
                      <span>Avg: {cat.avg_engagement} claps/post</span>
                    </div>
                    <div className={styles.progressBg}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${Math.min((parseFloat(cat.avg_engagement) / 10) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
