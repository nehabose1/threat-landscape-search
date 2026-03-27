import { useState } from 'react';
import type {
  RedditResult,
  GoogleResult,
  FacebookResult,
  TelegramResult,
} from '../../../shared/searchTypes';
import { cn } from '@/lib/utils';
import { ExternalLink, MessageSquare, ArrowUp, Eye } from 'lucide-react';

type Props = {
  redditResults: RedditResult[];
  googleResults: GoogleResult[];
  facebookResults: FacebookResult[];
  telegramResults: TelegramResult[];
};

type Tab = 'reddit' | 'google' | 'facebook' | 'telegram';

export function ResultTabs({ redditResults, googleResults, facebookResults, telegramResults }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('reddit');

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: 'reddit', label: 'Reddit', icon: '🟠', count: redditResults.length },
    { id: 'google', label: 'Google', icon: '🔵', count: googleResults.length },
    { id: 'facebook', label: 'Facebook', icon: '📘', count: facebookResults.length },
    { id: 'telegram', label: 'Telegram', icon: '✈️', count: telegramResults.length },
  ];

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border/50 bg-card/80">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-card'
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span
              className={cn(
                'ml-1 rounded-full px-1.5 py-0.5 text-xs font-mono',
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="overflow-auto max-h-[60vh]">
        {activeTab === 'reddit' && <RedditTable results={redditResults} />}
        {activeTab === 'google' && <GoogleTable results={googleResults} />}
        {activeTab === 'facebook' && <FacebookTable results={facebookResults} />}
        {activeTab === 'telegram' && <TelegramTable results={telegramResults} />}
      </div>
    </div>
  );
}

/* ─── Reddit Table ─────────────────────────────────────────────────── */
function RedditTable({ results }: { results: RedditResult[] }) {
  if (!results.length)
    return <EmptyState message="No Reddit results found." />;

  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <tr>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider w-full">Title</th>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Subreddit</th>
          <th className="text-right px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Score</th>
          <th className="text-right px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Comments</th>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Date</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => (
          <tr
            key={r.url + i}
            className="border-b border-border/20 hover:bg-primary/5 transition-colors group"
          >
            <td className="px-4 py-2.5 max-w-0">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors font-medium line-clamp-1 flex items-start gap-1.5"
              >
                <span className="flex-1 line-clamp-1">{r.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 mt-0.5" />
              </a>
              {r.snippet && (
                <p className="text-muted-foreground mt-0.5 line-clamp-1">{r.snippet}</p>
              )}
              {r.external_url && (
                <a
                  href={r.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/70 hover:text-primary text-xs mt-0.5 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {new URL(r.external_url).hostname.replace('www.', '')}
                </a>
              )}
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">
              <span className="text-orange-400/80 font-mono">r/{r.subreddit}</span>
            </td>
            <td className="px-4 py-2.5 text-right whitespace-nowrap">
              <span className="flex items-center justify-end gap-1 text-muted-foreground">
                <ArrowUp className="w-3 h-3" />
                {r.score.toLocaleString()}
              </span>
            </td>
            <td className="px-4 py-2.5 text-right whitespace-nowrap">
              <span className="flex items-center justify-end gap-1 text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                {r.num_comments.toLocaleString()}
              </span>
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground font-mono">
              {r.date || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─── Google Table ─────────────────────────────────────────────────── */
function GoogleTable({ results }: { results: GoogleResult[] }) {
  if (!results.length)
    return <EmptyState message="No Google results found." />;

  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <tr>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider w-full">Title & Snippet</th>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Domain</th>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Date</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => (
          <tr
            key={r.url + i}
            className="border-b border-border/20 hover:bg-primary/5 transition-colors group"
          >
            <td className="px-4 py-2.5 max-w-0">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors font-medium flex items-start gap-1.5"
              >
                <span className="flex-1 line-clamp-1">{r.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 mt-0.5" />
              </a>
              {r.snippet && (
                <p className="text-muted-foreground mt-0.5 line-clamp-2">{r.snippet}</p>
              )}
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">
              <span className="text-blue-400/80 font-mono">{r.domain}</span>
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground font-mono">
              {r.date || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─── Facebook Table ──────────────────────────────────────────────── */
function FacebookTable({ results }: { results: FacebookResult[] }) {
  if (!results.length)
    return <EmptyState message="No Facebook results found." />;

  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <tr>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider w-full">Title & Snippet</th>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Group</th>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Date</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => (
          <tr key={r.url + i} className="border-b border-border/20 hover:bg-primary/5 transition-colors group">
            <td className="px-4 py-2.5 max-w-0">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors font-medium flex items-start gap-1.5">
                <span className="flex-1 line-clamp-1">{r.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 mt-0.5" />
              </a>
              {r.snippet && <p className="text-muted-foreground mt-0.5 line-clamp-2">{r.snippet}</p>}
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap"><span className="text-blue-600/80 font-mono">{r.group_name}</span></td>
            <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground font-mono">{r.date || '\u2014'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─── Telegram Table ───────────────────────────────────────────────── */
function TelegramTable({ results }: { results: TelegramResult[] }) {
  if (!results.length)
    return <EmptyState message="No Telegram channels found." />;

  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <tr>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider w-full">Channel & Description</th>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">URL</th>
          <th className="text-right px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Views</th>
          <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Date</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => (
          <tr
            key={r.channel_url + i}
            className="border-b border-border/20 hover:bg-primary/5 transition-colors group"
          >
            <td className="px-4 py-2.5 max-w-0">
              <a
                href={r.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors font-medium flex items-start gap-1.5"
              >
                <span className="flex-1 line-clamp-1">{r.channel_name || r.channel_url}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 mt-0.5" />
              </a>
              {r.snippet && (
                <p className="text-muted-foreground mt-0.5 line-clamp-2">{r.snippet}</p>
              )}
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">
              <a
                href={r.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400/80 hover:text-sky-400 font-mono transition-colors"
              >
                {r.channel_url.replace('https://', '')}
              </a>
            </td>
            <td className="px-4 py-2.5 text-right whitespace-nowrap">
              {r.views != null ? (
                <span className="flex items-center justify-end gap-1 text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  {r.views.toLocaleString()}
                </span>
              ) : (
                <span className="text-muted-foreground/40">—</span>
              )}
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground font-mono">
              {r.date || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────── */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
