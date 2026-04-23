const activeRequests = new Set();

function getUserRequestKey(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim();
  const clientId = req.headers['x-client-id'];

  return clientId || ip || req.socket?.remoteAddress || 'anonymous';
}

export default async function handler(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tweet } = req.body;
  if (!tweet || !tweet.trim()) {
    return res.status(400).json({ error: 'No tweet provided' });
  }

  const userKey = getUserRequestKey(req);
  if (activeRequests.has(userKey)) {
    return res.status(429).json({
      error: 'You already have a request in progress. Please wait for it to finish.',
    });
  }

  const systemPrompt = `You are a hilarious, sharp-tongued tweet reverser/roast bot on TweetsReverse.lol. When a user pastes a tweet, you reverse/roast it with comedy. Your job is to take the tweet and flip it, mock it, roast it, or give a hilariously brutal counter-take.

Rules:
- Be funny, witty, and creative — not genuinely mean or harmful
- Give 3-5 roast/reversal variations, each with a labeled humor style
- Keep each response tweet-length (under 280 chars) so they're post-ready
- Vary the humor styles: sarcastic, dark, absurd, self-deprecating, witty
- Always respond in JSON format as follows:

[
  {"style": "Sarcastic", "text": "...", "score": 92},
  {"style": "Dark Humor", "text": "...", "score": 88},
  {"style": "Absurd", "text": "...", "score": 85},
  {"style": "Witty", "text": "...", "score": 90}
]

Only output valid JSON. No extra text, no markdown backticks.`;

  try {
    activeRequests.add(userKey);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tweetsreverse.lol',
        'X-Title': 'TweetsReverse.lol',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Reverse/roast this tweet: "${tweet.trim()}"` },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res
        .status(response.status)
        .json({ error: err?.error?.message || 'API request failed' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    activeRequests.delete(userKey);
  }
}
