// src/app/admin/articles/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Post {
  id: string;
  title: string;
  created_at: string;
  published: boolean;
  cover_image: string | null;
  category: string;
  excerpt: string | null;
}

export default function MyArticlesPage() {
  const router = useRouter();
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "published" | "drafts">(
    "all",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, title, created_at, published, cover_image, category, excerpt",
        )
        .eq("author_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load articles");
      } else if (data) {
        setMyPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [router]);

  const handleDelete = async (postId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this post?",
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      setMyPosts(myPosts.filter((post) => post.id !== postId));
      toast.success("Post deleted permanently.");
    } catch (error) {
      toast.error("Error deleting post");
    }
  };

  const filteredPosts = myPosts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (activeTab === "published") return matchesSearch && post.published;
    if (activeTab === "drafts") return matchesSearch && !post.published;
    return matchesSearch;
  });

  if (loading) return <div className="text-slate-500">Loading library...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Content Library</h2>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-300 pl-4 pr-10 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <svg
            className="absolute right-3 top-2.5 h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6 gap-6">
        {(["all", "published", "drafts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <p className="text-slate-500 text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
          No articles found matching your criteria.
        </p>
      ) : (
        <ul className="space-y-3">
          {filteredPosts.map((post) => (
            <li
              key={post.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all group bg-white"
            >
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="hidden sm:flex h-12 w-16 bg-slate-100 border border-slate-200 rounded text-slate-300 items-center justify-center flex-shrink-0 overflow-hidden">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {post.title}
                    </h3>
                    {!post.published && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 rounded-full">
                        Draft
                      </span>
                    )}
                    {post.category && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-full border border-slate-200">
                        {post.category}
                      </span>
                    )}
                  </div>
                  {post.excerpt && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Last updated:{" "}
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => router.push(`/admin/write?edit=${post.id}`)}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
