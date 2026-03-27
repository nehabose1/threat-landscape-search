import { useCallback, KeyboardEvent } from 'react';
import type { Market } from '../../../shared/searchTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Globe, Flag } from 'lucide-react';
import { SourceInfoPopover } from '@/components/SourceInfoPopover';

const EXAMPLE_CHIPS = [
  'passkey bypass phishing kit 2025 2026',
  'evilginx facebook phishlet session hijacking',
  'FIDO2 downgrade attack WebAuthn',
  'sell hacked facebook accounts telegram pricing',
  'MFA bypass tool pricing telegram subscription',
];

type Props = {
  query: string;
  market: Market;
  isSearching: boolean;
  onQueryChange: (q: string) => void;
  onMarketChange: (m: Market) => void;
  onSearch: () => void;
};

export function SearchBar({
  query,
  market,
  isSearching,
  onQueryChange,
  onMarketChange,
  onSearch,
}: Props) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !isSearching) onSearch();
    },
    [isSearching, onSearch]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Search input row */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search threat intelligence…"
            className="pl-9 bg-card border-border/60 focus:border-primary/60 text-sm h-10 font-mono placeholder:text-muted-foreground/50"
            disabled={isSearching}
          />
        </div>

        {/* Market selector */}
        <Select
          value={market}
          onValueChange={(v) => onMarketChange(v as Market)}
          disabled={isSearching}
        >
          <SelectTrigger className="w-36 bg-card border-border/60 text-sm h-10 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="global">
              <span className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Global
              </span>
            </SelectItem>
            <SelectItem value="vietnam">
              <span className="flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-red-400" />
                Vietnam 🇻🇳
              </span>
            </SelectItem>
            <SelectItem value="brazil">
              <span className="flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-green-400" />
                Brazil 🇧🇷
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Info popover */}
        <SourceInfoPopover />

        {/* Search button */}
        <Button
          onClick={onSearch}
          disabled={isSearching || !query.trim()}
          className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm shrink-0"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Searching
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              onQueryChange(chip);
            }}
            disabled={isSearching}
            className="text-xs px-2.5 py-1 rounded-full border border-border/50 bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
