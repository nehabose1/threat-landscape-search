import axios from 'axios';
import { RedditResult, Market } from '../types';
import { getMarketKeywords } from '../marketKeywords';

const SUBREDDITS = [
  'netsec',
  'hacking',
  'cybersecurity',
  'AskNetsec',
  'facebook',
  'ReverseEngineering',
  'Malware',
];

interface PullpushPost {
  title: string;
  permalink: string;
  selftext?: string;
  subreddit: string;
  score: number;
  created_utc: number;
  num_comments: number;
  url: string;
  id: string;
}

interface PullpushResponse {
  data: PullpushPost[];
  metadata?: unknown;
  error?: string | null;
}

async function searchPullpushSubreddit(
  query: string,
  subreddit: string
): Promise<RedditResult[]> {
  const url = `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(
    query
  )}&subreddit=${subreddit}&size=25`;

  const response = await axios.get<PullpushResponse>(url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'ThreatLandscapeSearch/1.0 OSINT-Research',
    },
  });

  const posts: PullpushPost[] = response.data?.data ?? [];

  return posts
    .map((post) => {
      const postUrl = `https://www.reddit.com${post.permalink}`;
      const isExternal =
        post.url &&
        !post.url.startsWith('https://www.reddit.com') &&
        !post.url.startsWith('https://reddit.com') &&
        !post.url.includes('/r/') &&
        post.url.startsWith('http');

      const result: RedditResult = {
        source: 'reddit',
        title: post.title,
        url: postUrl,
        snippet: post.selftext ? post.selftext.slice(0, 300) : '',
        date: new Date(post.created_utc * 1000).toISOString().split('T')[0],
        score: post.score,
        subreddit: post.subreddit,
        num_comments: post.num_comments,
      };

      if (isExternal) {
        result.external_url = post.url;
      }

      return result;
    })
    .filter((r) => r.score >= 2);
}

async function searchPullpushAll(query: string): Promise<RedditResult[]> {
  // Search all target subreddits in parallel
  const subredditPromises = SUBREDDITS.map((sub) =>
    searchPullpushSubreddit(query, sub).catch(() => [] as RedditResult[])
  );
  const batches = await Promise.all(subredditPromises);
  return batches.flat();
}

export async function searchReddit(
  query: string,
  market: Market
): Promise<RedditResult[]> {
  const queries = [query];

  // Add market-specific keywords as additional queries
  const marketTerms = getMarketKeywords(market);
  if (marketTerms.length > 0) {
    queries.push(...marketTerms.slice(0, 2));
  }

  const seen = new Set<string>();
  const allResults: RedditResult[] = [];

  for (const q of queries) {
    try {
      const results = await searchPullpushAll(q);
      for (const r of results) {
        if (!seen.has(r.url)) {
          seen.add(r.url);
          allResults.push(r);
        }
      }
    } catch (err) {
      console.error(`Reddit/Pullpush search failed for query "${q}":`, err);
    }
  }

  // Sort by score descending
  return allResults.sort((a, b) => b.score - a.score);
}
