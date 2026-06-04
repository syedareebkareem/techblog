"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Components.module.css";

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);

    try {
      // 1. Let the database auto-generate the ID. Just send the email and status.
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email, status: "active" }]);

      if (error) {
        // 2. Safely log the error as a string so we can actually read it if it fails again
        console.error(
          "SUPABASE NEWSLETTER ERROR DETAILS:",
          JSON.stringify(error, null, 2),
        );

        // 3. Safely check the error message without crashing
        const errMsg = error.message || "";
        if (
          !errMsg.toLowerCase().includes("duplicate") &&
          !errMsg.toLowerCase().includes("unique")
        ) {
          throw new Error(errMsg || "Database rejected the subscription");
        }
      }

      toast.success("Subscribed successfully!");
      setEmail("");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.newsletterCard}>
      <div className={styles.newsHeader}>
        <div className={styles.newsIcon}>
          <Mail size={20} />
        </div>
        <div>
          <h3 className={styles.newsTitle}>Stay Updated</h3>
          <p className={styles.newsSub}>Get new articles in your inbox</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className={styles.newsInput}
        />
        <button type="submit" disabled={loading} className={styles.btnPrimary}>
          {loading ? "Working..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
