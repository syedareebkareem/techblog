"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Copy } from "lucide-react";
import toast from "react-hot-toast";

interface Subscriber {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, status, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      setSubscribers(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const exportEmails = () => {
    const emails = subscribers.map((s) => s.email).join("\n");
    const blob = new Blob([emails], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.txt";
    a.click();
    toast.success("Exported!");
  };

  const copyAllEmails = () => {
    const emails = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emails);
    toast.success(`Copied ${subscribers.length} emails!`);
  };

  return (
    <div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: "24px",
        }}
      >
        Newsletter Subscribers
      </h1>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-main)",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <button
          onClick={copyAllEmails}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            background: "var(--brand-green)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Copy size={14} /> Copy All
        </button>
        <button
          onClick={exportEmails}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            background: "transparent",
            border: "1px solid var(--border-main)",
            borderRadius: "6px",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          fontSize: "14px",
          color: "var(--text-secondary)",
        }}
      >
        📊 <strong>{subscribers.length} active subscribers</strong> • Growth
        tracking and email sending coming soon
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : subscribers.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-main)",
            borderRadius: "12px",
            color: "var(--text-secondary)",
          }}
        >
          No subscribers yet
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-main)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              fontSize: "13px",
              borderCollapse: "collapse",
            }}
          >
            <thead
              style={{
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-main)",
              }}
            >
              <tr>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribers.slice(0, 50).map((sub) => (
                <tr
                  key={sub.id}
                  style={{ borderBottom: "1px solid var(--border-main)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                >
                  <td style={{ padding: "12px" }}>{sub.email}</td>
                  <td
                    style={{ padding: "12px", color: "var(--text-tertiary)" }}
                  >
                    {new Date(sub.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
