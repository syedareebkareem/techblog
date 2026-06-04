// src/app/api/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { extractSummary } from "@/lib/summarizer";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Missing content" },
        { status: 400 }
      );
    }

    // Generate extractive summary using our local NLP extractor
    const summary = extractSummary(content, 3);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}