# Threat Landscape Search

An OSINT desk research tool for searching public web sources for cybersecurity threat intelligence.

## Features

- **Multi-source search**: Reddit (7 subreddits via Pushshift), Google (via OpenAI web search), Telegram (via OpenAI web search)
- **Market-specific keyword expansion**: Vietnam 🇻🇳 and Brazil 🇧🇷 localised search terms
- **Real-time progress**: SSE-powered live status updates per source
- **Tabbed results**: Separate tabs for Reddit, Google, and Telegram with sortable tables
- **JSON export**: One-click export in a structured schema ready for downstream tooling
- **Dark theme**: Minimal, functional UI

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Search**: Reddit via [pullpush.io](https://pullpush.io) (Pushshift), Google & Telegram via OpenAI web search API
- **Package manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- OpenAI API key (for Google and Telegram search)

### Install dependencies

```bash
# Backend
cd backend && pnpm install

# Frontend
cd frontend && pnpm install
```

### Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set OPENAI_API_KEY=your_key_here
```

### Run in development

```bash
# Terminal 1 — backend (port 3001)
cd backend && OPENAI_API_KEY=your_key pnpm dev

# Terminal 2 — frontend (port 5173, proxied to backend)
cd frontend && pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
# Build frontend
cd frontend && pnpm build

# Start backend
cd backend && OPENAI_API_KEY=your_key pnpm start
```

## Project Structure

```
threat-landscape-search/
├── backend/
│   ├── .env.example              # Environment variable template
│   └── src/
│       ├── index.ts              # Express server + SSE endpoint
│       ├── types.ts              # Shared TypeScript types
│       ├── marketKeywords.ts     # Vietnam / Brazil keyword expansion
│       └── sources/
│           ├── reddit.ts         # Reddit search via pullpush.io API
│           ├── google.ts         # Web search via OpenAI web_search_preview
│           └── telegram.ts       # Telegram channel search via OpenAI web_search_preview
└── frontend/
    └── src/
        ├── App.tsx               # Root component
        ├── useSearch.ts          # SSE search hook + JSON export
        ├── types.ts              # Frontend types
        └── components/
            ├── SearchBar.tsx
            ├── SourceProgress.tsx
            ├── ResultTabs.tsx
            ├── RedditTable.tsx
            ├── GoogleTable.tsx
            └── TelegramTable.tsx
```

## Export JSON Schema

```json
{
  "metadata": {
    "query": "passkey bypass tools pricing",
    "market": "global",
    "timestamp": "2026-03-10T14:30:00Z",
    "sources_searched": ["reddit", "google", "telegram"],
    "sources_succeeded": ["reddit", "google", "telegram"],
    "sources_failed": [],
    "total_results": 61
  },
  "results": [
    {
      "source": "reddit",
      "title": "...",
      "url": "https://reddit.com/r/netsec/...",
      "snippet": "...",
      "date": "2026-02-15",
      "score": 142,
      "subreddit": "netsec",
      "num_comments": 38
    },
    {
      "source": "google",
      "title": "...",
      "url": "https://example.com/...",
      "domain": "example.com",
      "snippet": "...",
      "date": "2025-11-20"
    },
    {
      "source": "telegram",
      "channel_name": "channelname",
      "channel_url": "https://t.me/channelname",
      "snippet": "...",
      "date": "2025-10-16",
      "views": 34
    }
  ]
}
```

## Notes

- **Reddit**: Uses the public [pullpush.io](https://pullpush.io) API (Pushshift alternative). No API key required. Searches across: `netsec`, `cybersecurity`, `hacking`, `darknet`, `malware`, `blackhat`, `AskNetsec`.
- **Google**: Uses OpenAI's `web_search_preview` tool with `gpt-4.1-mini`. Requires `OPENAI_API_KEY`.
- **Telegram**: Uses OpenAI's `web_search_preview` to find relevant Telegram channels and posts. Requires `OPENAI_API_KEY`.
- **Market expansion**: Selecting Vietnam or Brazil appends localised terms to improve local threat signal discovery.
