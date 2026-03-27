import type { Express } from 'express';
import { searchReddit } from './sources/reddit';
import { searchGoogle } from './sources/google';
import { searchFacebook } from './sources/facebook';
import { searchTelegram } from './sources/telegram';
import { searchYouTube } from './sources/youtube';
import { synthesizeResults } from './sources/synthesize';
import { getDeadUrls } from './urlValidator';
import { expandQuery } from './marketKeywords';
import type { Market, SearchResult, SearchMetadata, RedditResult, GoogleResult, FacebookResult, TelegramResult, YouTubeResult } from '../shared/searchTypes';

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
    send('status', { source: 'youtube', status: 'searching' });

    const succeeded: string[] = [];
    const failed: string[] = [];

    // Step 2: Run all five sources in parallel
    const [redditSettled, googleSettled, facebookSettled, telegramSettled, youtubeSettled] =
      await Promise.allSettled([
        searchReddit(query, market),
        searchGoogle(expandedQueries),
        searchFacebook(expandedQueries),
        searchTelegram(query, market),
        searchYouTube(query, market),
      ]);

    // Collect raw results
    let redditResults: RedditResult[] =
      redditSettled.status === 'fulfilled' ? redditSettled.value : [];
    let googleResults: GoogleResult[] =
      googleSettled.status === 'fulfilled' ? googleSettled.value : [];
    let facebookResults: FacebookResult[] =
      facebookSettled.status === 'fulfilled' ? facebookSettled.value : [];
    let telegramResults: TelegramResult[] =
      telegramSettled.status === 'fulfilled' ? telegramSettled.value : [];
    let youtubeResults: YouTubeResult[] =
      youtubeSettled.status === 'fulfilled' ? youtubeSettled.value : [];

    if (redditSettled.status === 'rejected') failed.push('reddit');
    if (googleSettled.status === 'rejected') failed.push('google');
    if (facebookSettled.status === 'rejected') failed.push('facebook');
    if (telegramSettled.status === 'rejected') failed.push('telegram');
    if (youtubeSettled.status === 'rejected') failed.push('youtube');

    // Step 3: Validate URLs — exclude dead links (404/410/451)
    const allUrls: string[] = [
      ...redditResults.map((r) => r.url),
      ...googleResults.map((r) => r.url),
      ...facebookResults.map((r) => r.url),
      ...telegramResults.map((r) => r.channel_url),
      ...youtubeResults.map((r) => r.url),
    ];

    if (allUrls.length > 0) {
      send('status', { source: 'validation', status: 'checking links' });
      const deadUrls = await getDeadUrls(allUrls);

      if (deadUrls.size > 0) {
        redditResults = redditResults.filter((r) => !deadUrls.has(r.url));
        googleResults = googleResults.filter((r) => !deadUrls.has(r.url));
        facebookResults = facebookResults.filter((r) => !deadUrls.has(r.url));
        telegramResults = telegramResults.filter((r) => !deadUrls.has(r.channel_url));
        youtubeResults = youtubeResults.filter((r) => !deadUrls.has(r.url));

        send('status', {
          source: 'validation',
          status: 'done',
          count: deadUrls.size,
          message: `Excluded ${deadUrls.size} dead link${deadUrls.size > 1 ? 's' : ''}`,
        });
      } else {
        send('status', { source: 'validation', status: 'done', count: 0 });
      }
    }

    // Step 4: Send validated results
    const allResults: SearchResult[] = [];

    if (redditSettled.status === 'fulfilled') {
      allResults.push(...redditResults);
      succeeded.push('reddit');
      send('status', { source: 'reddit', status: 'done', count: redditResults.length });
      send('results', { source: 'reddit', results: redditResults });
    } else {
      send('status', { source: 'reddit', status: 'failed', error: String(redditSettled.reason) });
    }

    if (googleSettled.status === 'fulfilled') {
      allResults.push(...googleResults);
      succeeded.push('google');
      send('status', { source: 'google', status: 'done', count: googleResults.length });
      send('results', { source: 'google', results: googleResults });
    } else {
      send('status', { source: 'google', status: 'failed', error: String(googleSettled.reason) });
    }

    if (facebookSettled.status === 'fulfilled') {
      allResults.push(...facebookResults);
      succeeded.push('facebook');
      send('status', { source: 'facebook', status: 'done', count: facebookResults.length });
      send('results', { source: 'facebook', results: facebookResults });
    } else {
      send('status', { source: 'facebook', status: 'failed', error: String(facebookSettled.reason) });
    }

    if (telegramSettled.status === 'fulfilled') {
      allResults.push(...telegramResults);
      succeeded.push('telegram');
      send('status', { source: 'telegram', status: 'done', count: telegramResults.length });
      send('results', { source: 'telegram', results: telegramResults });
    } else {
      send('status', { source: 'telegram', status: 'failed', error: String(telegramSettled.reason) });
    }

    if (youtubeSettled.status === 'fulfilled') {
      allResults.push(...youtubeResults);
      succeeded.push('youtube');
      send('status', { source: 'youtube', status: 'done', count: youtubeResults.length });
      send('results', { source: 'youtube', results: youtubeResults });
    } else {
      send('status', { source: 'youtube', status: 'failed', error: String(youtubeSettled.reason) });
    }

    // Step 5: Synthesize results
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
      sources_searched: ['reddit', 'google', 'facebook', 'telegram', 'youtube'],
      sources_succeeded: succeeded,
      sources_failed: failed,
      total_results: allResults.length,
    };

    send('done', { metadata, results: allResults, synthesis });
    res.end();
  });
}
