import OpenAI from 'openai';
import { GoogleResult, Market } from '../types';
import { getMarketKeywords } from '../marketKeywords';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

async function webSearch(query: string): Promise<WebSearchResult[]> {
  const prompt = `Search the web for: "${query}"

Return the top 20 most relevant results as a JSON array. Each result must have:
- title: the page title
- url: the full URL
- snippet: a brief description or excerpt (max 300 chars)
- date: publication date if available (YYYY-MM or YYYY-MM-DD format), or null

Focus on cybersecurity, threat intelligence, and OSINT-relevant results.
Return ONLY valid JSON array, no other text.`;

  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    tools: [{ type: 'web_search_preview' as const }],
    input: prompt,
  });

  const text = response.output_text || '';

  // Extract JSON from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  try {
    const results = JSON.parse(jsonMatch[0]) as WebSearchResult[];
    return results.filter(
      (r) => r.title && r.url && r.url.startsWith('http')
    );
  } catch {
    return [];
  }
}

export async function searchGoogle(
  query: string,
  market: Market
): Promise<GoogleResult[]> {
  const baseQueries = [
    query,
    `site:reddit.com ${query}`,
    `site:github.com ${query}`,
    `${query} pricing cost tool service`,
  ];

  // Add market-specific queries
  const marketTerms = getMarketKeywords(market);
  const marketQueries = marketTerms.slice(0, 3).map((t) => `${query} ${t}`);

  const allQueries = [...baseQueries, ...marketQueries];

  const seen = new Set<string>();
  const allResults: GoogleResult[] = [];

  // Run searches in parallel (OpenAI handles rate limiting internally)
  const searchPromises = allQueries.map((q) =>
    webSearch(q).catch((err) => {
      console.error(`Web search failed for query "${q}":`, err);
      return [] as WebSearchResult[];
    })
  );

  const batches = await Promise.all(searchPromises);

  for (const batch of batches) {
    for (const r of batch) {
      if (!seen.has(r.url)) {
        seen.add(r.url);
        allResults.push({
          source: 'google',
          title: r.title,
          url: r.url,
          snippet: (r.snippet || '').slice(0, 300),
          source_domain: extractDomain(r.url),
          date: r.date || undefined,
        });
      }
    }
  }

  return allResults.slice(0, 100);
}
