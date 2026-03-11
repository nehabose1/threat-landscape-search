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

  const prompt = `You are a cybersecurity threat intelligence analyst. A researcher searched for "${query}" across Reddit, Google, Facebook Groups, and Telegram.

Here are the ${summaries.length} results found:

${summaries.join('\n')}

Synthesize these into a structured intelligence report. Return ONLY valid JSON with this exact structure:

{
  "overview": "2-3 sentence executive summary of what was found across all sources",
  "categories": [
    {
      "name": "Tools & Services",
      "summary": "1-2 sentence summary of tools/services found",
      "items": [{"title": "...", "url": "...", "source": "reddit|google|facebook|telegram", "detail": "Why this is relevant (1 sentence)"}]
    },
    {
      "name": "Pricing Intel",
      "summary": "...",
      "items": [...]
    },
    {
      "name": "TTPs & Tutorials",
      "summary": "...",
      "items": [...]
    },
    {
      "name": "Actor Profiles",
      "summary": "...",
      "items": [...]
    }
  ],
  "gaps": ["What wasn't found that a researcher should investigate manually (2-4 bullet points)"]
}

Rules:
- Only include categories that have actual matching results. Skip empty categories.
- Each item must reference a real result from the list above with its actual URL.
- Be concise — summaries should be 1-2 sentences max.
- gaps should flag what's missing: pricing data? specific tools? geographic coverage?
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
              }))
            : [],
        })
      ),
      gaps: Array.isArray(data.gaps) ? data.gaps.map(String) : [],
    };
  } catch (err) {
    console.error('Synthesis failed:', err);
    return {
      overview: `Found ${results.length} results for "${query}" but synthesis failed. Review raw results below.`,
      categories: [],
      gaps: ['Automated synthesis unavailable — review raw results manually.'],
    };
  }
}
