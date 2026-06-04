// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

// We added advanced, dynamic fallback metadata here!
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "IndustrialBlog | Engineering the Future",
    template: "%s | IndustrialBlog",
  },
  description: "Enterprise-grade architecture and machine learning deep dives.",
  keywords: [
    "tech blog",
    "AI",
    "machine learning",
    "web development",
    "hardware",
    "engineering",
  ],
  authors: [{ name: "IndustrialBlog" }],
  creator: "IndustrialBlog",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "IndustrialBlog",
    title: "IndustrialBlog | Engineering the Future",
    description:
      "Enterprise-grade architecture and machine learning deep dives.",
    images: [
      {
        url: "/og-default.png", // NOTE: You need to put an image named og-default.png in your public folder!
        width: 1200,
        height: 630,
        alt: "IndustrialBlog Cover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IndustrialBlog | Engineering the Future",
    description:
      "Enterprise-grade architecture and machine learning deep dives.",
    images: ["/og-default.png"],
    creator: "@industrialblog",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Removed hardcoded bg-slate-50 so globals.css can apply var(--bg-primary) */}
      <body
        className={`${inter.className} min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Navbar />
          {children}
          {/* Made Toaster dynamic using the new CSS variables */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-main)",
              },
              success: {
                iconTheme: {
                  primary: "var(--brand-green)",
                  secondary: "var(--bg-card)",
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
