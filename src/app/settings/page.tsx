// src/app/settings/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import toast from "react-hot-toast";
import {
  User,
  Shield,
  Palette,
  Bell,
  Sun,
  Moon,
  Camera,
  Save,
  Mail,
} from "lucide-react";
import styles from "./Settings.module.css";

// ============= NATIVE BRAND ICONS =============
const TwitterIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

const GithubIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const LinkedinIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

// ============= TYPES =============
type TabId = "profile" | "account" | "appearance" | "notifications";

interface ProfileData {
  full_name: string;
  bio: string;
  avatar_url: string | null;
  twitter: string;
  github: string;
  linkedin: string;
  website: string;
}

// ============= TABS CONFIG =============
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User size={16} /> },
  { id: "account", label: "Account", icon: <Shield size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
];

// ============= MAIN COMPONENT =============
export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    bio: "",
    avatar_url: null,
    twitter: "",
    github: "",
    linkedin: "",
    website: "",
  });

  const [notifications, setNotifications] = useState({
    newsletter: true,
    newComments: true,
    weeklyDigest: false,
  });

  // ============= LOAD DATA =============
  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      const { data } = await supabase
        .from("user_profiles")
        .select(
          "full_name, bio, avatar_url, twitter, github, linkedin, website",
        )
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || null,
          twitter: data.twitter || "",
          github: data.github || "",
          linkedin: data.linkedin || "",
          website: data.website || "",
        });
      }

      setLoading(false);
    };
    load();
  }, [router]);

  // ============= HANDLERS =============

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    const { error } = await supabase
      .from("user_profiles")
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        twitter: profile.twitter,
        github: profile.github,
        linkedin: profile.linkedin,
        website: profile.website,
      })
      .eq("id", userId);

    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved!");
  };

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !userId) return;
    setUploading(true);

    try {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop();
      const path = `${userId}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar updated!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // ============= RENDER =============
  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Loading settings...</p>
      </div>
    );
  }

  const userInitials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.[0]?.toUpperCase() || "U";

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* PAGE HEADER */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>
            Manage your account and preferences
          </p>
        </div>

        {/* MAIN LAYOUT */}
        <div className={styles.layout}>
          {/* SIDEBAR TABS */}
          <nav className={styles.tabNav}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}

            <div className={styles.navDivider} />

            <a
              href={`/profile`}
              className={styles.tabBtn}
              style={{ textDecoration: "none" }}
            >
              <User size={16} />
              <span>View Profile</span>
            </a>
          </nav>

          {/* TAB CONTENT */}
          <div className={styles.tabContent}>
            {/* ===== PROFILE TAB ===== */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className={styles.card}>
                <h2 className={styles.cardTitle}>Public Profile</h2>
                <p className={styles.cardDesc}>
                  This information appears on your public profile and author
                  cards.
                </p>

                {/* AVATAR */}
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrapper}>
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className={styles.avatarImg}
                      />
                    ) : (
                      <div className={styles.avatarInitials}>
                        {userInitials}
                      </div>
                    )}
                    <label
                      className={styles.avatarOverlay}
                      title="Change avatar"
                    >
                      <Camera size={18} />
                      <input
                        type="file"
                        accept="image/*"
                        className={styles.hiddenInput}
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <div>
                    <p className={styles.avatarName}>
                      {profile.full_name || "Your Name"}
                    </p>
                    <p className={styles.avatarEmail}>{userEmail}</p>
                    {uploading && (
                      <p className={styles.uploadingText}>Uploading...</p>
                    )}
                  </div>
                </div>

                <div className={styles.fieldDivider} />

                {/* FIELDS */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Display Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, full_name: e.target.value }))
                    }
                    placeholder="Your full name"
                    className={styles.fieldInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="A short bio about yourself..."
                    rows={3}
                    className={styles.fieldTextarea}
                  />
                  <p className={styles.fieldHint}>
                    {profile.bio.length}/160 characters
                  </p>
                </div>

                <div className={styles.fieldDivider} />
                <h3 className={styles.subSectionTitle}>Social Links</h3>

                <div className={styles.socialGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      <TwitterIcon size={14} color="#1DA1F2" /> Twitter / X
                    </label>
                    <div className={styles.inputWithPrefix}>
                      <span className={styles.inputPrefix}>@</span>
                      <input
                        type="text"
                        value={profile.twitter}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, twitter: e.target.value }))
                        }
                        placeholder="username"
                        className={styles.fieldInputPrefixed}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      <GithubIcon size={14} /> GitHub
                    </label>
                    <div className={styles.inputWithPrefix}>
                      <span className={styles.inputPrefix}>@</span>
                      <input
                        type="text"
                        value={profile.github}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, github: e.target.value }))
                        }
                        placeholder="username"
                        className={styles.fieldInputPrefixed}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      <LinkedinIcon size={14} color="#0A66C2" /> LinkedIn
                    </label>
                    <div className={styles.inputWithPrefix}>
                      <span className={styles.inputPrefix}>in/</span>
                      <input
                        type="text"
                        value={profile.linkedin}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            linkedin: e.target.value,
                          }))
                        }
                        placeholder="username"
                        className={styles.fieldInputPrefixed}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      <Mail size={14} /> Website
                    </label>
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, website: e.target.value }))
                      }
                      placeholder="https://yoursite.com"
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveBtn}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            )}

            {/* ===== ACCOUNT TAB ===== */}
            {activeTab === "account" && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Account</h2>
                <p className={styles.cardDesc}>
                  Manage your email and password.
                </p>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className={`${styles.fieldInput} ${styles.fieldInputDisabled}`}
                  />
                  <p className={styles.fieldHint}>
                    Email cannot be changed here. Contact support.
                  </p>
                </div>

                <div className={styles.fieldDivider} />

                <div className={styles.accountActions}>
                  <div className={styles.accountActionItem}>
                    <div>
                      <p className={styles.actionTitle}>Change Password</p>
                      <p className={styles.actionDesc}>
                        Send a password reset link to your email
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const { error } =
                          await supabase.auth.resetPasswordForEmail(userEmail);
                        if (error) toast.error(error.message);
                        else toast.success("Password reset email sent!");
                      }}
                      className={styles.actionBtn}
                    >
                      Send Reset Email
                    </button>
                  </div>

                  <div
                    className={`${styles.accountActionItem} ${styles.dangerZone}`}
                  >
                    <div>
                      <p
                        className={styles.actionTitle}
                        style={{ color: "var(--color-error)" }}
                      >
                        Sign Out
                      </p>
                      <p className={styles.actionDesc}>
                        Sign out from all devices
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className={styles.actionBtnDanger}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== APPEARANCE TAB ===== */}
            {activeTab === "appearance" && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Appearance</h2>
                <p className={styles.cardDesc}>
                  Customize how IndustrialBlog looks for you.
                </p>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Theme</label>
                  <div className={styles.themeGrid}>
                    <button
                      onClick={() => setTheme("light")}
                      className={`${styles.themeCard} ${theme === "light" ? styles.themeCardActive : ""}`}
                    >
                      <div className={styles.themePreviewLight}>
                        <div className={styles.themePreviewBar} />
                        <div className={styles.themePreviewLines} />
                      </div>
                      <div className={styles.themeCardFooter}>
                        <Sun size={16} color="#F59E0B" />
                        <span>Light</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={`${styles.themeCard} ${theme === "dark" ? styles.themeCardActive : ""}`}
                    >
                      <div className={styles.themePreviewDark}>
                        <div
                          className={styles.themePreviewBar}
                          style={{ background: "#10B981" }}
                        />
                        <div className={styles.themePreviewLinesDark} />
                      </div>
                      <div className={styles.themeCardFooter}>
                        <Moon size={16} color="#94A3B8" />
                        <span>Dark</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className={styles.fieldDivider} />

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Current Theme</label>
                  <p
                    style={{ color: "var(--text-secondary)", fontSize: "14px" }}
                  >
                    You are currently using{" "}
                    <strong style={{ color: "var(--brand-green)" }}>
                      {theme} mode
                    </strong>
                    . Your preference is saved in your browser.
                  </p>
                </div>
              </div>
            )}

            {/* ===== NOTIFICATIONS TAB ===== */}
            {activeTab === "notifications" && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Notifications</h2>
                <p className={styles.cardDesc}>
                  Choose what updates you want to receive.
                </p>

                <div className={styles.notifList}>
                  {[
                    {
                      key: "newsletter",
                      title: "Newsletter",
                      desc: "Weekly roundup of the best articles",
                    },
                    {
                      key: "newComments",
                      title: "Comment Replies",
                      desc: "When someone replies to your comment",
                    },
                    {
                      key: "weeklyDigest",
                      title: "Weekly Digest",
                      desc: "Top trending posts every Monday",
                    },
                  ].map((item) => (
                    <div key={item.key} className={styles.notifItem}>
                      <div>
                        <p className={styles.notifTitle}>{item.title}</p>
                        <p className={styles.notifDesc}>{item.desc}</p>
                      </div>
                      <button
                        role="switch"
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof prev],
                          }))
                        }
                        className={`${styles.toggle} ${
                          notifications[item.key as keyof typeof notifications]
                            ? styles.toggleOn
                            : styles.toggleOff
                        }`}
                        aria-checked={
                          notifications[item.key as keyof typeof notifications]
                        }
                      >
                        <div className={styles.toggleThumb} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    toast.success("Notification preferences saved!")
                  }
                  className={styles.saveBtn}
                  style={{ marginTop: "24px" }}
                >
                  <Save size={16} /> Save Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
