import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimateOnScroll } from './useScrollAnimation.jsx';

const API_ENDPOINT = '/api/reverse';

const EXAMPLES = [
  "just had the best idea for a startup",
  "hot take: remote work is the future",
  "AI will replace everyone by 2027",
  "wfh is better than office work",
  "crypto is going to the moon again",
];

const STYLE_CONFIG = {
  "Sarcastic": { bg: "var(--color-status-red)", text: "var(--color-status-red-text)" },
  "Dark Humor": { bg: "var(--color-status-blue)", text: "var(--color-status-blue-text)" },
  "Absurd": { bg: "var(--color-status-green)", text: "var(--color-status-green-text)" },
  "Witty": { bg: "var(--color-status-yellow)", text: "var(--color-status-yellow-text)" },
  "Self-Deprecating": { bg: "var(--color-canvas-warm)", text: "var(--color-text-secondary)" },
};

/* ─── Components ─── */

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: 'var(--color-text-primary)',
            animation: `dotPulse 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <span className="text-sm ml-2" style={{ color: 'var(--color-text-muted)' }}>
        Generating variations...
      </span>
    </div>
  );
}

function ResultCard({ result, index }) {
  const [copied, setCopied] = useState(false);
  const config = STYLE_CONFIG[result.style] || STYLE_CONFIG["Witty"];

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result.text]);

  return (
    <div
      className="animate-fade-in card-hover"
      style={{
        animationDelay: `${index * 80}ms`,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-3">
          <span
            className="text-[11px] font-medium tracking-wide px-2.5 py-1"
            style={{
              backgroundColor: config.bg,
              color: config.text,
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
              width: 'fit-content',
            }}
          >
            {result.style.toLowerCase()}
          </span>
          <p
            className="text-[15px] leading-[1.65] text-balance"
            style={{
              color: 'var(--color-text-primary)',
              maxWidth: '52ch',
            }}
          >
            {result.text}
          </p>
        </div>
        <span
          className="text-2xl italic leading-none ml-4 flex-shrink-0 tabular-nums"
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-text-muted)',
            opacity: 0.4,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-[10px] tracking-wide font-medium min-w-[110px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          intensity
        </span>
        <div className="flex-1 score-bar">
          <div
            className="score-fill tabular-nums"
            style={{ width: `${result.score}%` }}
          />
        </div>
        <span
          className="text-sm font-mono min-w-[28px] text-right tabular-nums"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {result.score}
        </span>
      </div>

      {/* Actions */}
      <div
        className="flex gap-2 pt-3"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <button
          onClick={handleCopy}
          className="text-[11px] tracking-wide px-3 py-1.5 rounded border btn-primary"
          style={{
            borderColor: copied ? 'var(--color-status-green-text)' : 'var(--color-border)',
            color: copied ? 'var(--color-status-green-text)' : 'var(--color-text-muted)',
            backgroundColor: copied ? 'var(--color-status-green)' : 'transparent',
          }}
        >
          {copied ? 'copied' : 'copy'}
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${result.text}\n\n— via TweetsReverse.lol`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-[11px] tracking-wide px-3 py-1.5 rounded border btn-primary"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
            backgroundColor: 'transparent',
          }}
        >
          post-ready
        </button>
      </div>
    </div>
  );
}

function App() {
  const [tweet, setTweet] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRoast = useCallback(async () => {
    if (!tweet.trim()) return;
    setError('');
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet: tweet.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content?.trim() || '';

      let parsed;
      try {
        const cleaned = raw.replace(/```(?:json)?\s*/, '').replace(/```\s*$/, '');
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error('AI returned unexpected format. Try again.');
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AI returned empty response. Try again.');
      }

      setResults(parsed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tweet]);

  const charCount = tweet.length;
  const charColor = charCount > 280 ? 'var(--color-status-red-text)' : charCount > 240 ? 'var(--color-status-yellow-text)' : 'var(--color-text-muted)';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--color-canvas)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Skip to content link */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Ambient background motion */}
      <div
        className="ambient-blob fixed inset-0"
        style={{
          background: 'radial-gradient(circle at 25% 35%, var(--color-accent-warm-dim) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.02,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto w-full px-5 sm:px-8 py-10 flex flex-col flex-1">
        {/* Top Right Links */}
        <nav className="flex justify-end items-center gap-5 mb-10">
          <a
            href="https://github.com/worztm/reverse_tweets"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm btn-primary"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="View source on GitHub"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 19 19">
              <path fill="currentColor" fillRule="evenodd" d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844" clipRule="evenodd"/>
            </svg>
            <span className="text-xs">source</span>
          </a>
          <a
            href="https://x.com/worztm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm btn-primary"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Follow on X"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-xs">follow</span>
          </a>
        </nav>

        {/* Header - asymmetrical left-aligned */}
        <AnimateOnScroll as="header" className="mb-14">
          <div className="flex flex-col items-start">
            <h1
              className="text-5xl md:text-7xl font-bold leading-[1.05] text-balance"
              style={{
                fontFamily: 'var(--font-serif)',
                letterSpacing: '-0.035em',
                color: 'var(--color-text-primary)',
              }}
            >
              Tweets
              <span style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                Reverse
              </span>
              <span style={{ color: 'var(--color-accent-warm)', fontWeight: 400 }}>.lol</span>
            </h1>
            <p
              className="text-base mt-4 leading-relaxed text-pretty"
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-text-secondary)',
                maxWidth: '48ch',
              }}
            >
              Paste a tweet. Get it roasted, reversed, and ridiculously remixed.
            </p>
          </div>
          <div className="mt-6">
            <div
              className="w-16 h-[1px]"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
          </div>
        </AnimateOnScroll>

        {/* Main content area */}
        <main id="main-content">

        {/* Tweet Input */}
        <AnimateOnScroll as="div" className="mb-8">
          <label
            className="text-[11px] tracking-wide font-medium mb-2 block"
            style={{ color: 'var(--color-text-muted)' }}
          >
            the tweet
          </label>
          <textarea
            ref={textareaRef}
            value={tweet}
            onChange={(e) => setTweet(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRoast(); }}
            placeholder={EXAMPLES[placeholderIdx]}
            maxLength={500}
            rows={3}
            className="w-full input-focus"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '15px',
              lineHeight: '1.6',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-sans)',
              resize: 'vertical',
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span
              className="text-[11px] font-mono"
              style={{ color: charColor }}
            >
              {charCount}/280
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <kbd>Cmd</kbd> + <kbd>Enter</kbd>
            </span>
          </div>
        </AnimateOnScroll>

        {/* Error */}
        {error && (
          <div
            className="mb-6 rounded-lg px-4 py-3 text-sm animate-fade-in"
            style={{
              backgroundColor: 'var(--color-pale-red)',
              border: '1px solid var(--color-pale-red-text)',
              color: 'var(--color-pale-red-text)',
            }}
          >
            {error}
          </div>
        )}

        {/* Roast Button */}
        <button
          onClick={handleRoast}
          disabled={!tweet.trim() || loading}
          className="w-full py-3 rounded-md font-semibold text-[13px] uppercase tracking-[0.8px] btn-primary"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: '#FFFFFF',
            border: 'none',
            opacity: (!tweet.trim() || loading) ? 0.3 : 1,
            cursor: (!tweet.trim() || loading) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : tweet.trim() ? 'Reverse it' : 'Paste a tweet to start'}
        </button>

        {/* Loading */}
        {loading && <LoadingDots />}

        {/* Results */}
        {results && results.length > 0 && (
          <AnimateOnScroll as="div" className="mt-12">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2
                  className="text-2xl font-bold tracking-tight text-balance"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  results
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {results.length} variations generated
                </p>
              </div>
            </div>
            <div
              className="h-[1px] mb-5"
              style={{
                background: `linear-gradient(to right, transparent, var(--color-border), transparent)`,
              }}
            />
            <div className="space-y-4">
              {results.map((r, i) => (
                <ResultCard key={i} result={r} index={i} />
              ))}
            </div>
          </AnimateOnScroll>
        )}

        {/* Empty State */}
        {!results && !loading && (
          <AnimateOnScroll
            as="div"
            className="text-center py-16 animate-fade-in flex-1 flex flex-col justify-center"
          >
            <div
              className="w-16 h-16 mx-auto mb-5 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-canvas-warm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3
              className="text-lg font-bold mb-2 tracking-tight"
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-text-secondary)',
              }}
            >
              drop a tweet above
            </h3>
            <p
              className="text-sm max-w-[280px] mx-auto leading-relaxed text-pretty"
              style={{ color: 'var(--color-text-muted)' }}
            >
              paste any tweet, yours or someone else's, and the ai will roast it to perfection.
            </p>
          </AnimateOnScroll>
        )}
        </main>

        {/* Footer */}
        <AnimateOnScroll
          as="footer"
          className="text-center mt-auto pt-8"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              built by{' '}
              <a
                href="https://x.com/worztm"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                @worztm
              </a>
            </p>
            <div className="flex gap-4">
              <span
                className="text-[11px]"
                style={{ color: 'var(--color-text-muted)', cursor: 'default' }}
              >
                privacy
              </span>
              <span
                className="text-[11px]"
                style={{ color: 'var(--color-text-muted)', cursor: 'default' }}
              >
                terms
              </span>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

export default App;
