import express from 'express';
import cors from 'cors';
import { searchReddit } from './sources/reddit';
import { searchGoogle } from './sources/google';
import { searchTelegram } from './sources/telegram';
import { SearchRequest, SearchResponse, SearchResult, Market } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Main search endpoint — uses SSE to stream progress updates
app.get('/api/search', async (req, res) => {
  const query = (req.query.query as string) || '';
  const market = ((req.query.market as string) || 'global') as Market;

  if (!query.trim()) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const sources = ['reddit', 'google', 'telegram'];
  const succeeded: string[] = [];
  const failed: string[] = [];
  const allResults: SearchResult[] = [];

  send('status', { source: 'reddit', status: 'searching' });
  send('status', { source: 'google', status: 'searching' });
  send('status', { source: 'telegram', status: 'searching' });

  // Run all three in parallel
  const [redditResult, googleResult, telegramResult] = await Promise.allSettled([
    searchReddit(query, market),
    searchGoogle(query, market),
    searchTelegram(query),
  ]);

  // Process Reddit
  if (redditResult.status === 'fulfilled') {
    const results = redditResult.value;
    allResults.push(...results);
    succeeded.push('reddit');
    send('status', { source: 'reddit', status: 'done', count: results.length });
    send('results', { source: 'reddit', results });
  } else {
    failed.push('reddit');
    send('status', {
      source: 'reddit',
      status: 'failed',
      error: String(redditResult.reason),
    });
  }

  // Process Google
  if (googleResult.status === 'fulfilled') {
    const results = googleResult.value;
    allResults.push(...results);
    succeeded.push('google');
    send('status', { source: 'google', status: 'done', count: results.length });
    send('results', { source: 'google', results });
  } else {
    failed.push('google');
    send('status', {
      source: 'google',
      status: 'failed',
      error: String(googleResult.reason),
    });
  }

  // Process Telegram
  if (telegramResult.status === 'fulfilled') {
    const results = telegramResult.value;
    if (results.length > 0) {
      allResults.push(...results);
      succeeded.push('telegram');
      send('status', { source: 'telegram', status: 'done', count: results.length });
      send('results', { source: 'telegram', results });
    } else {
      // Graceful degradation — no results but not a failure
      succeeded.push('telegram');
      send('status', {
        source: 'telegram',
        status: 'done',
        count: 0,
        error: 'Telegram: limited results',
      });
      send('results', { source: 'telegram', results: [] });
    }
  } else {
    failed.push('telegram');
    send('status', {
      source: 'telegram',
      status: 'failed',
      error: 'Telegram: limited results',
    });
    send('results', { source: 'telegram', results: [] });
  }

  // Send final metadata
  const response: SearchResponse = {
    metadata: {
      query,
      market,
      timestamp: new Date().toISOString(),
      sources_searched: sources,
      sources_succeeded: succeeded,
      sources_failed: failed,
      total_results: allResults.length,
    },
    results: allResults,
  };

  send('done', response);
  res.end();
});

app.listen(PORT, () => {
  console.log(`Threat Landscape Search backend running on port ${PORT}`);
});
