import type { FacebookResult } from '../../shared/searchTypes';

const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

type SerperOrganic = {
  title: string;
  link: string;
  snippet: string;
  date?: string;
};

function extractGroupName(url: string, title: string): string {
  const match = url.match(/facebook\.com\/groups\/([^/?]+)/);
  if (match) return match[1].replace(/-/g, ' ');
  return title
    .replace(/\s*[|\-–]\s*Facebook.*$/i, '')
    .replace(/\s*\|\s*Facebook$/i, '')
    .trim();
}

async function serperFacebookSearch(query: string): Promise<FacebookResult[]> {
  if (!SERPER_API_KEY) {
    console.warn('SERPER_API_KEY not set — skipping Facebook search');
    return [];
  }

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 20 }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Serper returned ${res.status}`);
  }

  const data = (await res.json()) as { organic?: SerperOrganic[] };
  const results = data.organic ?? [];

  return results
    .filter((r) => r.link && r.link.includes('facebook.com'))
    .map((r) => ({
      source: 'facebook' as const,
      title: r.title,
      url: r.link,
      snippet: (r.snippet || '').slice(0, 300),
      group_name: extractGroupName(r.link, r.title),
      date: r.date || '',
    }));
}

export async function searchFacebook(
  queries: string[]
): Promise<FacebookResult[]> {
  // Build site-restricted queries from the first 3 expanded queries
  const fbQueries = queries.slice(0, 3).flatMap((q) => [
    `site:facebook.com/groups ${q}`,
    `site:facebook.com "${q}" group`,
  ]);

  const seen = new Set<string>();
  const allResults: FacebookResult[] = [];

  const promises = fbQueries.slice(0, 4).map((q) =>
    serperFacebookSearch(q).catch((err) => {
      console.error(`Facebook search failed for "${q}":`, err);
      return [] as FacebookResult[];
    })
  );

  const batches = await Promise.all(promises);

  for (const batch of batches) {
    for (const r of batch) {
      if (!seen.has(r.url)) {
        seen.add(r.url);
        allResults.push(r);
      }
    }
  }

  return allResults.slice(0, 40);
}
