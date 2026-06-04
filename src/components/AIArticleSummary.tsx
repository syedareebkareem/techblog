"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, Sparkles } from "lucide-react";

interface AIArticleSummaryProps {
  postId: string;
  content: string;
  title: string;
  cached: string | null;
}

export default function AIArticleSummary({
  postId,
  content,
  title,
  cached,
}: AIArticleSummaryProps) {
  const [summary, setSummary] = useState(cached || "");
  const [loading, setLoading] = useState(!cached && !!content);
  const [open, setOpen] = useState(true); // Default to open for better UX

  useEffect(() => {
    if (cached || !content) return;

    async function generate() {
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, title }),
        });
        const data = await res.json();

        if (data.summary) {
          setSummary(data.summary);
          await supabase
            .from("posts")
            .update({ ai_summary: data.summary })
            .eq("id", postId);
        }
      } catch (err) {
        console.error("Summary generation failed", err);
      } finally {
        setLoading(false);
      }
    }

    generate();
  }, [content, title, postId, cached]);

  if (!summary && !loading) return null;

  return (
    <div
      style={{
        background: "rgba(16, 185, 129, 0.04)", // Very subtle green background
        borderLeft: "4px solid var(--brand-green, #10B981)", // Modern side-accent border
        borderRadius: "0 12px 12px 0",
        marginBottom: "40px",
        transition: "all 0.2s ease",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--brand-green, #10B981)",
            letterSpacing: "0.3px",
          }}
        >
          <Sparkles size={16} /> Key Takeaways (Auto-Extracted)
          {loading && (
            <span
              style={{ fontSize: "12px", fontStyle: "italic", fontWeight: 400 }}
            >
              (generating...)
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          style={{
            color: "var(--brand-green, #10B981)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.3s ease",
          }}
        />
      </button>

      <div
        style={{
          maxHeight: open ? "500px" : "0",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <div
          style={{
            padding: "0 20px 20px 20px",
            fontSize: "15px",
            lineHeight: "1.7",
            color: "var(--text-secondary)",
            fontStyle: "italic",
          }}
        >
          {summary}
        </div>
      </div>
    </div>
  );
}
