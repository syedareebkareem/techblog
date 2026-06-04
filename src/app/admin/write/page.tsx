// src/app/admin/write/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Editor from "../../../components/Editor";

interface Post {
  id: string;
  title: string;
  created_at: string;
  content: string;
  published: boolean;
  cover_image: string | null;
  category: string;
  excerpt: string | null;
}

function WritePageContent() {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdFromUrl = searchParams?.get("edit");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sidebar States
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [category, setCategory] = useState("Tech News");
  const [excerpt, setExcerpt] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "published" | "drafts">(
    "all",
  );

  const fetchMyPosts = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, title, created_at, content, published, cover_image, category, excerpt",
      )
      .eq("author_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }
    if (data) setMyPosts(data);
  };

  // Check user and fetch posts
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
      } else {
        setUserEmail(session.user.email || null);
        setUserId(session.user.id);
        fetchMyPosts(session.user.id);
      }
    };
    checkUser();
  }, [router]);

  const handleEditClick = (post: Post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content || "");
    setCoverImage(post.cover_image);
    setCategory(post.category || "Tech News");
    setExcerpt(post.excerpt || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // AUTO-POPULATE: If URL has ?edit=xxx, find that post and load it!
  useEffect(() => {
    if (editIdFromUrl && myPosts.length > 0 && editingId !== editIdFromUrl) {
      const postToEdit = myPosts.find((p) => p.id === editIdFromUrl);
      if (postToEdit) {
        // We moved the comment inside the block, right above the function call!
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleEditClick(postToEdit);

        // Remove the query param from URL so it doesn't get stuck
        router.replace("/admin/write", { scroll: false });
      }
    }
  }, [editIdFromUrl, myPosts, editingId, router]);

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCoverImage(null);
    setCategory("Tech News");
    setExcerpt("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      setCoverImage(data.publicUrl);
      toast.success("Cover image uploaded!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error uploading image",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && tags.length < 10) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSavePost = async (isPublished: boolean) => {
    if (!userId) return;
    setLoading(true);

    if (!content || content === "<p></p>") {
      toast.error("Please write some content before saving!");
      setLoading(false);
      return;
    }

    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      // 👉 STEP 3 IMPLEMENTATION: We added the `tags` array to the postData object!
      const postData = {
        title,
        slug,
        content,
        author_id: userId,
        published: isPublished,
        cover_image: coverImage,
        category,
        excerpt,
        tags: tags,
      };

      if (editingId) {
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", editingId);
        if (error) throw error;
        toast.success(
          isPublished ? "Post updated and published!" : "Draft updated!",
        );
      } else {
        const { error } = await supabase.from("posts").insert([postData]);
        if (error) throw error;
        toast.success(
          isPublished
            ? "Post published successfully!"
            : "Draft saved successfully!",
        );
      }

      setEditingId(null);
      setTitle("");
      setContent("");
      setCoverImage(null);
      setCategory("Tech News");
      setExcerpt("");
      setTags([]); // 👉 Reset tags after a successful save!
      fetchMyPosts(userId);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to save post.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this post?",
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      setMyPosts(myPosts.filter((post) => post.id !== postId));
      if (editingId === postId) handleCancelEdit();
      toast.success("Post deleted permanently.");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Error deleting post";
      toast.error(msg);
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

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between border-b border-[var(--border-main)] pb-6 mb-8 bg-[var(--bg-card)] p-6 rounded-xl shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Logged in as:{" "}
            <span className="text-emerald-600 font-medium">{userEmail}</span>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8 border border-[var(--border-main)] bg-[var(--bg-card)] rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingId ? "Edit Post" : "Create New Post"}
              </h2>
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-3xl font-bold border-0 border-b-2 border-[var(--border-main)] bg-transparent px-0 py-2 text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none focus:ring-0 placeholder:text-slate-300"
                  placeholder="Article Title..."
                />
              </div>

              <Editor content={content} onChange={setContent} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="border border-[var(--border-main)] bg-[var(--bg-card)] rounded-xl p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold mb-4 border-b border-slate-100 pb-2">
                Post Settings
              </h3>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Tech News">Tech News</option>
                    <option value="AI Policy">AI Policy</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Economy">Economy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Short Excerpt
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="A brief summary for the homepage cards..."
                    rows={3}
                    className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* TAGS INPUT UI */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Tags
                  </label>

                  {/* Tags display */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Add tags (press Enter or comma)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {tags.length}/10 tags • Press Enter or comma to add
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Cover Image
                  </label>
                  {coverImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-[var(--border-main)]">
                      {/* Tell ESLint standard img is fine for this dashboard preview */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt="Cover preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button
                          onClick={() => setCoverImage(null)}
                          className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[var(--border-strong)] border-dashed rounded-lg cursor-pointer bg-[var(--bg-primary)] hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-8 h-8 mb-2 text-slate-400"
                            aria-hidden="true"
                            fill="none"
                            viewBox="0 0 20 16"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                            />
                          </svg>
                          <p className="text-sm text-[var(--text-tertiary)] font-medium">
                            {uploadingImage
                              ? "Uploading..."
                              : "Click to upload cover"}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSavePost(true)}
                  disabled={loading || !title}
                  className="w-full rounded-md bg-emerald-600 px-8 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading
                    ? "Publishing..."
                    : editingId
                      ? "Update & Publish"
                      : "Publish Post"}
                </button>
                <button
                  onClick={() => handleSavePost(false)}
                  disabled={loading || !title}
                  className="w-full rounded-md bg-[var(--bg-card)] border border-[var(--border-strong)] px-4 py-3 font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : "Save as Draft"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[var(--border-main)] bg-[var(--bg-card)] rounded-xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold">Content Library</h2>

            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[var(--border-strong)] pl-4 pr-10 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

          <div className="flex border-b border-[var(--border-main)] mb-6 gap-6">
            {(["all", "published", "drafts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <p className="text-[var(--text-tertiary)] text-center py-12 bg-[var(--bg-primary)] rounded-lg border border-slate-100">
              No articles found matching your criteria.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredPosts.map((post) => (
                <li
                  key={post.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[var(--border-main)] rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all group bg-[var(--bg-card)]"
                >
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="hidden sm:flex h-12 w-16 bg-slate-100 border border-[var(--border-main)] rounded text-slate-300 items-center justify-center flex-shrink-0 overflow-hidden">
                      {post.cover_image ? (
                        /* Tell ESLint standard img is fine for this dashboard preview */
                        /* eslint-disable-next-line @next/next/no-img-element */
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
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-[var(--text-primary)] group-hover:text-emerald-700 transition-colors">
                            {post.title}
                          </h3>
                          {!post.published && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 rounded-full">
                              Draft
                            </span>
                          )}
                          {post.category && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-full border border-[var(--border-main)]">
                              {post.category}
                            </span>
                          )}
                        </div>

                        {post.excerpt && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Last updated:{" "}
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(post)}
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
      </div>
    </main>
  );
}

// Next.js 13+ requires useSearchParams to be wrapped in a Suspense boundary
export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[var(--text-tertiary)]">
          Loading editor...
        </div>
      }
    >
      <WritePageContent />
    </Suspense>
  );
}
