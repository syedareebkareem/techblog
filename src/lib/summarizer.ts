// src/lib/summarizer.ts
// Free, client-side article summarization using keyword frequency + sentence scoring

export function extractSummary(
  content: string,
  maxSentences: number = 3
): string {
  if (!content || content.length < 100) return content.substring(0, 150);

  // Remove HTML tags and clean text
  const cleanText = content
    .replace(/<[^>]*>/g, " ") // Remove HTML
    .replace(/\s+/g, " ")     // Collapse whitespace
    .trim();

  // Split into sentences (handles . ! ?)
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 20)
    .slice(0, 20); // Only consider first 20 sentences for efficiency

  if (sentences.length === 0) return cleanText.substring(0, 200);

  // Calculate word frequency
  const words = cleanText.toLowerCase().split(/\W+/);
  const wordFreq: Record<string, number> = {};

  // Count word frequencies, ignoring common filler words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "can", "in", "on", "at", "to", "from",
    "for", "of", "with", "by", "as", "if", "that", "this", "it", "which", "who",
    "what", "when", "where", "why", "how", "all", "each", "every", "both",
    "such", "no", "not", "just", "only", "very", "too", "so", "than", "more",
    "most", "some", "any", "many", "much", "few", "other", "nor", "own", "same", 
    "now", "about"
  ]);

  words.forEach((word) => {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Score sentences based on word frequency + position weight
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    const sentenceWords = sentence.toLowerCase().split(/\W+/);

    // Cumulative frequency scoring
    sentenceWords.forEach((word) => {
      if (wordFreq[word]) score += wordFreq[word];
    });

    // Distribution boost: earlier sentences in a tech article carry more weight
    const positionBoost = 1 - index * 0.05;
    score *= positionBoost;

    // Penalize fragmented sentences
    if (sentenceWords.length < 5) score *= 0.5;

    return { sentence: sentence.trim(), score };
  });

  // Sort by score, grab top sentences, then restore chronological paragraph order
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence))
    .map((s) => s.sentence);

  return topSentences.join(" ").substring(0, 200);
}