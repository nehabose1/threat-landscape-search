import { RedditResult, SourceStatus } from '../types';
import './Table.css';

interface Props {
  results: RedditResult[];
  status: SourceStatus;
}

export default function RedditTable({ results, status }: Props) {
  if (status === 'searching') {
    return <div className="table-loading">Searching Reddit…</div>;
  }

  if (status === 'failed') {
    return <div className="table-error">Reddit search failed. Check network connectivity.</div>;
  }

  if (results.length === 0) {
    return <div className="table-empty">No Reddit results found.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="result-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Subreddit</th>
            <th>Score</th>
            <th>Comments</th>
            <th>Date</th>
            <th>Snippet</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td className="col-title">
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title}
                </a>
                {r.external_url && (
                  <a
                    href={r.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                    title="External link"
                  >
                    ↗
                  </a>
                )}
              </td>
              <td className="col-sub">
                <span className="subreddit-badge">r/{r.subreddit}</span>
              </td>
              <td className="col-num">
                <span className="score">{r.score.toLocaleString()}</span>
              </td>
              <td className="col-num">{r.num_comments.toLocaleString()}</td>
              <td className="col-date">{r.date}</td>
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
