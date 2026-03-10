import { useState } from 'react';
import { Market } from './types';
import { useSearch } from './useSearch';
import SearchBar from './components/SearchBar';
import SourceProgress from './components/SourceProgress';
import ResultTabs from './components/ResultTabs';
import './App.css';

export default function App() {
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<Market>('global');
  const { state, search, exportJSON, totalResults } = useSearch();

  const handleSearch = () => {
    if (!query.trim()) return;
    search(query.trim(), market);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const hasResults = totalResults > 0;
  const showProgress = state.isSearching || state.isDone;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🔍</span>
            <span className="logo-text">Threat Landscape Search</span>
          </div>
          <p className="header-subtitle">
            OSINT desk research tool for cybersecurity threat intelligence
          </p>
        </div>
      </header>

      <main className="app-main">
        <SearchBar
          query={query}
          market={market}
          isSearching={state.isSearching}
          onQueryChange={setQuery}
          onMarketChange={setMarket}
          onSearch={handleSearch}
          onKeyDown={handleKeyDown}
        />

        {showProgress && (
          <SourceProgress sources={state.sources} />
        )}

        {showProgress && hasResults && (
          <div className="results-header">
            <span className="results-count">
              {totalResults} result{totalResults !== 1 ? 's' : ''} found
              {state.query && (
                <> for <em>"{state.query}"</em></>
              )}
              {state.market !== 'global' && (
                <span className="market-badge">{state.market}</span>
              )}
            </span>
            <button
              className="btn btn-export"
              onClick={exportJSON}
              disabled={!hasResults}
            >
              ↓ Export JSON
            </button>
          </div>
        )}

        {showProgress && (
          <ResultTabs sources={state.sources} />
        )}

        {!showProgress && (
          <div className="empty-state">
            <div className="empty-icon">🛡️</div>
            <h2>Search for threat intelligence</h2>
            <p>
              Enter a query above to search Reddit, Google, and Telegram for
              cybersecurity threat data. Select a market to include
              localised search terms.
            </p>
            <div className="example-queries">
              <span className="example-label">Try:</span>
              {[
                'passkey bypass tools pricing',
                'evilginx phishlet 2025',
                'cookie stealer malware',
                'facebook account takeover service',
              ].map((q) => (
                <button
                  key={q}
                  className="example-chip"
                  onClick={() => {
                    setQuery(q);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>Threat Landscape Search — OSINT research tool</span>
      </footer>
    </div>
  );
}
