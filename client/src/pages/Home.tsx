import { useState, useCallback } from 'react';
import { useSearch } from '@/hooks/useSearch';
import type { Market } from '../../../shared/searchTypes';
import { SearchBar } from '@/components/SearchBar';
import { SourceProgress } from '@/components/SourceProgress';
import { ResultTabs } from '@/components/ResultTabs';
import { SynthesisView } from '@/components/SynthesisView';
import { Button } from '@/components/ui/button';
import { Download, Shield, Terminal, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const { state, search } = useSearch();
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<Market>('global');

  const handleSearch = useCallback(() => {
    if (!query.trim()) {
      toast.error('Enter a search query');
      return;
    }
    search(query.trim(), market);
  }, [query, market, search]);

  const handleExport = useCallback(() => {
    if (!state.exportData) return;
    const blob = new Blob([JSON.stringify(state.exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `watson-report-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  }, [state.exportData]);

  const totalResults =
    state.redditResults.length +
    state.googleResults.length +
    state.facebookResults.length +
    state.telegramResults.length;

  const hasResults = totalResults > 0;
  const isDone = !state.isSearching && hasResults;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-foreground">
              WAT<span className="text-primary">SON</span>
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground border border-border/50 rounded px-1.5 py-0.5">
              Sherlock's Field Researcher
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reddit · Google · Facebook · Telegram</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-border/30 bg-gradient-to-b from-card/30 to-transparent">
        <div className="container py-10 md:py-14">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 tracking-tight">
              Watson
            </h1>
            <p className="text-sm text-muted-foreground">
              Sherlock's field researcher. Enter a query — Watson expands it, searches 4 sources in parallel, and produces evidence-grade findings with reliability ratings.
            </p>
          </div>
          <SearchBar
            query={query}
            market={market}
            isSearching={state.isSearching}
            onQueryChange={setQuery}
            onMarketChange={setMarket}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="container flex-1 py-6">
        {/* Expanded queries */}
        {state.expandedQueries.length > 0 && (
          <div className="rounded-lg border border-border/50 bg-card/40 p-3 mb-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
              Searching for:
            </p>
            <div className="flex flex-wrap gap-2">
              {state.expandedQueries.map((q, i) => (
                <span
                  key={i}
                  className="text-xs bg-muted/50 text-muted-foreground border border-border/50 rounded-full px-2.5 py-1"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source progress cards */}
        {(state.isSearching || hasResults) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <SourceProgress source="reddit" icon="🟠" label="Reddit" state={state.sources.reddit} />
            <SourceProgress source="google" icon="🔵" label="Google" state={state.sources.google} />
            <SourceProgress source="facebook" icon="📘" label="Facebook" state={state.sources.facebook} />
            <SourceProgress source="telegram" icon="✈️" label="Telegram" state={state.sources.telegram} />
          </div>
        )}

        {/* Synthesis progress */}
        {state.synthesisStatus === 'searching' && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-4 flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Synthesising results...
            </span>
          </div>
        )}

        {/* Export button */}
        {isDone && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-semibold">{totalResults}</span> results across 4 sources
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </Button>
          </div>
        )}

        {/* Synthesis view */}
        {state.synthesis && (
          <SynthesisView synthesis={state.synthesis} />
        )}

        {/* Results tabs */}
        {hasResults && (
          <ResultTabs
            redditResults={state.redditResults}
            googleResults={state.googleResults}
            facebookResults={state.facebookResults}
            telegramResults={state.telegramResults}
          />
        )}

        {/* Error state */}
        {state.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {/* Empty state */}
        {!state.isSearching && !hasResults && !state.error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter a query above — Watson expands it into search variants and searches Reddit, Google, Facebook Groups &amp; Telegram in parallel, producing evidence-grade results with source reliability ratings.
            </p>
            <p className="text-xs text-muted-foreground/50 mt-2">
              Try: "2fa bypass", "passkey phishing", "cookie stealer malware"
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-4">
        <div className="container text-center text-xs text-muted-foreground/50">
          Watson · Sherlock's field researcher · For security research purposes only
        </div>
      </footer>
    </div>
  );
}
