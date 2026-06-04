"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye } from "lucide-react";

interface CategoryStat {
  name: string;
  slug: string;
  postCount: number;
  totalViews: number;
  icon: string;
  color: string;
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  "ai-updates": { icon: "🤖", color: "#8B5CF6" },
  software: { icon: "💻", color: "#3B82F6" },
  hardware: { icon: "🔧", color: "#F59E0B" },
  "web-dev": { icon: "🌐", color: "#059669" },
  cybersecurity: { icon: "🔒", color: "#DC2626" },
  "tech-deals": { icon: "💸", color: "#F59E0B" },
  economy: { icon: "📈", color: "#06B6D4" },
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await supabase
          .from("posts")
          .select("category, view_count")
          .eq("published", true);

        const statsMap: Record<
          string,
          { postCount: number; totalViews: number }
        > = {};

        data?.forEach((post) => {
          const cat = post.category || "Uncategorized";
          if (!statsMap[cat]) statsMap[cat] = { postCount: 0, totalViews: 0 };
          statsMap[cat].postCount += 1;
          statsMap[cat].totalViews += post.view_count || 0;
        });

        const result: CategoryStat[] = Object.entries(statsMap).map(
          ([name, stats]) => {
            const slug = name.toLowerCase().replace(/\s+/g, "-");
            const meta = CATEGORY_META[slug] || {
              icon: "📰",
              color: "#059669",
            };
            return { name, slug, ...stats, ...meta };
          },
        );

        result.sort((a, b) => b.totalViews - a.totalViews);
        setCategories(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          All Categories
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "40px" }}>
          Browse all topics on IndustrialBlog
        </p>

        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>
            Loading categories...
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/category/${cat.slug}`}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid var(--border-main)`,
                  borderLeft: `4px solid ${cat.color}`,
                  borderRadius: "12px",
                  padding: "24px",
                  textDecoration: "none",
                  display: "block",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "var(--shadow-md)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  {cat.icon}
                </span>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: "0 0 8px",
                  }}
                >
                  {cat.name}
                </h2>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "13px",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <span>{cat.postCount} articles</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Eye size={12} /> {cat.totalViews.toLocaleString()} views
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
