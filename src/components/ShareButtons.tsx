"use client";

import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import styles from "./Components.module.css";

// Native SVGs to bypass Lucide's removal of brand icons
const TwitterIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
const LinkedinIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface Props {
  title: string;
  url: string;
  description?: string;
  variant?: "horizontal" | "vertical";
}

export default function ShareButtons({
  title,
  url,
  description,
  variant = "horizontal",
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description || title)}%0A%0A${encodeURIComponent(url)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const openShare = (shareUrl: string) =>
    window.open(shareUrl, "share", "width=600,height=400");

  const handleEmail = () => {
    window.location.href = shareUrls.email;
  };

  const buttons = [
    {
      id: "twitter",
      label: "Twitter",
      icon: TwitterIcon,
      onClick: () => openShare(shareUrls.twitter),
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: LinkedinIcon,
      onClick: () => openShare(shareUrls.linkedin),
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      onClick: handleEmail,
    },
    {
      id: "copy",
      label: "Copy Link",
      icon: copied ? Check : Copy,
      onClick: handleCopyLink,
    },
  ];

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>Share Article</p>
      <div
        className={
          variant === "vertical" ? styles.shareFlexVertical : styles.shareFlex
        }
      >
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              onClick={btn.onClick}
              title={btn.label}
              className={styles.shareBtn}
            >
              <Icon size={18} />
              {variant === "vertical" && (
                <span style={{ fontSize: "12px", fontWeight: 500 }}>
                  {btn.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
