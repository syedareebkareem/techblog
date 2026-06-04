// src/components/AuthorCard.tsx
"use client";

import Image from "next/image";
import { Mail } from "lucide-react";
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
const GithubIcon = () => (
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
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
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
  author: {
    name: string;
    avatar?: string;
    bio?: string;
    email?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  postCount?: number;
}

export default function AuthorCard({ author, postCount }: Props) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "2px solid var(--brand-light, #ecfdf5)",
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {author.avatar ? (
        <Image
          src={author.avatar}
          alt={author.name}
          width={80}
          height={80}
          style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          unoptimized
        />
      ) : (
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--brand-green, #10B981)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: "28px",
            flexShrink: 0,
          }}
        >
          {author.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div style={{ flex: 1, minWidth: "200px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            margin: "0 0 4px",
            color: "var(--text-primary)",
          }}
        >
          {author.name}
        </h3>

        {postCount !== undefined && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--brand-green)",
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            {postCount} articles published
          </p>
        )}

        {author.bio ? (
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              margin: "0 0 16px",
              lineHeight: "1.6",
            }}
          >
            {author.bio}
          </p>
        ) : (
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-tertiary)",
              margin: "0 0 16px",
              fontStyle: "italic",
            }}
          >
            Tech enthusiast and contributor at IndustrialBlog.
          </p>
        )}

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {author.twitter && (
            <a
              href={`https://twitter.com/${author.twitter}`}
              className={styles.socialLink}
              style={{ color: "var(--text-secondary)" }}
            >
              <TwitterIcon />
            </a>
          )}
          {author.github && (
            <a
              href={`https://github.com/${author.github}`}
              className={styles.socialLink}
              style={{ color: "var(--text-secondary)" }}
            >
              <GithubIcon />
            </a>
          )}
          {author.linkedin && (
            <a
              href={`https://linkedin.com/in/${author.linkedin}`}
              className={styles.socialLink}
              style={{ color: "var(--text-secondary)" }}
            >
              <LinkedinIcon />
            </a>
          )}
          {author.email && (
            <a
              href={`mailto:${author.email}`}
              className={styles.socialLink}
              style={{ color: "var(--text-secondary)" }}
            >
              <Mail size={18} />
            </a>
          )}

          <button
            className={styles.btnPrimary}
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              fontSize: "13px",
            }}
          >
            Follow
          </button>
        </div>
      </div>
    </div>
  );
}
