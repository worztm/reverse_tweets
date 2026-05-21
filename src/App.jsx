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
  "Self-Deprecating": { bg: "var(--color-surface-muted)", text: "var(--color-text-primary)" },
};

const HISTORY_STORAGE_KEY = 'tweetsreverse-history';

function getClientId() {
  const storageKey = 'tweetsreverse-client-id';
  const existingId = window.localStorage.getItem(storageKey);

  if (existingId) {
    return existingId;
  }

  const nextId = window.crypto?.randomUUID?.() || `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(storageKey, nextId);
  return nextId;
}

/* ─── Components ─── */

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full dot-pulse"
          style={{
            backgroundColor: 'var(--color-accent-warm)',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <span className="text-sm ml-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
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
      className="animate-fade-in card-hover glass"
      style={{
        animationDelay: `${index * 80}ms`,
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex flex-col gap-3">
          <span
            className="text-[11px] font-bold tracking-wider px-3 py-1.5 uppercase"
            style={{
              backgroundColor: config.bg,
              color: config.text,
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
              width: 'fit-content',
              boxShadow: `0 0 10px ${config.bg}`,
            }}
          >
            {result.style}
          </span>
          <p
            className="text-[16px] leading-[1.7] text-pretty"
            style={{
              color: 'var(--color-text-primary)',
              maxWidth: '52ch',
            }}
          >
            {result.text}
          </p>
        </div>
        <span
          className="text-4xl italic leading-none ml-4 flex-shrink-0 tabular-nums font-bold"
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-border)',
            opacity: 0.5,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-4 mb-5">
        <span
          className="text-[10px] tracking-widest uppercase font-bold min-w-[80px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Intensity
        </span>
        <div className="flex-1 score-bar">
          <div
            className="score-fill tabular-nums"
            style={{ width: `${result.score}%` }}
          />
        </div>
        <span
          className="text-sm font-mono font-bold min-w-[32px] text-right tabular-nums"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {result.score}
        </span>
      </div>

      {/* Actions */}
      <div
        className="flex gap-3 pt-4"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <button
          onClick={handleCopy}
          className="text-[12px] font-medium tracking-wide px-4 py-2 rounded-md border btn-primary flex-1"
          style={{
            borderColor: copied ? 'var(--color-status-green-text)' : 'var(--color-border)',
            color: copied ? 'var(--color-status-green-text)' : 'var(--color-text-primary)',
            backgroundColor: copied ? 'var(--color-status-green)' : 'var(--color-surface-muted)',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${result.text}\n\n— via TweetsReverse.lol`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-[12px] font-medium tracking-wide px-4 py-2 rounded-md border btn-primary flex-1"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
          }}
        >
          Post-Ready
        </button>
      </div>
    </div>
  );
}

function HistoryItem({ item, isActive, onClick, onDelete }) {
  return (
    <div
      className={`group relative p-4 border-b transition-colors cursor-pointer ${isActive ? 'bg-[rgba(99,102,241,0.1)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}
      style={{ borderColor: 'var(--color-border-subtle)' }}
      onClick={() => onClick(item)}
    >
      <p className="text-sm line-clamp-2 pr-8 text-pretty" style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
        {item.tweet}
      </p>
      <div className="mt-2 flex justify-between items-center">
        <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
          {new Date(item.id).toLocaleDateString()}
        </span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
          {item.results.length} variations
        </span>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        className="absolute top-4 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[rgba(239,68,68,0.2)] text-[var(--color-text-muted)] hover:text-[var(--color-status-red-text)]"
        aria-label="Delete history item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  );
}

function App() {
  const [tweet, setTweet] = useState('');
  const [currentResultId, setCurrentResultId] = useState(null);
  
  // History state
  const [history, setHistory] = useState(() => {
    try {
      const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const textareaRef = useRef(null);
  const clientIdRef = useRef('');

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    clientIdRef.current = getClientId();
  }, []);

  // Save history on change
  useEffect(() => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleDeleteHistory = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentResultId === id) {
      setCurrentResultId(null);
      setTweet('');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
      setCurrentResultId(null);
      setTweet('');
    }
  };

  const handleLoadHistoryItem = (item) => {
    setTweet(item.tweet);
    setCurrentResultId(item.id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false); // Close sidebar on mobile after selection
    }
  };

  const handleRoast = useCallback(async () => {
    if (!tweet.trim() || loading) return;
    setError('');
    setLoading(true);
    setCurrentResultId(null); // Reset current view

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': clientIdRef.current || getClientId(),
        },
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

      // Add to history
      const newItem = {
        id: Date.now(),
        tweet: tweet.trim(),
        results: parsed,
      };
      
      setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
      setCurrentResultId(newItem.id);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loading, tweet]);

  const charCount = tweet.length;
  const charColor = charCount > 280 ? 'var(--color-status-red-text)' : charCount > 240 ? 'var(--color-status-yellow-text)' : 'var(--color-text-muted)';

  const currentResult = history.find(h => h.id === currentResultId);
  const activeResults = currentResult ? currentResult.results : null;

  return (
    <div className="min-h-screen flex flex-row font-sans" style={{ backgroundColor: 'var(--color-canvas)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background ambient animations */}
      <div className="ambient-blob fixed inset-0" style={{ background: 'radial-gradient(circle at 20% 30%, var(--color-accent-warm-dim) 0%, transparent 40%)' }} />
      <div className="ambient-blob fixed inset-0" style={{ background: 'radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.08) 0%, transparent 40%)', animationDelay: '-10s', animationDuration: '25s' }} />

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* History Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[320px] flex flex-col glass-panel transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-serif font-bold text-gradient tracking-wide">History</h2>
          {history.length > 0 && (
            <button 
              onClick={handleClearHistory}
              className="text-[11px] font-medium px-3 py-1.5 rounded bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--color-status-red-text)] transition-colors"
            >
              Clear All
            </button>
          )}
          <button 
            className="p-2 rounded-md text-[var(--color-text-muted)] hover:text-white transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <p className="text-sm">No history yet.</p>
              <p className="text-xs mt-2">Roast some tweets to see them here.</p>
            </div>
          ) : (
            <div>
              {history.map(item => (
                <HistoryItem 
                  key={item.id} 
                  item={item} 
                  isActive={currentResultId === item.id}
                  onClick={handleLoadHistoryItem}
                  onDelete={handleDeleteHistory}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <div className="lg:hidden p-4 flex items-center justify-between glass sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className="text-sm font-serif font-bold text-gradient">TweetsReverse</div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex p-6 items-center justify-between sticky top-0 z-30 pointer-events-none">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 rounded-xl glass-button pointer-events-auto text-[var(--color-text-muted)] hover:text-white transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            <span className="text-sm font-medium">History</span>
          </button>
          
          <nav className="flex justify-end items-center gap-6 pointer-events-auto">
            <a
              href="https://github.com/worztm/reverse_tweets"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium hover:text-white transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 19 19">
                <path fill="currentColor" fillRule="evenodd" d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844" clipRule="evenodd"/>
              </svg>
              <span>Source</span>
            </a>
            <a
              href="https://x.com/worztm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium hover:text-white transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Follow</span>
            </a>
          </nav>
        </div>

        <div className="max-w-3xl mx-auto w-full px-5 sm:px-8 py-10 lg:py-6 flex flex-col flex-1">

          {/* Header */}
          <AnimateOnScroll as="header" className="mb-16 mt-4 lg:mt-0">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h1
                className="text-6xl md:text-8xl font-bold leading-[1.1] text-balance font-serif"
                style={{
                  letterSpacing: '-0.04em',
                }}
              >
                <span className="text-white">Tweets</span>
                <span className="italic" style={{ color: 'var(--color-text-secondary)' }}>Reverse</span>
                <span style={{ color: 'var(--color-accent-warm)' }}>.lol</span>
              </h1>
              <p
                className="text-lg mt-6 leading-relaxed text-pretty font-serif"
                style={{
                  color: 'var(--color-text-secondary)',
                  maxWidth: '48ch',
                }}
              >
                Paste a tweet. Get it roasted, reversed, and ridiculously remixed into oblivion.
              </p>
            </div>
          </AnimateOnScroll>

          {/* Main content area */}
          <main id="main-content">

            {/* Tweet Input */}
            <AnimateOnScroll as="div" className="mb-8 relative z-10">
              <div className="glass p-2 rounded-[20px] shadow-2xl">
                <div className="bg-[rgba(0,0,0,0.2)] rounded-[14px] p-1">
                  <textarea
                    ref={textareaRef}
                    value={tweet}
                    onChange={(e) => setTweet(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRoast(); }}
                    placeholder={EXAMPLES[placeholderIdx]}
                    maxLength={500}
                    rows={4}
                    className="w-full input-focus bg-transparent border-none text-[16px] leading-[1.6] resize-y rounded-xl p-4 text-white placeholder-[var(--color-text-muted)]"
                    style={{ minHeight: '120px' }}
                  />
                  
                  <div className="flex justify-between items-center p-3 border-t border-[rgba(255,255,255,0.05)]">
                    <span className="text-[12px] font-mono font-medium" style={{ color: charColor }}>
                      {charCount}/280
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] hidden sm:inline-flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                        <kbd>Cmd</kbd> <span>+</span> <kbd>Enter</kbd>
                      </span>
                      <button
                        onClick={handleRoast}
                        disabled={!tweet.trim() || loading}
                        className="px-6 py-2.5 rounded-lg font-bold text-[13px] uppercase tracking-widest btn-primary shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, var(--color-accent-warm), #0ea5e9)',
                          color: '#FFFFFF',
                          border: 'none',
                          opacity: (!tweet.trim() || loading) ? 0.4 : 1,
                          cursor: (!tweet.trim() || loading) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loading ? 'Reversing...' : 'Reverse It'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Error */}
            {error && (
              <div
                className="mb-8 rounded-xl px-5 py-4 text-sm font-medium animate-fade-in glass shadow-lg flex items-center gap-3"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  color: 'var(--color-status-red-text)',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && <LoadingDots />}

            {/* Results */}
            {activeResults && activeResults.length > 0 && !loading && (
              <AnimateOnScroll as="div" className="mt-16 pb-20">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2
                      className="text-3xl font-bold tracking-tight text-balance font-serif text-gradient"
                    >
                      Remixed Results
                    </h2>
                    <p className="text-sm mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {activeResults.length} variations generated perfectly for you.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {activeResults.map((r, i) => (
                    <ResultCard key={i} result={r} index={i} />
                  ))}
                </div>
              </AnimateOnScroll>
            )}

            {/* Empty State */}
            {!activeResults && !loading && (
              <AnimateOnScroll
                as="div"
                className="text-center py-20 animate-fade-in flex-1 flex flex-col justify-center items-center"
              >
                <div
                  className="w-20 h-20 mb-8 flex items-center justify-center glass shadow-2xl relative"
                  style={{
                    borderRadius: 'var(--radius-xl)',
                  }}
                >
                  <div className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-[rgba(59,130,246,0.2)] to-[rgba(14,165,233,0.2)] blur-xl pointer-events-none" />
                  <svg
                    className="w-10 h-10 relative z-10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="url(#grad)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-text-secondary)" />
                        <stop offset="100%" stopColor="var(--color-text-muted)" />
                      </linearGradient>
                    </defs>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <polyline points="7 15 3 11 7 7"></polyline>
                  </svg>
                </div>
                <h3
                  className="text-2xl font-bold mb-3 tracking-tight font-serif"
                  style={{
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Drop a masterpiece above
                </h3>
                <p
                  className="text-base max-w-[320px] mx-auto leading-relaxed text-pretty font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Paste any tweet, yours or someone else's, and let the AI roast it to perfection.
                </p>
              </AnimateOnScroll>
            )}
          </main>

          {/* Footer */}
          <AnimateOnScroll
            as="footer"
            className="text-center mt-auto pt-10 pb-8"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-px w-full max-w-[200px] mx-auto mb-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Built by{' '}
                <a
                  href="https://x.com/worztm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[var(--color-accent-warm)] transition-colors inline-block pb-0.5 border-b border-[rgba(255,255,255,0.2)] hover:border-[var(--color-accent-warm)]"
                >
                  @worztm
                </a>
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </div>
  );
}

export default App;
