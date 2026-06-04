// src/components/TagPills.tsx
"use client";

import Link from "next/link";
import { Hash } from "lucide-react";

interface TagPillsProps {
  tags: string[];
  size?: "sm" | "md";
  clickable?: boolean;
}

export default function TagPills({
  tags,
  size = "md",
  clickable = true,
}: TagPillsProps) {
  if (!tags || tags.length === 0) return null;

  const padding = size === "sm" ? "3px 10px" : "5px 14px";
  const fontSize = size === "sm" ? "11px" : "13px";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {tags.map((tag) => {
        const slug = tag.toLowerCase().replace(/\s+/g, "-");
        const inner = (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding,
              fontSize,
              fontWeight: 500,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-main)",
              borderRadius: "999px",
              color: "var(--text-secondary)",
              cursor: clickable ? "pointer" : "default",
              transition: "all 0.15s",
              textDecoration: "none",
            }}
          >
            <Hash size={10} />
            {tag}
          </span>
        );

        return clickable ? (
          <Link
            key={tag}
            href={`/tag/${slug}`}
            style={{ textDecoration: "none" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget.querySelector("span") as HTMLElement;
              if (el) {
                el.style.borderColor = "var(--brand-green)";
                el.style.color = "var(--brand-green)";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget.querySelector("span") as HTMLElement;
              if (el) {
                el.style.borderColor = "var(--border-main)";
                el.style.color = "var(--text-secondary)";
              }
            }}
          >
            {inner}
          </Link>
        ) : (
          <span key={tag}>{inner}</span>
        );
      })}
    </div>
  );
}
