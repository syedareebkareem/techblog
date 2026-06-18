// src/app/post/[slug]/page.tsx
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ArticleClientComponent from "./ArticleClientComponent";

// ============= TYPES =============
// 👉 Next.js 15 FIX: params must be typed as a Promise
interface Props {
  params: Promise<{ slug: string }>;
}

// ============= SERVER-SIDE SEO GENERATION =============
// This guarantees that Google, Twitter, and LinkedIn can read the tags instantly,
// without having to wait for JavaScript to load!
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 👉 Next.js 15 FIX: Await the params before extracting the slug
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Fetch the basic post data strictly for SEO tags
  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image, category, created_at")
    .eq("slug", slug)
    .single();

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techblog-rhbfwfncf-syed-areeb-kareem-s-projects.vercel.app/";
  const postUrl = `${siteUrl}/post/${slug}`;
  const imageUrl = post.cover_image || `${siteUrl}/og-default.png`;

  return {
    title: post.title,
    description: post.excerpt || post.title,
    keywords: [post.category, "tech blog", "engineering", post.title],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url: postUrl,
      siteName: "IndustrialBlog",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
      publishedTime: post.created_at,
      section: post.category,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.title,
      images: [imageUrl],
    },
  };
}

// ============= SERVER COMPONENT =============
// 👉 Next.js 15 FIX: Make the default function async
export default async function Page({ params }: Props) {
  // 👉 Next.js 15 FIX: Await the params before passing them to the client component
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // We pass the slug down to your existing client component!
  return <ArticleClientComponent slug={slug} />;
}
