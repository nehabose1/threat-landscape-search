import type { SearchResult, SynthesisReport } from '../../shared/searchTypes';
import { invokeLLM } from '../_core/llm';

export async function synthesizeResults(
  query: string,
  results: SearchResult[]
): Promise<SynthesisReport> {
  if (results.length === 0) {
    return {
      overview: 'No results found for this query.',
      categories: [],
      gaps: ['No results returned from any source. Try broadening your search terms.'],
      confidence_notes: [],
    };
  }

  // Build compact summaries for the LLM (cap at 60 results)
  const summaries = results.slice(0, 60).map((r) => {
    if (r.source === 'reddit') {
      return `[Reddit] "${r.title}" (r/${r.subreddit}, score:${r.score}) — ${r.snippet.slice(0, 150)}`;
    } else if (r.source === 'google') {
      return `[Google] "${r.title}" (${r.domain}) — ${r.snippet.slice(0, 150)}`;
    } else if (r.source === 'facebook') {
      return `[Facebook] "${r.title}" (${r.group_name}) — ${r.snippet.slice(0, 150)}`;
    } else {
      return `[Telegram] "${r.channel_name}" (${r.channel_url}) — ${r.snippet.slice(0, 150)}`;
    }
  });

  const prompt = `You are Watson — a diligent, thorough field researcher supporting a UX researcher investigating cybersecurity threats. You are methodical and always flag uncertainty. A researcher searched for "${query}" across Reddit, Google, Facebook Groups, and Telegram.

Here are the ${summaries.length} results found:

${summaries.join('\n')}

Synthesize these into a structured evidence-grade research report. Return ONLY valid JSON with this exact structure:

{
  "overview": "2-3 sentence executive summary in plain English. Describe what was found, how immediate the risks are, and what's missing. Be conservative — only state what the evidence supports. Bold the single most important finding using **double asterisks**.",
  "categories": [
    {
      "name": "Security Vendor & Research Reports",
      "summary": "1-2 sentence summary of vendor/research findings",
      "items": [{
        "title": "Short descriptive title",
        "url": "actual URL from the results",
        "source": "reddit|google|facebook|telegram",
        "detail": "What this source found, in plain English (1-2 sentences). Use format: 'This source describes how bad actors could...' or 'Documents a phishing service that...'",
        "key_quote": "Direct quote or specific data point from the source. Use exact numbers, prices, or phrases where available.",
        "trust_justification": "One sentence explaining why this source is credible. E.g. 'Tier-1 security vendor with published IOCs' or 'Practitioner report with first-hand experience'",
        "reliability_rating": 4
      }]
    },
    {
      "name": "Open-Source Tools (GitHub)",
      "summary": "...",
      "items": [...]
    },
    {
      "name": "Reddit Community Discussions",
      "summary": "...",
      "items": [...]
    },
    {
      "name": "Telegram Channel Documentation",
      "summary": "...",
      "items": [...]
    },
    {
      "name": "Facebook Group Activity",
      "summary": "...",
      "items": [...]
    }
  ],
  "gaps": ["What wasn't found that needs manual investigation (2-4 bullet points)"],
  "confidence_notes": ["Caveats about the evidence quality, coverage gaps, or areas where Watson is uncertain (2-3 bullet points)"]
}

Reliability rating scale:
- 5/5: Peer-reviewed, tier-1 vendor, major security conference, law enforcement action
- 4/5: Established vendor with published technical analysis, independently verifiable
- 3/5: Active GitHub project (100-1K stars), trade press, verified practitioner report
- 2/5: Anecdotal discussion, vendor blog with promotional angle, unverified claims
- 1/5: Anonymous post, no citations, unverifiable

Rules:
- Group results by source TYPE (vendor reports, GitHub tools, Reddit, Telegram, Facebook), not by topic category.
- Only include source type groups that have actual matching results. Skip empty groups.
- Each item must reference a real result from the list above with its actual URL.
- Plain English first — describe what happens in everyday language, then give technical terms in parentheses.
- Don't over-infer. Say what each source actually claims, not what you think it means.
- Every item needs a key_quote (direct quote or specific data point) and trust_justification.
- confidence_notes should flag: which source types had thin coverage, whether claims are corroborated across sources, any results that seem unreliable.
- Return valid JSON only, no markdown wrapping.`;

  try {
    const response = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const rawContent = response.choices?.[0]?.message?.content ?? '';
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(content);

    // Handle both direct object and wrapped formats
    const data = parsed.results ? parsed : parsed;

    return {
      overview: String(data.overview || ''),
      categories: (data.categories || []).map(
        (c: Record<string, unknown>) => ({
          name: String(c.name || ''),
          summary: String(c.summary || ''),
          items: Array.isArray(c.items)
            ? c.items.map((item: Record<string, unknown>) => ({
                title: String(item.title || ''),
                url: String(item.url || ''),
                source: String(item.source || ''),
                detail: String(item.detail || ''),
                key_quote: String(item.key_quote || ''),
                trust_justification: String(item.trust_justification || ''),
                reliability_rating: Number(item.reliability_rating) || 3,
              }))
            : [],
        })
      ),
      gaps: Array.isArray(data.gaps) ? data.gaps.map(String) : [],
      confidence_notes: Array.isArray(data.confidence_notes) ? data.confidence_notes.map(String) : [],
    };
  } catch (err) {
    console.error('Synthesis failed:', err);
    return {
      overview: `Found ${results.length} results for "${query}" but synthesis failed. Review raw results below.`,
      categories: [],
      gaps: ['Automated synthesis unavailable — review raw results manually.'],
      confidence_notes: ['Synthesis failed — raw results may still contain useful intelligence.'],
    };
  }
}
