import { Market } from '../types';
import './SearchBar.css';

interface Props {
  query: string;
  market: Market;
  isSearching: boolean;
  onQueryChange: (q: string) => void;
  onMarketChange: (m: Market) => void;
  onSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export default function SearchBar({
  query,
  market,
  isSearching,
  onQueryChange,
  onMarketChange,
  onSearch,
  onKeyDown,
}: Props) {
  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder='Search threat intelligence, e.g. "passkey bypass tools pricing"'
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isSearching}
          autoFocus
        />
      </div>
      <select
        className="market-select"
        value={market}
        onChange={(e) => onMarketChange(e.target.value as Market)}
        disabled={isSearching}
      >
        <option value="global">🌐 Global</option>
        <option value="vietnam">🇻🇳 Vietnam</option>
        <option value="brazil">🇧🇷 Brazil</option>
      </select>
      <button
        className="search-btn"
        onClick={onSearch}
        disabled={isSearching || !query.trim()}
      >
        {isSearching ? (
          <>
            <span className="spinner" />
            Searching…
          </>
        ) : (
          'Search'
        )}
      </button>
    </div>
  );
}
