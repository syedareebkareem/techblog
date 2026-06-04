/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js"; // Imported Supabase's native User type
import Link from "next/link";
import toast from "react-hot-toast";

// Defined exactly what a comment object looks like from our database join
interface CommentData {
  id: string;
  content: string;
  created_at: string;
  user_profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export default function Comments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIX: Moved fetchComments ABOVE the useEffect so it exists before being called
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `id, content, created_at, user_profiles ( full_name, avatar_url )`,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (data) {
      // @ts-expect-error - Safely mapping relational data from Supabase join
      setComments(data as CommentData[]);
    }
    if (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();

    fetchComments();

    // We only want this to run when the postId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("comments")
      .insert([
        { post_id: postId, author_id: user.id, content: newComment.trim() },
      ]);

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Comment posted successfully!");
      setNewComment("");
      fetchComments();
    }
  };

  return (
    <div className="mt-16 pt-10 border-t border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">
        Discussion ({comments.length})
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-10">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this architecture..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-3 resize-none"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-6 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-100 rounded-lg p-6 mb-10 text-center border border-slate-200">
          <p className="text-slate-600 mb-4">
            You must be signed in to join the discussion.
          </p>
          <Link
            href="/auth"
            className="inline-block rounded-md bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Sign In to Comment
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-slate-500 italic">
            No comments yet. Be the first to start the discussion!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm overflow-hidden border border-slate-200">
                  {comment.user_profiles?.avatar_url ? (
                    <img
                      src={comment.user_profiles.avatar_url}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : comment.user_profiles?.full_name ? (
                    comment.user_profiles.full_name.charAt(0).toUpperCase()
                  ) : (
                    "U"
                  )}
                </div>

                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {comment.user_profiles?.full_name || "Anonymous User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(comment.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
