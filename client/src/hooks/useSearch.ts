import { useState, useCallback, useRef } from 'react';
import type {
  Market,
  RedditResult,
  GoogleResult,
  FacebookResult,
  TelegramResult,
  SourceStatus,
  SearchExport,
  SynthesisReport,
} from '../../../shared/searchTypes';

export type SourceState = {
  status: SourceStatus;
  count: number;
  error?: string;
};

export type SearchState = {
  isSearching: boolean;
  expandedQueries: string[];
  sources: {
    reddit: SourceState;
    google: SourceState;
    facebook: SourceState;
    telegram: SourceState;
  };
  synthesisStatus: SourceStatus;
  synthesis: SynthesisReport | null;
  redditResults: RedditResult[];
  googleResults: GoogleResult[];
  facebookResults: FacebookResult[];
  telegramResults: TelegramResult[];
  exportData: SearchExport | null;
  error: string | null;
};

const initialSourceState: SourceState = { status: 'idle', count: 0 };

const initialState: SearchState = {
  isSearching: false,
  expandedQueries: [],
  sources: {
    reddit: { ...initialSourceState },
    google: { ...initialSourceState },
    facebook: { ...initialSourceState },
    telegram: { ...initialSourceState },
  },
  synthesisStatus: 'idle',
  synthesis: null,
  redditResults: [],
  googleResults: [],
  facebookResults: [],
  telegramResults: [],
  exportData: null,
  error: null,
};

export function useSearch() {
  const [state, setState] = useState<SearchState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback((query: string, market: Market) => {
    if (!query.trim()) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset state
    setState({
      isSearching: true,
      expandedQueries: [],
      sources: {
        reddit: { status: 'searching', count: 0 },
        google: { status: 'searching', count: 0 },
        facebook: { status: 'searching', count: 0 },
        telegram: { status: 'searching', count: 0 },
      },
      synthesisStatus: 'idle',
      synthesis: null,
      redditResults: [],
      googleResults: [],
      facebookResults: [],
      telegramResults: [],
      exportData: null,
      error: null,
    });

    const params = new URLSearchParams({ q: query, market });
    const url = `/api/search?${params.toString()}`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener('queries', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { expanded: string[] };
      setState((prev) => ({ ...prev, expandedQueries: data.expanded }));
    });

    eventSource.addEventListener('status', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as {
        source: string;
        status: SourceStatus;
        count?: number;
        error?: string;
      };

      if (data.source === 'synthesis') {
        setState((prev) => ({
          ...prev,
          synthesisStatus: data.status,
        }));
        return;
      }

      const src = data.source as keyof SearchState['sources'];
      if (!['reddit', 'google', 'facebook', 'telegram'].includes(data.source)) return;

      setState((prev) => ({
        ...prev,
        sources: {
          ...prev.sources,
          [src]: {
            status: data.status,
            count: data.count ?? prev.sources[src].count,
            error: data.error,
          },
        },
      }));
    });

    eventSource.addEventListener('results', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as {
        source: string;
        results: unknown[];
      };
      setState((prev) => {
        if (data.source === 'reddit') {
          return { ...prev, redditResults: data.results as RedditResult[] };
        } else if (data.source === 'google') {
          return { ...prev, googleResults: data.results as GoogleResult[] };
        } else if (data.source === 'facebook') {
          return { ...prev, facebookResults: data.results as FacebookResult[] };
        } else {
          return { ...prev, telegramResults: data.results as TelegramResult[] };
        }
      });
    });

    eventSource.addEventListener('synthesis', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as SynthesisReport;
      setState((prev) => ({ ...prev, synthesis: data }));
    });

    eventSource.addEventListener('done', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as SearchExport;
      setState((prev) => ({
        ...prev,
        isSearching: false,
        exportData: data,
      }));
      eventSource.close();
    });

    eventSource.onerror = () => {
      setState((prev) => ({
        ...prev,
        isSearching: false,
        error: 'Search failed. Please try again.',
      }));
      eventSource.close();
    };
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isSearching: false }));
  }, []);

  return { state, search, cancel };
}
