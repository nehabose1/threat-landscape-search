import { useState, useCallback, useRef } from 'react';
import {
  Market,
  SearchResult,
  SourceState,
  SearchState,
  RedditResult,
  GoogleResult,
  TelegramResult,
} from './types';

const defaultSourceState = (): SourceState => ({
  status: 'idle',
  results: [],
});

const defaultState = (): SearchState => ({
  query: '',
  market: 'global',
  timestamp: '',
  sources: {
    reddit: defaultSourceState(),
    google: defaultSourceState(),
    telegram: defaultSourceState(),
  },
  isSearching: false,
  isDone: false,
});

export function useSearch() {
  const [state, setState] = useState<SearchState>(defaultState());
  const esRef = useRef<EventSource | null>(null);

  const search = useCallback((query: string, market: Market) => {
    // Close any existing connection
    if (esRef.current) {
      esRef.current.close();
    }

    setState({
      query,
      market,
      timestamp: new Date().toISOString(),
      sources: {
        reddit: { status: 'searching', results: [] },
        google: { status: 'searching', results: [] },
        telegram: { status: 'searching', results: [] },
      },
      isSearching: true,
      isDone: false,
    });

    const url = `/api/search?query=${encodeURIComponent(query)}&market=${encodeURIComponent(market)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('status', (e) => {
      const data = JSON.parse(e.data) as {
        source: 'reddit' | 'google' | 'telegram';
        status: 'searching' | 'done' | 'failed';
        count?: number;
        error?: string;
      };

      setState((prev) => ({
        ...prev,
        sources: {
          ...prev.sources,
          [data.source]: {
            ...prev.sources[data.source],
            status: data.status,
            count: data.count,
            error: data.error,
          },
        },
      }));
    });

    es.addEventListener('results', (e) => {
      const data = JSON.parse(e.data) as {
        source: 'reddit' | 'google' | 'telegram';
        results: SearchResult[];
      };

      setState((prev) => ({
        ...prev,
        sources: {
          ...prev.sources,
          [data.source]: {
            ...prev.sources[data.source],
            results: data.results,
          },
        },
      }));
    });

    es.addEventListener('done', (e) => {
      JSON.parse(e.data); // metadata — already handled via status/results events
      es.close();
      setState((prev) => ({
        ...prev,
        isSearching: false,
        isDone: true,
      }));
    });

    es.onerror = () => {
      es.close();
      setState((prev) => ({
        ...prev,
        isSearching: false,
        isDone: true,
        sources: {
          reddit:
            prev.sources.reddit.status === 'searching'
              ? { ...prev.sources.reddit, status: 'failed', error: 'Connection error' }
              : prev.sources.reddit,
          google:
            prev.sources.google.status === 'searching'
              ? { ...prev.sources.google, status: 'failed', error: 'Connection error' }
              : prev.sources.google,
          telegram:
            prev.sources.telegram.status === 'searching'
              ? { ...prev.sources.telegram, status: 'failed', error: 'Connection error' }
              : prev.sources.telegram,
        },
      }));
    };
  }, []);

  const exportJSON = useCallback(() => {
    const { query, market, timestamp, sources } = state;

    const allResults: SearchResult[] = [
      ...sources.reddit.results,
      ...sources.google.results,
      ...sources.telegram.results,
    ];

    const sourcesSearched = ['reddit', 'google', 'telegram'];
    const sourcesSucceeded = sourcesSearched.filter(
      (s) => sources[s as keyof typeof sources].status === 'done'
    );
    const sourcesFailed = sourcesSearched.filter(
      (s) => sources[s as keyof typeof sources].status === 'failed'
    );

    const payload = {
      metadata: {
        query,
        market,
        timestamp,
        sources_searched: sourcesSearched,
        sources_succeeded: sourcesSucceeded,
        sources_failed: sourcesFailed,
        total_results: allResults.length,
      },
      results: allResults,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = timestamp.split('T')[0];
    const slug = query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `${dateStr}_threat_search_${slug}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const totalResults =
    state.sources.reddit.results.length +
    state.sources.google.results.length +
    state.sources.telegram.results.length;

  return { state, search, exportJSON, totalResults };
}

// Type guards
export function isRedditResult(r: SearchResult): r is RedditResult {
  return r.source === 'reddit';
}
export function isGoogleResult(r: SearchResult): r is GoogleResult {
  return r.source === 'google';
}
export function isTelegramResult(r: SearchResult): r is TelegramResult {
  return r.source === 'telegram';
}
