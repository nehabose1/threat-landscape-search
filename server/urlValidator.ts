/**
 * Validates URLs via parallel HEAD requests.
 * Returns the set of dead URLs (404, 410, 451) that should be excluded.
 */
export async function getDeadUrls(
  urls: string[],
  timeoutMs = 3000
): Promise<Set<string>> {
  const unique = Array.from(new Set(urls));
  const dead = new Set<string>();

  const checks = unique.map(async (url) => {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(timeoutMs),
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; ThreatLandscapeSearch/1.0; +link-checker)',
        },
      });

      // Hard dead: 404, 410 Gone, 451 Unavailable for Legal Reasons
      if (res.status === 404 || res.status === 410 || res.status === 451) {
        dead.add(url);
      }
    } catch {
      // Timeout or network error — keep the link (could be temporary)
    }
  });

  await Promise.allSettled(checks);
  return dead;
}
