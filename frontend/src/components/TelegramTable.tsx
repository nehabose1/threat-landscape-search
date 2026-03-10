import { TelegramResult, SourceStatus } from '../types';
import './Table.css';

interface Props {
  results: TelegramResult[];
  status: SourceStatus;
  error?: string;
}

export default function TelegramTable({ results, status, error }: Props) {
  if (status === 'searching') {
    return <div className="table-loading">Searching Telegram…</div>;
  }

  if (status === 'failed') {
    return (
      <div className="table-warn">
        ⚠️ {error || 'Telegram: limited results — search engines may be rate-limiting.'}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="table-warn">
        ⚠️ {error || 'Telegram: limited results — no public posts found for this query.'}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="result-table">
        <thead>
          <tr>
            <th>Channel</th>
            <th>Date</th>
            <th>Views</th>
            <th>Snippet</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td className="col-title">
                <a href={r.channel_url} target="_blank" rel="noopener noreferrer">
                  {r.channel_name}
                </a>
              </td>
              <td className="col-date">{r.date || '—'}</td>
              <td className="col-num">
                {r.views != null ? r.views.toLocaleString() : '—'}
              </td>
              <td className="col-snippet">
                <span className="snippet-text">{r.snippet || '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
