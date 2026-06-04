// src/lib/articleUtils.ts

export interface Heading {
  id: string;
  text: string;
  level: number;
}
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function extractHeadings(content: string): Heading[] {
  if (!content) return [];
  const headings: Heading[] = [];
  
  // Create temporary DOM element
  const temp = document.createElement('div');
  temp.innerHTML = content;

  // Find all h2 and h3 tags
  const headingElements = temp.querySelectorAll('h2, h3');
  
  headingElements.forEach((heading, index) => {
    const text = heading.textContent || '';
    const level = parseInt(heading.tagName[1]); 
    const id = heading.id || `heading-${index}`;
    
    if (!heading.id) heading.id = id;
    headings.push({ id, text, level });
  });

  return headings;
}

export function calculateReadingTime(content: string): number {
  if (!content) return 0;
  const plainText = content.replace(/<[^>]*>/g, '');
  const wordCount = plainText.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  return Math.max(1, readingTime);
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy:', error);
    throw error;
  }
}