import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    middleware: [
      async (req, res, next) => {
        if (req.url === '/api/reverse' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', async () => {
            try {
              const { tweet } = JSON.parse(body || '{}')
              const apiKey = process.env.OPENROUTER_API_KEY || ''

              const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                  'HTTP-Referer': 'http://localhost:5173',
                  'X-Title': 'TweetsReverse.lol',
                },
                body: JSON.stringify({
                  model: 'nvidia/nemotron-3-super-120b-a12b:free',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are a roast AI. Given a tweet, generate 5 variations of sarcastic, witty, dark humor, absurd, or self-deprecating reversals/roasts. Each should be short and punchy. Return ONLY a valid JSON array. Each element must have "text" (string), "style" (one of: "Sarcastic", "Dark Humor", "Absurd", "Witty", "Self-Deprecating"), and "score" (integer 1-100).',
                    },
                    {
                      role: 'user',
                      content: `Reverse/roast this tweet: ${tweet}`,
                    },
                  ],
                  temperature: 0.9,
                }),
              })

              const data = await resp.json()
              res.writeHead(resp.status, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(data))
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
        next()
      },
    ],
  },
})
