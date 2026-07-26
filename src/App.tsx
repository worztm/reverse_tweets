import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimateOnScroll } from "./useScrollAnimation.tsx";
import {
  Sparkles,
  Zap,
  MessageCircleMore,
  History,
  Trash2,
  Copy,
  ExternalLink,
  Menu,
  Clock,
  Lightbulb,
  Flame,
  Check,
  Loader2,
  MessageCircle,
  FileText,
} from "lucide-react";

/* ─── Types ─── */

interface RoastResult {
  text: string;
  style: "Sarcastic" | "Dark Humor" | "Absurd" | "Witty" | "Self-Deprecating";
  score: number;
}

interface HistoryItem {
  id: number;
  tweet: string;
  results: RoastResult[];
}

/* ─── Constants ─── */

const API_ENDPOINT = "/api/reverse";

const EXAMPLES = [
  "just had the best idea for a startup",
  "hot take: remote work is the future",
  "AI will replace everyone by 2027",
  "wfh is better than office work",
  "crypto is going to the moon again",
];

const STYLE_CONFIG: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"; label: string; icon: React.ReactNode }> = {
  Sarcastic: {
    variant: "destructive",
    label: "Sarcastic",
    icon: <MessageCircle className="size-3" />,
  },
  "Dark Humor": {
    variant: "outline",
    label: "Dark Humor",
    icon: <Flame className="size-3" />,
  },
  Absurd: {
    variant: "secondary",
    label: "Absurd",
    icon: <Sparkles className="size-3" />,
  },
  Witty: {
    variant: "default",
    label: "Witty",
    icon: <Lightbulb className="size-3" />,
  },
  "Self-Deprecating": {
    variant: "ghost",
    label: "Self-Deprecating",
    icon: <MessageCircleMore className="size-3" />,
  },
};

const HISTORY_STORAGE_KEY = "tweetsreverse-history";

function getClientId(): string {
  const storageKey = "tweetsreverse-client-id";
  const existingId = window.localStorage.getItem(storageKey);
  if (existingId) return existingId;
  const nextId = window.crypto?.randomUUID?.() || `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(storageKey, nextId);
  return nextId;
}

/* ─── Loading Component ─── */

function LoadingState() {
  return (
    <div className="grid gap-4 sm:gap-6 mt-10 sm:mt-16 pb-16 sm:pb-20">
      {[0, 1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-5 w-8" />
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 flex-1 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Result Card ─── */

function ResultCard({ result, index }: { result: RoastResult; index: number }) {
  const [copied, setCopied] = useState(false);
  const config = STYLE_CONFIG[result.style] || STYLE_CONFIG.Witty;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result.text]);

  return (
    <AnimateOnScroll>
      <Card
        className="group/card border-primary/5 hover:border-primary/20 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <CardHeader className="flex-row items-start justify-between gap-4 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={config.variant} className="pointer-events-none">
              {config.icon}
              {config.label}
            </Badge>
            <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/50">
              #{index + 1}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed text-pretty text-foreground/90">
            {result.text}
          </p>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4 pt-4">
          {/* Score Bar */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
              Roast Level
            </span>
            <Progress value={result.score} className="flex-1" aria-label={`Intensity score: ${result.score} out of 100`}>
              <ProgressTrack className="h-2 rounded-full bg-muted/50">
                <ProgressIndicator
                  className="rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                  style={{ width: `${result.score}%` }}
                />
              </ProgressTrack>
            </Progress>
            <span className="text-sm font-semibold tabular-nums text-muted-foreground min-w-[2rem] text-right">
              {result.score}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={copied ? "default" : "outline"}
                  size="default"
                  className="flex-1 gap-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy this roast to clipboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="default"
                  className="flex-1 gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`${result.text}\n\n— via TweetsReverse.lol`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  <ExternalLink className="size-3.5" />
                  Post-Ready
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy with attribution for sharing</TooltipContent>
            </Tooltip>
          </div>
        </CardFooter>
      </Card>
    </AnimateOnScroll>
  );
}

/* ─── History Item ─── */

function HistoryItemComponent({
  item,
  isActive,
  onClick,
  onDelete,
}: {
  item: HistoryItem;
  isActive: boolean;
  onClick: (item: HistoryItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        "w-full text-left p-4 transition-all duration-200 border-b border-border/40 hover:bg-muted/40 group relative",
        isActive && "bg-primary/5 border-l-2 border-l-primary"
      )}
    >
      <p
        className={cn(
          "text-sm leading-relaxed line-clamp-2 pr-8 mb-2",
          isActive ? "text-foreground font-medium" : "text-muted-foreground"
        )}
      >
        {item.tweet}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          {new Date(item.id).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            <FileText className="size-3" />
            {item.results.length}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            aria-label="Delete history item"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </button>
  );
}

/* ─── Brand Icons ─── */

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ─── Main App ─── */

function App() {
  const [tweet, setTweet] = useState("");
  const [currentResultId, setCurrentResultId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const clientIdRef = useRef("");

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    clientIdRef.current = getClientId();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleDeleteHistory = (id: number) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentResultId === id) {
      setCurrentResultId(null);
      setTweet("");
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setCurrentResultId(null);
    setTweet("");
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    setTweet(item.tweet);
    setCurrentResultId(item.id);
    setIsSidebarOpen(false);
  };

  const handleRoast = useCallback(async () => {
    if (!tweet.trim() || loading) return;
    setError("");
    setLoading(true);
    setCurrentResultId(null);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": clientIdRef.current || getClientId(),
        },
        body: JSON.stringify({ tweet: tweet.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const raw = (data?.choices?.[0]?.message?.content as string)?.trim() || "";

      let parsed: RoastResult[];
      try {
        const cleaned = raw.replace(/```(?:json)?\s*/, "").replace(/```\s*$/, "");
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("AI returned unexpected format. Try again.");
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("AI returned empty response. Try again.");
      }

      const newItem: HistoryItem = {
        id: Date.now(),
        tweet: tweet.trim(),
        results: parsed,
      };

      setHistory((prev) => [newItem, ...prev].slice(0, 50));
      setCurrentResultId(newItem.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [loading, tweet]);

  const charCount = tweet.length;
  const charColor =
    charCount > 280
      ? "text-destructive"
      : charCount > 240
        ? "text-amber-400"
        : "text-muted-foreground";

  const currentResult = history.find((h) => h.id === currentResultId);
  const activeResults = currentResult ? currentResult.results : null;

  return (
    <TooltipProvider delay={400}>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        {/* Mobile Header */}
        <header className="sticky top-0 z-30 lg:hidden bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="w-10">
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open history"
                  className="size-9"
                >
                  <Menu className="size-4" />
                </Button>
              )}
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Tweets<span className="text-primary font-normal italic">Reverse</span>
              <span className="text-primary font-medium">.lol</span>
            </span>
            <div className="w-10" />
          </div>
        </header>

        {/* Floating History Toggle (Desktop) */}
        {history.length > 0 && (
          <div className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 z-30">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setIsSidebarOpen(true)}
                  className="size-10 rounded-full border-border/50 bg-background/80 backdrop-blur-xl shadow-lg hover:border-primary/30 hover:bg-primary/5 transition-all"
                  aria-label="Open history"
                >
                  <History className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                History ({history.length})
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* History Sheet (Desktop & Mobile) */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 bg-card/95 backdrop-blur-xl">
            <SheetHeader className="flex-row items-center justify-between p-5 border-b border-border/40">
              <div className="flex items-center gap-2">
                <History className="size-4 text-primary" />
                <SheetTitle className="text-sm font-semibold">History</SheetTitle>
              </div>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleClearHistory}
                  className="text-muted-foreground hover:text-destructive gap-1"
                >
                  <Trash2 className="size-3" />
                  Clear
                </Button>
              )}
            </SheetHeader>
            <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Clock className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No history yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Your roasted tweets will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {history.map((item) => (
                    <HistoryItemComponent
                      key={item.id}
                      item={item}
                      isActive={currentResultId === item.id}
                      onClick={handleLoadHistoryItem}
                      onDelete={handleDeleteHistory}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>



        {/* Main Content */}
        <div className="min-h-screen">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 min-h-screen flex flex-col">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-12">
              <div className="flex-1" />
              <nav className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => window.open('https://github.com/worztm/reverse_tweets', '_blank', 'noopener')}
                    >
                      <GithubMark className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View source on GitHub</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => window.open('https://x.com/worztm', '_blank', 'noopener')}
                    >
                      <XLogo className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Follow @worztm</TooltipContent>
                </Tooltip>
              </nav>
            </div>

            {/* Hero Section */}
            <AnimateOnScroll as="section" className="text-center lg:text-left mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5 border border-primary/20">
                <Sparkles className="size-3" />
                AI-Powered Tweet Roaster
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
                Tweets
                <span className="italic font-light text-muted-foreground">Reverse</span>
                <span className="text-primary">.lol</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mt-4 sm:mt-5 max-w-xl leading-relaxed mx-auto lg:mx-0">
                Paste any tweet and get it roasted, reversed, and ridiculously remixed into oblivion by AI.
              </p>
            </AnimateOnScroll>

            {/* Main Content Area */}
            <main id="main-content" className="flex-1 flex flex-col">
              {/* Input Section */}
              <AnimateOnScroll as="div">
                <Card className="border-primary/10 shadow-xl shadow-primary/5 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-1">
                      <Textarea
                        ref={textareaRef}
                        value={tweet}
                        onChange={(e) => setTweet(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleRoast();
                          }
                        }}
                        placeholder={EXAMPLES[placeholderIdx]}
                        maxLength={500}
                        className="min-h-[120px] resize-y border-0 bg-transparent text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 p-4 placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <Separator />
                    <div className="flex flex-row items-center justify-between gap-2 px-3 py-2.5 bg-muted/20">
                      <div className="flex items-center gap-2.5">
                        <span className={cn("text-[11px] font-mono font-medium tabular-nums", charColor)}>
                          {charCount}/280
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                          <kbd className="px-1 py-0.5 text-[9px] leading-none rounded border border-border/60 bg-muted/50 font-mono">
                            ⌘
                          </kbd>
                          <span className="text-[10px]">+</span>
                          <kbd className="px-1 py-0.5 text-[9px] leading-none rounded border border-border/60 bg-muted/50 font-mono">
                            ↵
                          </kbd>
                        </span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleRoast}
                            disabled={!tweet.trim() || loading}
                            size="sm"
                            className="gap-1.5 px-3.5 text-[12px] font-medium"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Reversing...
                              </>
                            ) : (
                              <>
                                <Zap className="size-3.5" />
                                Reverse It
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {loading ? "Generating roasts..." : "Roast this tweet! (⌘+↵)"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnScroll>

              {/* Error */}
              {error && (
                <AnimateOnScroll as="div">
                  <Card className="mt-6 border-destructive/30 bg-destructive/5">
                    <CardContent className="flex items-start gap-3 pt-4">
                      <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Flame className="size-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-destructive">Error</p>
                        <p className="text-sm text-muted-foreground mt-1">{error}</p>
                      </div>
                    </CardContent>
                  </Card>
                </AnimateOnScroll>
              )}

              {/* Loading State */}
              {loading && <LoadingState />}

              {/* Results */}
              {activeResults && activeResults.length > 0 && !loading && (
                <section className="mt-10 sm:mt-14 pb-16 sm:pb-20">
                  <AnimateOnScroll as="div" className="flex items-end justify-between mb-6 sm:mb-8">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Sparkles className="size-6 sm:size-7 text-primary" />
                        Remixed Results
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {activeResults.length} variations generated for you
                      </p>
                    </div>
                  </AnimateOnScroll>

                  <div className="grid gap-4 sm:gap-5">
                    {activeResults.map((r, i) => (
                      <ResultCard key={i} result={r} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {!activeResults && !loading && (
                <AnimateOnScroll
                  as="div"
                  className="flex-1 flex flex-col items-center justify-center text-center py-12 sm:py-20"
                >
                  <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 border border-primary/10 shadow-lg shadow-primary/5">
                    <MessageCircleMore className="size-8 sm:size-10 text-primary/60" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
                    Drop a masterpiece above
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-xs leading-relaxed">
                    Paste any tweet — yours or someone else's — and let AI roast it to perfection.
                  </p>
                </AnimateOnScroll>
              )}
            </main>

            {/* Footer */}
            <footer className="text-center mt-auto pt-10 pb-8">
              <Separator className="max-w-[200px] mx-auto mb-6" />
              <p className="text-sm text-muted-foreground">
                Built by{" "}
                <a
                  href="https://x.com/worztm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-border hover:decoration-primary"
                >
                  @worztm
                </a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
