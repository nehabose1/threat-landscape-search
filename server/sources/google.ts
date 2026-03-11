import type { GoogleResult } from '../../shared/searchTypes';

const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

type SerperOrganic = {
  title: string;
  link: string;
  snippet: string;
  date?: string;
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

async function serperSearch(query: string): Promise<GoogleResult[]> {
  if (!SERPER_API_KEY) {
    console.warn('SERPER_API_KEY not set — skipping Google search');
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
    .filter((r) => r.title && r.link)
    .map((r) => ({
      source: 'google' as const,
      title: r.title,
      url: r.link,
      domain: extractDomain(r.link),
      date: r.date || '',
      snippet: (r.snippet || '').slice(0, 300),
    }));
}

export async function searchGoogle(
  queries: string[]
): Promise<GoogleResult[]> {
  const seen = new Set<string>();
  const allResults: GoogleResult[] = [];

  // Run up to 4 queries in parallel
  const promises = queries.slice(0, 4).map((q) =>
    serperSearch(q).catch((err) => {
      console.error(`Serper search failed for "${q}":`, err);
      return [] as GoogleResult[];
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

  return allResults.slice(0, 80);
}
