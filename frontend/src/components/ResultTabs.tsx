import { useState } from 'react';
import { SearchState } from '../types';
import RedditTable from './RedditTable';
import GoogleTable from './GoogleTable';
import TelegramTable from './TelegramTable';
import './ResultTabs.css';

interface Props {
  sources: SearchState['sources'];
}

type Tab = 'reddit' | 'google' | 'telegram';

export default function ResultTabs({ sources }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('reddit');

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'reddit', label: 'Reddit', icon: '🟠' },
    { key: 'google', label: 'Google', icon: '🔵' },
    { key: 'telegram', label: 'Telegram', icon: '✈️' },
  ];

  return (
    <div className="result-tabs">
      <div className="tab-list" role="tablist">
        {tabs.map((tab) => {
          const src = sources[tab.key];
          const count = src.results.length;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''} tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span className="tab-count">{count}</span>
              )}
              {src.status === 'searching' && (
                <span className="tab-spinner" />
              )}
              {src.status === 'failed' && (
                <span className="tab-failed">!</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="tab-panel">
        {activeTab === 'reddit' && (
          <RedditTable
            results={sources.reddit.results.filter((r) => r.source === 'reddit') as Parameters<typeof RedditTable>[0]['results']}
            status={sources.reddit.status}
          />
        )}
        {activeTab === 'google' && (
          <GoogleTable
            results={sources.google.results.filter((r) => r.source === 'google') as Parameters<typeof GoogleTable>[0]['results']}
            status={sources.google.status}
          />
        )}
        {activeTab === 'telegram' && (
          <TelegramTable
            results={sources.telegram.results.filter((r) => r.source === 'telegram') as Parameters<typeof TelegramTable>[0]['results']}
            status={sources.telegram.status}
            error={sources.telegram.error}
          />
        )}
      </div>
    </div>
  );
}
