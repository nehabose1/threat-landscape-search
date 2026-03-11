import type { SynthesisReport } from '../../../shared/searchTypes';
import { ExternalLink, AlertTriangle } from 'lucide-react';

type Props = {
  synthesis: SynthesisReport;
};

const categoryIcons: Record<string, string> = {
  'Tools & Services': '🔧',
  'Pricing Intel': '💰',
  'TTPs & Tutorials': '📖',
  'Actor Profiles': '👤',
};

export function SynthesisView({ synthesis }: Props) {
  return (
    <div className="rounded-lg border border-primary/20 bg-card/60 mb-6 overflow-hidden">
      <div className="border-b border-border/50 bg-primary/5 px-4 py-3">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <span>🧠</span> Synthesis
        </h2>
      </div>

      {/* Overview */}
      <div className="px-4 py-3 border-b border-border/30 border-l-2 border-l-primary mx-4 mt-4 mb-4 bg-muted/30 rounded-r-md">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {synthesis.overview}
        </p>
      </div>

      {/* Categories */}
      {synthesis.categories.map((cat, i) => (
        <div key={i} className="px-4 py-3 border-b border-border/20 last:border-b-0">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-1.5">
            <span>{categoryIcons[cat.name] || '📌'}</span>
            {cat.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
            {cat.summary}
          </p>
          {cat.items.length > 0 && (
            <ul className="space-y-1.5">
              {cat.items.map((item, j) => (
                <li key={j} className="flex flex-wrap items-baseline gap-2 text-xs">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    {item.title}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] uppercase font-mono">
                    {item.source}
                  </span>
                  <span className="text-muted-foreground basis-full">
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

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
