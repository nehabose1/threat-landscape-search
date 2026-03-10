import { Market } from './types';

const vietnamKeywords: string[] = [
  'lấy cookie facebook',
  'tool lấy cookie',
  'mua cookie facebook',
  'mua bán tài khoản facebook',
  'bán VIA fb',
  'mua VIA',
  'tut fb',
  'tool phishing facebook',
  'trang giả facebook',
  'dịch vụ hack facebook',
  'bypass passkey',
  'vượt passkey facebook',
  'bypass sinh trắc học',
  'shop tài khoản',
  'kiếm tiền online',
  'MMO facebook',
];

const brazilKeywords: string[] = [
  'roubar cookie facebook',
  'pegar token facebook',
  'comprar conta facebook',
  'conta facebook antiga',
  'página falsa facebook',
  'hackear facebook',
  'painel phishing',
  'burlar passkey',
  'hackear biometria',
  'loja de contas',
  'ganhar dinheiro online facebook',
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

export function buildSearchQueries(query: string, market: Market): string[] {
  const base = [
    query,
    `site:reddit.com ${query}`,
    `site:github.com ${query}`,
    `${query} pricing OR cost OR "$" OR "per month"`,
  ];

  const marketTerms = getMarketKeywords(market);
  const extra = marketTerms.map((term) => `${query} ${term}`);

  return [...base, ...extra];
}
