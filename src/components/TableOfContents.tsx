// src/components/TableOfContents.tsx
"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { Heading } from "@/lib/articleUtils";
import styles from "./Components.module.css";

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll("h2, h3");
      let current = "";
      headingElements.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) current = heading.id;
      });
      if (current) setActiveId(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className={styles.tocSticky}>
      <div className={styles.card}>
        <button onClick={() => setIsOpen(!isOpen)} className={styles.tocHeader}>
          <h3 className={styles.cardTitle}>Table of Contents</h3>
          <ChevronDown
            size={18}
            style={{
              transform: isOpen ? "none" : "rotate(-90deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {isOpen && (
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => handleClick(heading.id)}
                className={`${styles.tocItem} ${activeId === heading.id ? styles.tocItemActive : ""}`}
                style={{ paddingLeft: `${8 + (heading.level - 2) * 16}px` }}
              >
                {heading.text}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
