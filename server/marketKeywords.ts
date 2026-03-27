import type { Market } from '../shared/searchTypes';

const vietnamKeywords: string[] = [
  'lấy cookie facebook',
  'tool lấy cookie',
  'mua bán tài khoản facebook',
  'bán VIA fb',
  'tool phishing facebook',
  'dịch vụ hack facebook',
  'vượt passkey facebook',
  'bypass sinh trắc học',
  'shop tài khoản',
];

const brazilKeywords: string[] = [
  'roubar cookie facebook',
  'pegar token facebook',
  'comprar conta facebook',
  'página falsa facebook',
  'hackear facebook',
  'painel phishing',
  'burlar passkey',
  'loja de contas',
];

export function getMarketKeywords(market: Market): string[] {
  switch (market) {
    case 'vietnam':
      return vietnamKeywords;
    case 'brazil':
      return brazilKeywords;
    default:
      return [];
  }
}

const synonyms: Record<string, string> = {
  '2fa': 'two factor authentication',
  'mfa': 'multi-factor authentication',
  'passkey': 'FIDO2 WebAuthn passwordless',
  'bypass': 'circumvent defeat crack',
  'phishing': 'credential harvesting social engineering',
  'cookie': 'session token hijack',
  'hack': 'compromise breach exploit',
  'stealer': 'infostealer grabber logger',
  'otp': 'one time password',
  'facebook': 'FB Meta',
};

/**
 * Expand a short query into 5-7 search variants for comprehensive coverage.
 * E.g. "2fa bypass" → ["2fa bypass", "2fa bypass tools pricing",
 *   "two factor authentication bypass", "2fa bypass 2024 2025", ...]
 */
export function expandQuery(baseQuery: string, market: Market): string[] {
  const words = baseQuery.toLowerCase().split(/\s+/);
  const expanded: string[] = [baseQuery];

  expanded.push(`${baseQuery} tools pricing`);
  expanded.push(`${baseQuery} tutorial guide how to`);
  expanded.push(`${baseQuery} 2024 2025`);
  expanded.push(`${baseQuery} service marketplace Telegram`);

  // Synonym substitution for first matching word
  for (const word of words) {
    if (synonyms[word]) {
      const firstSynonym = synonyms[word].split(' ')[0];
      const synonymQuery = baseQuery.replace(
        new RegExp(`\\b${word}\\b`, 'i'),
        firstSynonym
      );
      if (synonymQuery !== baseQuery && !expanded.includes(synonymQuery)) {
        expanded.push(synonymQuery);
        break;
      }
    }
  }

  // Market-specific terms
  const marketTerms = getMarketKeywords(market);
  if (marketTerms.length > 0) {
    const relevant = marketTerms
      .filter((t) => words.some((w) => t.toLowerCase().includes(w)))
      .slice(0, 2);
    if (relevant.length > 0) {
      expanded.push(...relevant);
    } else {
      expanded.push(`${baseQuery} ${marketTerms[0]}`);
    }
  }

  return Array.from(new Set(expanded));
}

/**
 * Returns extra Telegram search terms for a given market.
 */
export function telegramMarketTerms(market: Market): string[] {
  if (market === 'vietnam') return ['vietnam', 'viet', 'vn'];
  if (market === 'brazil') return ['brazil', 'brasil', 'br'];
  return [];
}

/**
 * Returns extra YouTube search terms for a given market.
 */
export function youtubeMarketTerms(market: Market): string[] {
  if (market === 'vietnam') return ['tiếng việt', 'hướng dẫn'];
  if (market === 'brazil') return ['português', 'tutorial'];
  return [];
}
