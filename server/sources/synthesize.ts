import type { SearchResult, SynthesisReport } from '../../shared/searchTypes';
import { invokeLLM } from '../_core/llm';

export async function synthesizeResults(
  query: string,
  results: SearchResult[]
): Promise<SynthesisReport> {
  if (results.length === 0) {
    return {
      overview: 'No results found for this query.',
      key_insights: [],
      categories: [],
      gaps: ['No results returned from any source. Try broadening your search terms.'],
      confidence_notes: [],
    };
  }

  // Build compact summaries WITH URLs so the LLM can reference them exactly
  const summaries = results.slice(0, 60).map((r, idx) => {
    if (r.source === 'reddit') {
      return `[${idx}][Reddit] "${r.title}" r/${r.subreddit} score:${r.score} URL:${r.url} — ${r.snippet.slice(0, 200)}`;
    } else if (r.source === 'google') {
      return `[${idx}][Google] "${r.title}" ${r.domain} URL:${r.url} — ${r.snippet.slice(0, 200)}`;
    } else if (r.source === 'facebook') {
      return `[${idx}][Facebook] "${r.title}" ${r.group_name} URL:${r.url} — ${r.snippet.slice(0, 200)}`;
    } else if (r.source === 'youtube') {
      const transcriptNote = r.transcript_excerpt
        ? ` TRANSCRIPT: ${r.transcript_excerpt.slice(0, 400)}`
        : '';
      return `[${idx}][YouTube] "${r.title}" channel:${r.channel} duration:${r.duration} URL:${r.url} — ${r.snippet.slice(0, 200)}${transcriptNote}`;
    } else {
      return `[${idx}][Telegram] "${r.channel_name}" URL:${r.channel_url} — ${r.snippet.slice(0, 200)}`;
    }
  });

  // Extract search keywords for Reddit relevance filtering
  const searchKeywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const prompt = `You are Watson — a diligent, thorough field researcher supporting a UX researcher investigating cybersecurity threats. You are methodical and always flag uncertainty. A researcher searched for "${query}" across Reddit, Google, Facebook Groups, Telegram, and YouTube.

Here are the ${summaries.length} results found (each prefixed with an index number and URL):

${summaries.join('\n')}

Synthesize these into a structured evidence-grade research report. Return ONLY valid JSON with this exact structure:

{
  "overview": "2-3 sentence executive summary in plain English. What did we find? How immediate are the risks? What's missing?",
  "key_insights": [
    "**Technical concept in bold** — plain English explanation of what was found, referencing specific evidence. E.g.: '**Phishing kits (AiTM/adversary-in-the-middle)** are the most documented bypass method — 5 vendor reports confirm attackers relay login sessions in real-time, defeating SMS and TOTP-based 2FA'",
    "..."
  ],
  "categories": [
    {
      "name": "Category Name",
      "summary": "1-2 sentence summary of what this category of sources reveals",
      "items": [{
        "title": "Short descriptive title",
        "url": "MUST be copied exactly from the URL: field in the results above — never fabricate or guess a URL",
        "source": "reddit|google|facebook|telegram",
        "detail": "2-3 sentences. What does this source specifically claim or document? Name the technique, tool, or service. Include any numbers, dates, or named actors. Do NOT just rephrase the article title.",
        "key_quote": "A specific data point from the snippet: a price, a date, a tool name, a statistic, an actor handle. NOT the article title or meta description.",
        "trust_justification": "One sentence: why trust this source?",
        "reliability_rating": 4
      }]
    }
  ],
  "gaps": ["What wasn't found — 2-4 specific areas needing manual investigation"],
  "confidence_notes": ["Caveats about evidence quality, coverage, or uncertainty — 2-3 points"]
}

KEY INSIGHTS RULES:
- Exactly 5 insights, ranked by importance
- Each insight starts with the key technical concept in **bold** (include the technical term in parentheses)
- Follow with a plain English explanation a non-technical reader can understand
- Reference how many sources support the claim, or cite specific data points
- Insights should synthesise ACROSS sources, not just summarise one source each
- If fewer than 5 distinct insights exist, include what you have and note thin coverage

CATEGORY RULES:
- Group by source TYPE: Security Vendor & Research Reports, Open-Source Tools (GitHub), Reddit Community Discussions, Telegram Channel Documentation, Facebook Group Activity, YouTube Tutorials & Demonstrations
- Only include categories that have matching results. Skip empty ones.
- Maximum 8 items per category. Rank by reliability + relevance, keep the best.

URL RULES — CRITICAL:
- Every item's "url" field MUST be copied character-for-character from the "URL:" field in the numbered results above
- NEVER construct, guess, or modify a URL. If you cannot find the exact URL in the results, omit the item entirely
- Cross-check: the domain in your url must match the domain shown in the result entry

DETAIL RULES:
- Do NOT just rephrase the article title. Say what the source specifically claims.
- Name specific techniques, tools, services, or actors mentioned in the snippet
- If the snippet mentions a price, date, tool name, or actor — include it
- Use plain English first, then give the technical term: "attackers relay login sessions in real-time (adversary-in-the-middle / AiTM)"

KEY QUOTE RULES:
- Must be a specific, concrete data point — a price, a statistic, a tool name, an actor, a date
- NOT the article title, NOT a generic description, NOT the first sentence of the snippet
- If no specific data point exists in the snippet, use the most informative technical claim

QUALITY FILTERS:
1. REDDIT FILTERING: Only include Reddit posts where the title or snippet directly mentions at least 2 of these search keywords: [${searchKeywords.join(', ')}]. Exclude generic cybersecurity news, career advice, and unrelated discussions. Maximum 5 Reddit items.
2. DROP LOW-VALUE: Do NOT include sources you would rate 1/5 or 2/5. Quality over quantity.
3. DEDUPLICATE: If two sources report the same finding, keep only the higher-rated one. Mention corroboration in the detail field.

Reliability rating scale:
- 5/5: Peer-reviewed, tier-1 vendor, major security conference, law enforcement
- 4/5: Established vendor with published analysis, independently verifiable
- 3/5: Active GitHub project (100+ stars), trade press, verified practitioner
- 2/5: Anecdotal discussion, promotional vendor blog — EXCLUDE
- 1/5: Anonymous, no citations — EXCLUDE

Return valid JSON only, no markdown wrapping.`;

  try {
    const response = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const rawContent = response.choices?.[0]?.message?.content ?? '';
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(content);

    return {
      overview: String(parsed.overview || ''),
      key_insights: Array.isArray(parsed.key_insights)
        ? parsed.key_insights.map(String)
        : [],
      categories: (parsed.categories || []).map(
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
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
      confidence_notes: Array.isArray(parsed.confidence_notes) ? parsed.confidence_notes.map(String) : [],
    };
  } catch (err) {
    console.error('Synthesis failed:', err);
    return {
      overview: `Found ${results.length} results for "${query}" but synthesis failed. Review raw results below.`,
      key_insights: [],
      categories: [],
      gaps: ['Automated synthesis unavailable — review raw results manually.'],
      confidence_notes: ['Synthesis failed — raw results may still contain useful intelligence.'],
    };
  }
}
