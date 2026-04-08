# TweetsReverse.lol

<video src="public/my intro.mp4" controls autoplay muted loop></video>

Paste a tweet. Get it roasted, reversed, and ridiculously remixed.

**[TweetsReverse.lol](https://tweetsreverse.lol)** is an AI-powered tweet roasting app. Drop any tweet into the input, hit "Reverse it," and the backend generates multiple roast variations in different styles — Sarcastic, Dark Humor, Absurd, Witty, and Self-Deprecating — each with a roast-level score.

## Features

- **Multiple roast styles** — Each response includes 5 variations, each labeled and color-coded by style
- **Copy to clipboard** — Quick copy as plain text or "post-ready" (appends `— via TweetsReverse.lol`)
- **Character counter** — Live count against Twitter's 280-character limit
- **Dark theme** — Built with a custom dark UI using Tailwind CSS

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Backend:** Expects an API endpoint at `/api/reverse` that accepts `POST { tweet: string }` and returns OpenAI-compatible chat completions containing a JSON array of roast objects

## Project Structure

```
src/
  App.jsx        # Main app component (UI, API call, result cards)
  App.css        # Legacy styles (mostly unused)
  index.css      # Tailwind theme, custom animations, color tokens
  main.jsx       # React entry point
```

## Response Format

The backend should return an OpenAI-style response where `choices[0].message.content` is a JSON array, e.g.:

```json
[
  { "style": "Sarcastic", "text": "Wow, never seen that one coming.", "score": 72 },
  { "style": "Dark Humor", "text": "...", "score": 85 },
  { "style": "Absurd", "text": "...", "score": 60 },
  { "style": "Witty", "text": "...", "score": 78 },
  { "style": "Self-Deprecating", "text": "...", "score": 55 }
]
```

Each `style` must match one of the five keys defined in `STYLE_COLORS` for proper color theming.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm (comes with Node)

### Install & Run

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Building for Production

```bash
npm run build
npm run preview
```

### Backend Setup

This repo contains the **frontend only**. You need a backend proxy at `/api/reverse` that forwards the tweet to an AI model (OpenAI, Claude, etc.) with a system prompt instructing it to return 5 roast variations as a JSON array matching the format above.

A quick way to set this up locally is with a simple [Vite proxy](https://vitejs.dev/config/server-options#server-proxy) in `vite.config.js`:

```js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
}
```

Or deploy a serverless function (Cloudflare Workers, Vercel, Netlify) that calls your AI provider of choice.
