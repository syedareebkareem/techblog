"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminLayout.module.css";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      name: "My Articles",
      href: "/admin/articles",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      name: "Write Post",
      href: "/admin/write",
      icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    },
    {
      name: "Comments",
      href: "/admin/comments",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
    {
      name: "Newsletter",
      href: "/admin/newsletter",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>I</div>
          <span style={{ color: "var(--text-primary)" }}>
            Industrial<span style={{ color: "var(--brand-green)" }}>Blog</span>
          </span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            // FIX: Simplified the active state logic so nested routes highlight properly without breaking the exact "/admin" match
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <svg
                  className={styles.icon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={item.icon}
                  />
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className={styles.userInfo}>
          <div className={styles.avatar}>SA</div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span
              style={{
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              System Admin
            </span>
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                cursor: "pointer",
              }}
              onClick={handleSignOut}
            >
              Sign Out
            </span>
          </div>
        </div>
      </aside>
      {/* MAIN CONTENT */}
      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <div className={styles.topbar}>
            <ThemeToggle className={styles.themeBtn} />

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                System Admin ▾
              </span>
              <div
                className={styles.avatar}
                style={{ width: "32px", height: "32px" }}
              >
                SA
              </div>
            </div>
          </div>

          <div className={styles.pageContent}>{children}</div>
        </div>
      </main>
    </div>
  );
}
