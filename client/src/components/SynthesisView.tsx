import type { SynthesisReport, SynthesisItem } from '../../../shared/searchTypes';
import { ExternalLink, AlertTriangle, Info } from 'lucide-react';

type Props = {
  synthesis: SynthesisReport;
};

function RatingBadge({ rating }: { rating: number }) {
  const colors: Record<number, string> = {
    5: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    4: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    3: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    2: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    1: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${colors[rating] || colors[3]}`}>
      {rating}/5
    </span>
  );
}

function SourceTable({ items }: { items: SynthesisItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-2 pr-2 text-muted-foreground font-semibold uppercase tracking-wider w-[180px]">Source</th>
            <th className="text-left py-2 pr-2 text-muted-foreground font-semibold uppercase tracking-wider">What they found</th>
            <th className="text-left py-2 pr-2 text-muted-foreground font-semibold uppercase tracking-wider w-[200px]">Key quote</th>
            <th className="text-left py-2 pr-2 text-muted-foreground font-semibold uppercase tracking-wider w-[180px]">Why trust this?</th>
            <th className="text-center py-2 text-muted-foreground font-semibold uppercase tracking-wider w-[50px]">Rating</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, j) => (
            <tr key={j} className="border-b border-border/20 last:border-b-0">
              <td className="py-2 pr-2 align-top">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  {item.title}
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                </a>
                <span className="block mt-0.5 bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] uppercase font-mono w-fit">
                  {item.source}
                </span>
              </td>
              <td className="py-2 pr-2 align-top text-muted-foreground leading-relaxed">
                {item.detail}
              </td>
              <td className="py-2 pr-2 align-top text-muted-foreground italic leading-relaxed">
                {item.key_quote ? `"${item.key_quote}"` : '—'}
              </td>
              <td className="py-2 pr-2 align-top text-muted-foreground/80 leading-relaxed">
                {item.trust_justification || '—'}
              </td>
              <td className="py-2 align-top text-center">
                <RatingBadge rating={item.reliability_rating} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SynthesisView({ synthesis }: Props) {
  return (
    <div className="rounded-lg border border-primary/20 bg-card/60 mb-6 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/50 bg-primary/5 px-4 py-3">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <span>🔍</span> Watson's Report
        </h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Sherlock's field researcher — diligent, thorough, flags uncertainty
        </p>
      </div>

      {/* Overview */}
      <div className="px-4 py-3 border-b border-border/30 border-l-2 border-l-primary mx-4 mt-4 mb-4 bg-muted/30 rounded-r-md">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {synthesis.overview}
        </p>
      </div>

      {/* Source tables by type */}
      {synthesis.categories.map((cat, i) => (
        <div key={i} className="px-4 py-3 border-b border-border/20 last:border-b-0">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
            {cat.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {cat.summary}
          </p>
          {cat.items.length > 0 && <SourceTable items={cat.items} />}
        </div>
      ))}

      {/* Confidence Notes */}
      {synthesis.confidence_notes && synthesis.confidence_notes.length > 0 && (
        <div className="px-4 py-3 bg-blue-500/5 border-t border-blue-500/20">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            Confidence Notes
          </h3>
          <ul className="space-y-1">
            {synthesis.confidence_notes.map((note, i) => (
              <li key={i} className="text-xs text-blue-400/80 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {synthesis.gaps.length > 0 && (
        <div className="px-4 py-3 bg-yellow-500/5 border-t border-yellow-500/20">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
            Gaps &amp; Manual Follow-up
          </h3>
          <ul className="space-y-1">
            {synthesis.gaps.map((gap, i) => (
              <li key={i} className="text-xs text-yellow-500/80 flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
