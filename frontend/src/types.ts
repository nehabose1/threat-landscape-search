export type Market = 'global' | 'vietnam' | 'brazil';

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

export type SourceStatus = 'idle' | 'searching' | 'done' | 'failed';

export interface SourceState {
  status: SourceStatus;
  count?: number;
  error?: string;
  results: SearchResult[];
}

export interface SearchState {
  query: string;
  market: Market;
  timestamp: string;
  sources: {
    reddit: SourceState;
    google: SourceState;
    telegram: SourceState;
  };
  isSearching: boolean;
  isDone: boolean;
}
