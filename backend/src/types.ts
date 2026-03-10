export type Market = 'global' | 'vietnam' | 'brazil';

export interface SearchRequest {
  query: string;
  market: Market;
}

export interface RedditResult {
  source: 'reddit';
  title: string;
  url: string;
  snippet: string;
  date: string;
  score: number;
  subreddit: string;
  num_comments: number;
  external_url?: string;
}

export interface GoogleResult {
  source: 'google';
  title: string;
  url: string;
  snippet: string;
  source_domain: string;
  date?: string;
}

export interface TelegramResult {
  source: 'telegram';
  channel_name: string;
  channel_url: string;
  snippet: string;
  date?: string;
  views?: number;
}

export type SearchResult = RedditResult | GoogleResult | TelegramResult;

export interface SearchResponse {
  metadata: {
    query: string;
    market: Market;
    timestamp: string;
    sources_searched: string[];
    sources_succeeded: string[];
    sources_failed: string[];
    total_results: number;
  };
  results: SearchResult[];
}

export interface SourceStatus {
  source: string;
  status: 'pending' | 'searching' | 'done' | 'failed';
  count?: number;
  error?: string;
}
