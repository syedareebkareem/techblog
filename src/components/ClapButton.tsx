"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ClapButton({
  postId,
  initialClaps,
}: {
  postId: string;
  initialClaps: number;
}) {
  const [claps, setClaps] = useState(initialClaps);
  const [isAnimating, setIsAnimating] = useState(false);
  const [localUserClaps, setLocalUserClaps] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<
    Array<{ id: string; text: string }>
  >([]);

  const handleClap = async () => {
    if (localUserClaps >= 50) {
      toast.error("You've reached the clap limit (50)");
      return;
    }

    const newCount = localUserClaps + 1;
    setClaps((prev) => prev + 1);
    setLocalUserClaps(newCount);

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);

    // Trigger Floating Animation
    const id = Math.random().toString();
    setFloatingTexts((prev) => [...prev, { id, text: "+1" }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 1000);

    // Notify at max
    if (newCount === 50) {
      toast.success("You've reached the clap limit (50)!");
    }

    const { error } = await supabase.rpc("clap_for_post", { post_id: postId });

    if (error) {
      // Revert optimism if it failed
      setClaps((prev) => prev - 1);
      setLocalUserClaps((prev) => prev - 1);
      toast.error(error.message || "Please sign in to clap!");
    }
  };

  const isDisabled = localUserClaps >= 50;

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClap}
        disabled={isDisabled}
        className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all duration-200 shadow-sm ${
          localUserClaps > 0
            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-500"
        } ${!isDisabled ? "hover:bg-slate-50 hover:border-slate-300" : "opacity-75 cursor-not-allowed"} ${
          isAnimating ? "scale-110" : "scale-100"
        }`}
        title={isDisabled ? "You've reached the clap limit" : "Click to clap"}
      >
        <svg
          className="w-5 h-5"
          fill={localUserClaps > 0 ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514"
          />
        </svg>
        <span className="font-semibold tabular-nums">{claps}</span>
      </button>

      {/* Floating +1 Elements */}
      {floatingTexts.map((float) => (
        <div
          key={float.id}
          className="absolute left-1/2 -top-2 text-emerald-600 font-bold text-sm pointer-events-none"
          style={{
            transform: "translateX(-50%)",
            animation: "floatUp 1s ease-out forwards",
          }}
        >
          {float.text}
        </div>
      ))}

      {/* Embedded CSS for the floating animation */}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -30px);
          }
        }
      `}</style>
    </div>
  );
}
