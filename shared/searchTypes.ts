export type Market = 'global' | 'vietnam' | 'brazil';

export type RedditResult = {
  source: 'reddit';
  title: string;
  url: string;
  subreddit: string;
  score: number;
  num_comments: number;
  date: string;
  snippet: string;
  external_url?: string;
};

export type GoogleResult = {
  source: 'google';
  title: string;
  url: string;
  domain: string;
  date: string;
  snippet: string;
};

export type FacebookResult = {
  source: 'facebook';
  title: string;
  url: string;
  snippet: string;
  group_name: string;
  date: string;
};

export type TelegramResult = {
  source: 'telegram';
  channel_name: string;
  channel_url: string;
  date: string;
  views: number | null;
  snippet: string;
};

export type YouTubeResult = {
  source: 'youtube';
  title: string;
  url: string;
  channel: string;
  date: string;
  snippet: string;
  transcript_excerpt: string;
  duration: string;
};

export type SearchResult = RedditResult | GoogleResult | FacebookResult | TelegramResult | YouTubeResult;

export type SourceStatus = 'idle' | 'searching' | 'done' | 'failed';

export type SourceState = {
  status: SourceStatus;
  count: number;
  error?: string;
};

export type SynthesisItem = {
  title: string;
  url: string;
  source: string;
  detail: string;
  key_quote: string;
  trust_justification: string;
  reliability_rating: number; // 1-5
};

export type SynthesisCategory = {
  name: string;
  summary: string;
  items: SynthesisItem[];
};

export type SynthesisReport = {
  overview: string;
  key_insights: string[];
  categories: SynthesisCategory[];
  gaps: string[];
  confidence_notes: string[];
};

export type SearchMetadata = {
  query: string;
  market: Market;
  timestamp: string;
  expanded_queries: string[];
  sources_searched: string[];
  sources_succeeded: string[];
  sources_failed: string[];
  total_results: number;
};

export type SearchExport = {
  metadata: SearchMetadata;
  results: SearchResult[];
  synthesis?: SynthesisReport;
};
