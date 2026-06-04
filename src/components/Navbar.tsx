// src/components/Navbar.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useTheme } from "@/context/ThemeContext";
import {
  Sun,
  Moon,
  Search,
  Menu,
  X,
  ChevronDown,
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  Bookmark, // 👉 NEW
  History, // 👉 NEW
} from "lucide-react";
import styles from "./Navbar.module.css";

// ============= TYPES =============
interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

// ============= MAIN COMPONENT =============
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // Auth State
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // UI State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refs for click-outside-to-close
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ============= RENDER-PHASE STATE UPDATES =============
  // Fixes the "set-state-in-effect" error. This safely closes menus when the URL changes.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setProfileDropdownOpen(false);
  }

  // ============= EFFECTS =============

  // 1. Isolated Mount Effect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 2. Define fetch function BEFORE it is used to fix "immutability" error
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .single();

    if (data) setProfile(data);
  };

  // 3. Auth Session Effect
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 4. Click Outside Effect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 5. Focus Search Effect
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // ============= HANDLERS =============
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfileDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // CRITICAL: Hide public Navbar inside Admin section
  if (pathname?.startsWith("/admin")) return null;

  // ============= NAV LINKS DATA =============
  const categoryLinks = [
    { label: "AI Updates", href: "/category/ai-updates" },
    { label: "Software", href: "/category/software" },
    { label: "Hardware", href: "/category/hardware" },
    { label: "Web Dev", href: "/category/web-dev" },
    { label: "Cybersecurity", href: "/category/cybersecurity" },
    { label: "Tech Deals", href: "/category/tech-deals" },
  ];

  const secondaryLinks = [
    { label: "Latest", href: "/" },
    { label: "Popular", href: "/?sort=popular" },
    { label: "Editor's Pick", href: "/?sort=picks" },
    { label: "Archives", href: "/archives" },
  ];

  // Get user initials for avatar placeholder
  const userInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  // ============= RENDER =============
  return (
    <header className={styles.header}>
      {/* ===== TOP BAR ===== */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          {/* LOGO */}
          <Link href="/" className={styles.logo}>
            Industrial<span className={styles.logoAccent}>Blog</span>
          </Link>

          {/* DESKTOP CATEGORY LINKS */}
          <nav className={styles.mainNav} aria-label="Main Navigation">
            {categoryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT SECTION */}
        <div className={styles.rightSection}>
          {/* SEARCH — toggles inline input */}
          <div className={styles.searchWrapper}>
            {searchOpen ? (
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className={styles.searchClose}
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button
                className={styles.iconBtn}
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search size={20} />
              </button>
            )}
          </div>

          {/* DARK MODE TOGGLE */}
          {mounted && (
            <button
              className={styles.iconBtn}
              onClick={toggleTheme}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? (
                <Sun size={20} style={{ color: "var(--brand-green)" }} />
              ) : (
                <Moon size={20} />
              )}
            </button>
          )}

          {/* AUTH SECTION */}
          {mounted && (
            <>
              {user ? (
                /* SIGNED IN — Profile Dropdown */
                <div className={styles.profileWrapper} ref={dropdownRef}>
                  <button
                    className={styles.avatarBtn}
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    aria-label="Open profile menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name || "User"}
                        width={30}
                        height={30}
                        className={styles.avatarImg}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.avatarInitials}>
                        {userInitials}
                      </div>
                    )}
                    <ChevronDown
                      size={16}
                      className={profileDropdownOpen ? styles.chevronOpen : ""}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </button>

                  {/* DROPDOWN MENU */}
                  {profileDropdownOpen && (
                    <div className={styles.dropdown}>
                      {/* User Info Header */}
                      <div className={styles.dropdownHeader}>
                        <p className={styles.dropdownName}>
                          {profile?.full_name || "User"}
                        </p>
                        <p className={styles.dropdownEmail}>{user.email}</p>
                      </div>

                      <div className={styles.dropdownDivider} />

                      {/* Navigation Items */}
                      <Link
                        href="/profile"
                        className={styles.dropdownItem}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User size={16} />
                        My Profile
                      </Link>

                      {/* 👉 NEW: Bookmarks and History Links */}
                      <Link
                        href="/bookmarks"
                        className={styles.dropdownItem}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Bookmark size={16} />
                        Saved Articles
                      </Link>

                      <Link
                        href="/history"
                        className={styles.dropdownItem}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <History size={16} />
                        Reading History
                      </Link>
                      {/* 👉 END NEW LINKS */}

                      <Link
                        href="/admin"
                        className={styles.dropdownItem}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <LayoutDashboard size={16} />
                        Admin Dashboard
                      </Link>

                      <Link
                        href="/settings"
                        className={styles.dropdownItem}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>

                      <div className={styles.dropdownDivider} />

                      <button
                        onClick={handleSignOut}
                        className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* SIGNED OUT — Login Button */
                <Link href="/auth" className={styles.loginBtn}>
                  Sign In
                </Link>
              )}
            </>
          )}

          {/* MOBILE HAMBURGER */}
          <button
            className={`${styles.iconBtn} ${styles.mobileOnly}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ===== SECONDARY BAR ===== */}
      <div className={styles.secondaryBar}>
        <div className={styles.secondaryInner}>
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.secLink} ${pathname === link.href ? styles.secLinkActive : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ===== MOBILE MENU DRAWER ===== */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          {/* Mobile Category Links */}
          <div className={styles.mobileLinkGroup}>
            <p className={styles.mobileLinkGroupTitle}>Categories</p>
            {categoryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.mobileLink}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.mobileDivider} />

          {/* Mobile Quick Nav */}
          <div className={styles.mobileLinkGroup}>
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.mobileLink}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.mobileDivider} />

          {/* Mobile Auth Actions */}
          {/* Mobile Auth Actions */}
          {user ? (
            <div className={styles.mobileLinkGroup}>
              <Link href="/profile" className={styles.mobileLink}>
                <User size={16} /> My Profile
              </Link>

              {/* 👉 NEW: Mobile Bookmarks and History */}
              <Link href="/bookmarks" className={styles.mobileLink}>
                <Bookmark size={16} /> Saved Articles
              </Link>
              <Link href="/history" className={styles.mobileLink}>
                <History size={16} /> Reading History
              </Link>

              <Link href="/admin" className={styles.mobileLink}>
                <LayoutDashboard size={16} /> Admin Dashboard
              </Link>
              <Link href="/settings" className={styles.mobileLink}>
                <Settings size={16} /> Settings
              </Link>
              <button
                onClick={handleSignOut}
                className={`${styles.mobileLink} ${styles.mobileLinkDanger}`}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <Link href="/auth" className={styles.mobileLinkPrimary}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
