import { useState, useEffect, useRef, useCallback } from 'react';

const API_ENDPOINT = '/api/reverse';

const EXAMPLES = [
  "just had the best idea for a startup",
  "hot take: remote work is the future",
  "AI will replace everyone by 2027",
  "wfh is better than office work",
  "crypto is going to the moon again",
];

const STYLE_COLORS = {
  "Sarcastic": "text-red-400",
  "Dark Humor": "text-purple-400",
  "Absurd": "text-cyan-400",
  "Witty": "text-emerald-400",
  "Self-Deprecating": "text-amber-400",
};

const STYLE_BORDERS = {
  "Sarcastic": "border-l-red-500",
  "Dark Humor": "border-l-purple-500",
  "Absurd": "border-l-cyan-500",
  "Witty": "border-l-emerald-500",
  "Self-Deprecating": "border-l-amber-500",
};

/* ─── Components ─── */

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-accent/50"
          style={{
            animation: "dot-bounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <span className="text-text-secondary text-sm ml-2">Cooking up roasts...</span>
    </div>
  );
}

function ResultCard({ result, index }) {
  const [copied, setCopied] = useState(false);
  const borderColor = STYLE_BORDERS[result.style] || "border-l-accent";
  const textColor = STYLE_COLORS[result.style] || "text-accent";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result.text]);

  return (
    <div
      className={`bg-bg-card border border-border-subtle border-l-4 ${borderColor} rounded-lg p-5 animate-fade-up stagger-${index + 1} transition-all duration-200 hover:border-border hover:-translate-y-[1px] hover:shadow-lg hover:shadow-black/20`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold tracking-[1.5px] uppercase ${textColor}`}>
          {result.style}
        </span>
        <span className="font-mono text-2xl text-text-muted/50 italic leading-none">
          {index + 1}
        </span>
      </div>

      <p className="text-text-primary text-[15px] leading-relaxed mb-4">
        {result.text}
      </p>

      {/* Score bar */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-text-muted tracking-wider uppercase font-semibold min-w-[110px]">
          Roast Level
        </span>
        <div className="flex-1 h-[3px] bg-border-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
            style={{ width: `${result.score}%` }}
          />
        </div>
        <span className="text-text-secondary text-sm font-mono min-w-[28px] text-right">
          {result.score}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border-subtle">
        <button
          onClick={handleCopy}
          className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded border border-border-subtle transition-all ${
            copied
              ? "text-emerald-400 border-emerald-400"
              : "text-text-muted hover:text-text-primary hover:border-border"
          }`}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${result.text}\n\n— via TweetsReverse.lol`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded border border-border-subtle text-text-muted hover:text-text-primary hover:border-border transition-all"
        >
          Post-Ready
        </button>
      </div>
    </div>
  );
}

function App() {
  const [tweet, setTweet] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setError("");
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweet: tweet.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content?.trim() || "";

      let parsed;
      try {
        const cleaned = raw.replace(/```(?:json)?\s*/, "").replace(/```\s*$/, "");
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("AI returned unexpected format. Try again.");
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("AI returned empty response. Try again.");
      }

      setResults(parsed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tweet]);

  const charCount = tweet.length;
  const charColor = charCount > 280 ? "text-accent" : charCount > 240 ? "text-amber-400" : "text-text-muted";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-bg via-bg to-bg-elevated pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto w-full px-5 py-10">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none">
            <span className="text-text-primary">Tweets</span>
            <span className="text-accent">Reverse</span>
            <span className="text-gold">.lol</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2 italic font-serif">
            Paste a tweet. Get it roasted, reversed, and ridiculously remixed.
          </p>
          <div className="mt-4 flex justify-center">
            <div className="w-12 h-[2px] bg-accent rounded-full" />
          </div>
        </header>

        {/* Tweet Input */}
        <div className="mb-5">
          <label className="text-[10px] uppercase tracking-[1.5px] text-text-muted font-semibold mb-2 block">
            The Tweet
          </label>
          <textarea
            ref={textareaRef}
            value={tweet}
            onChange={(e) => setTweet(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRoast(); }}
            placeholder={EXAMPLES[placeholderIdx]}
            maxLength={500}
            rows={3}
            className="w-full bg-bg-input border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all resize-y leading-relaxed"
          />
          <div className="flex justify-between items-center mt-1.5">
            <span className={`text-[11px] font-mono ${charColor}`}>{charCount}/280</span>
            <span className="text-[10px] text-text-muted font-mono">⌘ + Enter</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-accent-dim border border-accent/30 rounded-lg px-4 py-3 text-sm text-accent animate-fade-in">
            {error}
          </div>
        )}

        {/* Roast Button */}
        <button
          onClick={handleRoast}
          disabled={!tweet.trim() || loading}
          className="w-full py-3.5 rounded-lg bg-accent text-white font-semibold text-[13px] uppercase tracking-[0.8px] transition-all duration-250 hover:bg-accent-hover hover:-translate-y-[1px] hover:shadow-lg hover:shadow-accent/25 active:translate-y-0 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? "Generating..." : tweet.trim() ? "Reverse it" : "Paste a tweet to start"}
        </button>

        {/* Loading */}
        {loading && <LoadingDots />}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                Results
              </h2>
              <span className="text-[11px] font-mono text-text-muted">
                {results.length} variations
              </span>
            </div>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
            <div className="space-y-3">
              {results.map((r, i) => (
                <ResultCard key={i} result={r} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results && !loading && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-4xl mb-4 opacity-40">"</div>
            <h3 className="text-xl font-bold text-text-secondary/80 mb-2 tracking-tight">
              Drop a tweet above
            </h3>
            <p className="text-text-muted text-sm max-w-[260px] mx-auto leading-relaxed">
              Paste any tweet, yours or someone else's, and the AI will roast it to perfection.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 pt-10 border-t border-border-subtle">
          <a
            href="https://x.com/worztm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-text-muted hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-label="X (Twitter)">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
