import { useCallback } from 'react';
import type { SynthesisReport, SynthesisItem } from '../../../shared/searchTypes';
import { ExternalLink, AlertTriangle, Info, Copy, Check, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  synthesis: SynthesisReport;
};

/** Parse **bold** markers into React elements */
function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function RatingBadge({ rating }: { rating: number }) {
  const colors: Record<number, string> = {
    5: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
    4: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    3: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  };
  return (
    <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${colors[rating] || colors[3]}`}>
      {rating}/5
    </span>
  );
}

function SourceTable({ items }: { items: SynthesisItem[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border/40">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] w-[200px]">Source</th>
            <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">What they found</th>
            <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] w-[220px]">Key finding</th>
            <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] w-[160px]">Credibility</th>
            <th className="text-center py-2.5 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] w-[50px]">Trust</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, j) => (
            <tr key={j} className="border-t border-border/20 hover:bg-muted/20 transition-colors">
              <td className="py-2.5 px-3 align-top">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-start gap-1 leading-snug"
                >
                  <span className="line-clamp-2">{item.title}</span>
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 mt-0.5 opacity-60" />
                </a>
                <span className="block mt-1 text-[10px] uppercase font-mono text-muted-foreground/60 tracking-wider">
                  {item.source}
                </span>
              </td>
              <td className="py-2.5 px-3 align-top text-foreground/80 leading-relaxed">
                {item.detail}
              </td>
              <td className="py-2.5 px-3 align-top">
                {item.key_quote ? (
                  <span className="text-amber-300/80 leading-relaxed text-[11px] block">
                    &ldquo;{item.key_quote}&rdquo;
                  </span>
                ) : (
                  <span className="text-muted-foreground/40">&mdash;</span>
                )}
              </td>
              <td className="py-2.5 px-3 align-top text-muted-foreground/70 leading-relaxed">
                {item.trust_justification || '—'}
              </td>
              <td className="py-2.5 px-3 align-top text-center">
                <RatingBadge rating={item.reliability_rating} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [getText]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary border border-border/50 rounded px-2.5 py-1.5 hover:bg-primary/5 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy report'}
    </button>
  );
}

function synthesisToText(synthesis: SynthesisReport): string {
  let text = `WATSON'S REPORT\n${'='.repeat(50)}\n\n`;
  text += `${synthesis.overview}\n\n`;

  if (synthesis.key_insights && synthesis.key_insights.length > 0) {
    text += `--- KEY INSIGHTS ---\n`;
    for (let i = 0; i < synthesis.key_insights.length; i++) {
      text += `  ${i + 1}. ${synthesis.key_insights[i]}\n`;
    }
    text += '\n';
  }

  for (const cat of synthesis.categories) {
    text += `--- ${cat.name.toUpperCase()} ---\n`;
    text += `${cat.summary}\n\n`;
    for (const item of cat.items) {
      text += `  [${item.reliability_rating}/5] ${item.title}\n`;
      text += `  ${item.url}\n`;
      text += `  ${item.detail}\n`;
      if (item.key_quote) text += `  Key finding: "${item.key_quote}"\n`;
      if (item.trust_justification) text += `  Credibility: ${item.trust_justification}\n`;
      text += '\n';
    }
  }

  if (synthesis.confidence_notes && synthesis.confidence_notes.length > 0) {
    text += `--- CONFIDENCE NOTES ---\n`;
    for (const note of synthesis.confidence_notes) {
      text += `  - ${note}\n`;
    }
    text += '\n';
  }

  if (synthesis.gaps && synthesis.gaps.length > 0) {
    text += `--- GAPS & MANUAL FOLLOW-UP ---\n`;
    for (const gap of synthesis.gaps) {
      text += `  - ${gap}\n`;
    }
  }

  return text;
}

export function SynthesisView({ synthesis }: Props) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/80 mb-6 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/40 bg-muted/30 px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            Watson&apos;s Report
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Threat intelligence research — diligent, thorough, flags uncertainty
          </p>
        </div>
        <CopyButton getText={() => synthesisToText(synthesis)} />
      </div>

      {/* Overview */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="border-l-2 border-l-primary pl-4 py-1">
          <p className="text-sm text-foreground/90 leading-relaxed">
            {synthesis.overview}
          </p>
        </div>
      </div>

      {/* Key Insights */}
      {synthesis.key_insights && synthesis.key_insights.length > 0 && (
        <div className="px-5 py-4 border-b border-border/30 bg-primary/[0.03]">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            Key Insights
          </h3>
          <ol className="space-y-3">
            {synthesis.key_insights.map((insight, i) => (
              <li key={i} className="text-[13px] text-foreground/85 leading-relaxed flex items-start gap-3">
                <span className="text-primary font-bold text-xs mt-0.5 min-w-[18px] text-right">{i + 1}.</span>
                <span>{renderBold(insight)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Source tables by type */}
      {synthesis.categories.map((cat, i) => (
        <div key={i} className="px-5 py-4 border-b border-border/20 last:border-b-0">
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
        <div className="px-5 py-4 bg-blue-950/20 border-t border-blue-900/30">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            Confidence Notes
          </h3>
          <ul className="space-y-1.5">
            {synthesis.confidence_notes.map((note, i) => (
              <li key={i} className="text-xs text-blue-300/70 flex items-start gap-2 leading-relaxed">
                <span className="text-blue-400 mt-0.5">&bull;</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {synthesis.gaps && synthesis.gaps.length > 0 && (
        <div className="px-5 py-4 bg-amber-950/20 border-t border-amber-900/30">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Gaps & Manual Follow-up
          </h3>
          <ul className="space-y-1.5">
            {synthesis.gaps.map((gap, i) => (
              <li key={i} className="text-xs text-amber-300/70 flex items-start gap-2 leading-relaxed">
                <span className="text-amber-400 mt-0.5">&bull;</span>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
