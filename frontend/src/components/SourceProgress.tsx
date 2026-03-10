import { SearchState } from '../types';
import './SourceProgress.css';

interface Props {
  sources: SearchState['sources'];
}

const SOURCE_META = {
  reddit: { label: 'Reddit', icon: '🟠', color: 'var(--reddit)' },
  google: { label: 'Google', icon: '🔵', color: 'var(--google)' },
  telegram: { label: 'Telegram', icon: '✈️', color: 'var(--telegram)' },
};

export default function SourceProgress({ sources }: Props) {
  return (
    <div className="source-progress">
      {(Object.keys(sources) as Array<keyof typeof sources>).map((key) => {
        const src = sources[key];
        const meta = SOURCE_META[key];

        return (
          <div key={key} className={`source-card source-${src.status}`}>
            <div className="source-card-header">
              <span className="source-icon">{meta.icon}</span>
              <span className="source-label">{meta.label}</span>
              <span className={`source-badge badge-${src.status}`}>
                {src.status === 'searching' && (
                  <>
                    <span className="badge-spinner" />
                    Searching
                  </>
                )}
                {src.status === 'done' && (
                  <>✓ {src.count ?? 0} results</>
                )}
                {src.status === 'failed' && <>✗ Failed</>}
                {src.status === 'idle' && <>Idle</>}
              </span>
            </div>
            {src.error && src.status !== 'failed' && (
              <div className="source-note">{src.error}</div>
            )}
            {src.status === 'failed' && src.error && (
              <div className="source-error">{src.error}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
