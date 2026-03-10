import { GoogleResult, SourceStatus } from '../types';
import './Table.css';

interface Props {
  results: GoogleResult[];
  status: SourceStatus;
}

export default function GoogleTable({ results, status }: Props) {
  if (status === 'searching') {
    return <div className="table-loading">Searching Google…</div>;
  }

  if (status === 'failed') {
    return <div className="table-error">Google search failed. Check network connectivity.</div>;
  }

  if (results.length === 0) {
    return <div className="table-empty">No Google results found.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="result-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Domain</th>
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
              </td>
              <td className="col-domain">
                <span className="domain-badge">{r.source_domain}</span>
              </td>
              <td className="col-date">{r.date || '—'}</td>
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
