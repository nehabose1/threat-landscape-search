import OpenAI from 'openai';
import { TelegramResult, Market } from '../types';
import { getMarketKeywords } from '../marketKeywords';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RawTelegramResult {
  channel_name?: string;
  channel_url?: string;
  snippet?: string;
  date?: string | null;
  views?: number | null;
}

async function webSearchTelegram(query: string): Promise<TelegramResult[]> {
  const prompt = `Search for Telegram channels and posts related to: "${query}"

Search using site:t.me, tgstat.com, and similar Telegram search tools.
Return the top 15 most relevant Telegram channels or posts as a JSON array.
Each result must have:
- channel_name: the Telegram channel or group name (without @)
- channel_url: the full t.me URL (e.g. https://t.me/channelname)
- snippet: a brief description of the channel or post excerpt (max 300 chars)
- date: publication date if available (YYYY-MM-DD or YYYY-MM format), or null
- views: view count if available as a number, or null

Focus on cybersecurity, threat intelligence, and OSINT-relevant Telegram channels.
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
    const results = JSON.parse(jsonMatch[0]) as RawTelegramResult[];
    return results
      .filter((r) => r.channel_name && r.channel_url)
      .map((r) => ({
        source: 'telegram' as const,
        channel_name: r.channel_name!,
        channel_url: r.channel_url!.startsWith('http')
          ? r.channel_url!
          : `https://t.me/${r.channel_name}`,
        snippet: (r.snippet || '').slice(0, 300),
        date: r.date || undefined,
        views: r.views || undefined,
      }));
  } catch {
    return [];
  }
}

export async function searchTelegram(
  query: string,
  market: Market
): Promise<TelegramResult[]> {
  const queries = [query];

  // Add market-specific queries
  const marketTerms = getMarketKeywords(market);
  if (marketTerms.length > 0) {
    queries.push(`${query} ${marketTerms[0]}`);
  }

  const seen = new Set<string>();
  const allResults: TelegramResult[] = [];

  const searchPromises = queries.map((q) =>
    webSearchTelegram(q).catch((err) => {
      console.error(`Telegram web search failed for query "${q}":`, err);
      return [] as TelegramResult[];
    })
  );

  const batches = await Promise.all(searchPromises);

  for (const batch of batches) {
    for (const r of batch) {
      const key = r.channel_url;
      if (!seen.has(key)) {
        seen.add(key);
        allResults.push(r);
      }
    }
  }

  return allResults;
}
