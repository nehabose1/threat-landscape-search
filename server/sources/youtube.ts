import type { YouTubeResult, Market } from '../../shared/searchTypes';
import { youtubeMarketTerms } from '../marketKeywords';

const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

type SerperVideo = {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  channel?: string;
  duration?: string;
};

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1);
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchTranscript(videoId: string): Promise<string> {
  // Fetch YouTube's timedtext list page to get auto-generated or manual captions
  const listUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const res = await fetch(listUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return '';

    const html = await res.text();

    // Extract captions URL from the page's ytInitialPlayerResponse
    const captionMatch = html.match(
      /"captionTracks":\[(\{[^}]*?"baseUrl":"(https:[^"]+)"[^}]*?\})/
    );

    if (!captionMatch?.[2]) return '';

    const captionUrl = captionMatch[2].replace(/\\u0026/g, '&');

    const captionRes = await fetch(captionUrl, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!captionRes.ok) return '';

    const xml = await captionRes.text();

    // Strip XML tags, decode entities, join text segments
    const segments = xml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];
    const text = segments
      .map((s) =>
        s
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
      )
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  } catch {
    return '';
  }
}

async function serperVideoSearch(query: string): Promise<SerperVideo[]> {
  if (!SERPER_API_KEY) {
    console.warn('SERPER_API_KEY not set — skipping YouTube search');
    return [];
  }

  const res = await fetch('https://google.serper.dev/videos', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 10 }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Serper videos returned ${res.status}`);
  }

  const data = (await res.json()) as { videos?: SerperVideo[] };
  return (data.videos ?? []).filter(
    (v) => v.link && v.link.includes('youtube.com/watch')
  );
}

export async function searchYouTube(
  query: string,
  market: Market
): Promise<YouTubeResult[]> {
  // Build query variants
  const queries: string[] = [
    `${query} tutorial hacking cybersecurity`,
    `${query} tool demonstration`,
  ];

  const marketTerms =
    typeof youtubeMarketTerms === 'function'
      ? youtubeMarketTerms(market)
      : [];
  if (marketTerms.length > 0) {
    queries.push(`${query} ${marketTerms[0]}`);
  }

  // Search all variants in parallel
  const settled = await Promise.allSettled(
    queries.map((q) =>
      serperVideoSearch(q).catch((err) => {
        console.error(`YouTube search failed for "${q}":`, err);
        return [] as SerperVideo[];
      })
    )
  );

  // Deduplicate by URL
  const seen = new Set<string>();
  const videos: SerperVideo[] = [];

  for (const s of settled) {
    if (s.status !== 'fulfilled') continue;
    for (const v of s.value) {
      if (!seen.has(v.link)) {
        seen.add(v.link);
        videos.push(v);
      }
    }
  }

  // Take top 10, fetch transcripts in parallel
  const top = videos.slice(0, 10);

  const results: YouTubeResult[] = await Promise.all(
    top.map(async (v) => {
      const videoId = extractVideoId(v.link);
      let transcript = '';

      if (videoId) {
        transcript = await fetchTranscript(videoId);
      }

      // Take first 1000 chars of transcript as excerpt
      const excerpt = transcript.slice(0, 1000);

      return {
        source: 'youtube' as const,
        title: v.title,
        url: v.link,
        channel: v.channel || '',
        date: v.date || '',
        snippet: (v.snippet || '').slice(0, 300),
        transcript_excerpt: excerpt,
        duration: v.duration || '',
      };
    })
  );

  return results;
}
