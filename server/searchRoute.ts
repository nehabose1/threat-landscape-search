import type { Express } from 'express';
import { searchReddit } from './sources/reddit';
import { searchGoogle } from './sources/google';
import { searchFacebook } from './sources/facebook';
import { searchTelegram } from './sources/telegram';
import { synthesizeResults } from './sources/synthesize';
import { expandQuery } from './marketKeywords';
import type { Market, SearchResult, SearchMetadata } from '../shared/searchTypes';

/**
 * Registers GET /api/search as an SSE endpoint.
 * Streams expanded queries, status events per source, synthesis, then a final "done" event.
 *
 * Query params:
 *   q      — search query (required)
 *   market — "global" | "vietnam" | "brazil" (default: "global")
 */
export function registerSearchRoute(app: Express) {
  app.get('/api/search', async (req, res) => {
    const query = String(req.query.q ?? '').trim();
    const market = (String(req.query.market ?? 'global')) as Market;

    if (!query) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Step 1: Expand the query
    const expandedQueries = expandQuery(query, market);
    send('queries', { expanded: expandedQueries });

    // Announce all sources as "searching"
    send('status', { source: 'reddit', status: 'searching' });
    send('status', { source: 'google', status: 'searching' });
    send('status', { source: 'facebook', status: 'searching' });
    send('status', { source: 'telegram', status: 'searching' });

    const succeeded: string[] = [];
    const failed: string[] = [];
    const allResults: SearchResult[] = [];

    // Step 2: Run all four sources in parallel
    const [redditSettled, googleSettled, facebookSettled, telegramSettled] =
      await Promise.allSettled([
        searchReddit(query, market),
        searchGoogle(expandedQueries),
        searchFacebook(expandedQueries),
        searchTelegram(query, market),
      ]);

    // Reddit
    if (redditSettled.status === 'fulfilled') {
      const r = redditSettled.value;
      allResults.push(...r);
      succeeded.push('reddit');
      send('status', { source: 'reddit', status: 'done', count: r.length });
      send('results', { source: 'reddit', results: r });
    } else {
      failed.push('reddit');
      send('status', { source: 'reddit', status: 'failed', error: String(redditSettled.reason) });
    }

    // Google
    if (googleSettled.status === 'fulfilled') {
      const r = googleSettled.value;
      allResults.push(...r);
      succeeded.push('google');
      send('status', { source: 'google', status: 'done', count: r.length });
      send('results', { source: 'google', results: r });
    } else {
      failed.push('google');
      send('status', { source: 'google', status: 'failed', error: String(googleSettled.reason) });
    }

    // Facebook
    if (facebookSettled.status === 'fulfilled') {
      const r = facebookSettled.value;
      allResults.push(...r);
      succeeded.push('facebook');
      send('status', { source: 'facebook', status: 'done', count: r.length });
      send('results', { source: 'facebook', results: r });
    } else {
      failed.push('facebook');
      send('status', { source: 'facebook', status: 'failed', error: String(facebookSettled.reason) });
    }

    // Telegram
    if (telegramSettled.status === 'fulfilled') {
      const r = telegramSettled.value;
      allResults.push(...r);
      succeeded.push('telegram');
      send('status', { source: 'telegram', status: 'done', count: r.length });
      send('results', { source: 'telegram', results: r });
    } else {
      failed.push('telegram');
      send('status', { source: 'telegram', status: 'failed', error: String(telegramSettled.reason) });
    }

    // Step 3: Synthesize results
    send('status', { source: 'synthesis', status: 'searching' });
    let synthesis;
    try {
      synthesis = await synthesizeResults(query, allResults);
      send('synthesis', synthesis);
      send('status', { source: 'synthesis', status: 'done' });
    } catch (err) {
      console.error('Synthesis failed:', err);
      send('status', { source: 'synthesis', status: 'failed', error: 'Synthesis failed' });
    }

    // Final done event with full export schema
    const metadata: SearchMetadata = {
      query,
      market,
      timestamp: new Date().toISOString(),
      expanded_queries: expandedQueries,
      sources_searched: ['reddit', 'google', 'facebook', 'telegram'],
      sources_succeeded: succeeded,
      sources_failed: failed,
      total_results: allResults.length,
    };

    send('done', { metadata, results: allResults, synthesis });
    res.end();
  });
}
