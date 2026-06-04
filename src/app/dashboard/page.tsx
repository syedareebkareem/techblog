// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./Dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "bookmarks" | "settings"
  >("overview");

  useEffect(() => {
    // 1. Check for active session
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // SECURITY GUARD: Kick unauthenticated users back to login
        router.push("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh(); // Tell Next.js the session is gone
  };

  if (loading) {
    return <div className={styles.loadingWrapper}>Loading securely...</div>;
  }

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* LEFT COLUMN: Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <div className={styles.userProfile}>
            {/* Generate a mock avatar using the first letter of their email */}
            <div className={styles.avatar}>{user?.email?.charAt(0) || "U"}</div>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user?.email}</span>
              <span className={styles.userRole}>Free Member</span>
            </div>
          </div>

          <nav className={styles.navMenu}>
            <button
              onClick={() => setActiveTab("overview")}
              className={`${styles.navItem} ${activeTab === "overview" ? styles.navItemActive : ""}`}
            >
              Account Overview
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`${styles.navItem} ${activeTab === "bookmarks" ? styles.navItemActive : ""}`}
            >
              Saved Articles
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`${styles.navItem} ${activeTab === "settings" ? styles.navItemActive : ""}`}
            >
              Settings
            </button>
          </nav>
        </aside>

        {/* RIGHT COLUMN: Dynamic Content Panel */}
        <section className={styles.contentPanel}>
          {/* TAB 1: Overview */}
          {activeTab === "overview" && (
            <div>
              <header className={styles.panelHeader}>
                <h1 className={styles.panelTitle}>Welcome to your Dashboard</h1>
                <p className={styles.panelDesc}>
                  Manage your profile, subscriptions, and reading history.
                </p>
              </header>
              <div className={styles.emptyState}>
                <h3 className={styles.emptyStateTitle}>No recent activity</h3>
                <p className={styles.emptyStateDesc}>
                  When you start reading and clapping for articles, your stats
                  will appear here.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Bookmarks (We will wire this to the DB later!) */}
          {activeTab === "bookmarks" && (
            <div>
              <header className={styles.panelHeader}>
                <h1 className={styles.panelTitle}>Saved Articles</h1>
                <p className={styles.panelDesc}>
                  Your personal reading list for later.
                </p>
              </header>
              <div className={styles.emptyState}>
                <h3 className={styles.emptyStateTitle}>
                  Your reading list is empty
                </h3>
                <p className={styles.emptyStateDesc}>
                  Click the bookmark icon on any article to save it here.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Settings & Security */}
          {activeTab === "settings" && (
            <div>
              <header className={styles.panelHeader}>
                <h1 className={styles.panelTitle}>Account Settings</h1>
                <p className={styles.panelDesc}>
                  Manage your security preferences.
                </p>
              </header>

              <div className={styles.dangerZone}>
                <h3 className={styles.dangerTitle}>Security</h3>
                <p className={styles.dangerDesc}>
                  Sign out of your account on this device.
                </p>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Securely Sign Out
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
