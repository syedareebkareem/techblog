// src/components/RelatedPosts.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, ThumbsUp } from "lucide-react";
import styles from "./Components.module.css";

interface Post {
  id: string;
  slug: string;
  title: string;
  cover_image?: string;
  category: string;
  view_count: number;
  total_claps: number;
}

export default function RelatedPosts({
  category,
  excludeId,
  limit = 3,
}: {
  category: string;
  excludeId: string;
  limit?: number;
}) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function fetchRelated() {
      const { data } = await supabase
        .from("posts")
        .select(
          "id, slug, title, cover_image, category, view_count, total_claps",
        )
        .eq("category", category)
        .eq("published", true)
        .neq("id", excludeId)
        .order("view_count", { ascending: false })
        .limit(limit);
      if (data) setPosts(data);
    }
    fetchRelated();
  }, [category, excludeId, limit]);

  if (posts.length === 0) return null;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Related Posts</h3>
      <div>
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            className={styles.relatedItem}
          >
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className={styles.relatedImg}
              />
            )}
            <div className={styles.relatedContent}>
              <p className={styles.relatedCat}>{post.category}</p>
              <h4 className={styles.relatedTitle}>{post.title}</h4>
              <div className={styles.relatedStats}>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Eye size={12} /> {post.view_count || 0}
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <ThumbsUp size={12} /> {post.total_claps || 0}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
