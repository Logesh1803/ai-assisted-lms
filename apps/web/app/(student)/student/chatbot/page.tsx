"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatbotApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare, Send, Plus, Trash2, Loader2, Sparkles,
  Bot, User, Lightbulb, FlaskConical, BarChart2, ListOrdered,
  History, X,
} from "lucide-react";

const SUBJECT_OPTIONS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "Computer Science", "History", "Literature",
  "Economics", "Geography", "Psychology",
];

const STARTER_PROMPTS = [
  "Explain machine learning basics",
  "What is the Pythagorean theorem?",
  "Summarize the French Revolution",
  "How does DNA replication work?",
];

export default function ChatbotPage() {
  const queryClient = useQueryClient();
  const [activeSessionUuid, setActiveSessionUuid] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conceptTerm, setConceptTerm] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [conceptResults, setConceptResults] = useState<any[]>([]);
  const [explaining, setExplaining] = useState(false);
  const [conceptDialogOpen, setConceptDialogOpen] = useState(false);
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["chatbot-sessions"],
    queryFn: () => chatbotApi.getSessions(),
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) =>
      chatbotApi.sendMessage({ message: msg, sessionUuid: activeSessionUuid || undefined }),
    onSuccess: (data: any) => {
      if (!activeSessionUuid) setActiveSessionUuid(data.sessionUuid);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, created_at: new Date().toISOString() },
      ]);
      queryClient.invalidateQueries({ queryKey: ["chatbot-sessions"] });
    },
    onError: (err: any) => {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: err.message || "Failed to get a response.", created_at: new Date().toISOString() },
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => chatbotApi.deleteSession(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-sessions"] });
      setActiveSessionUuid(null);
      setMessages([]);
      toast.success("Session deleted.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete session."),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = async (uuid: string) => {
    setActiveSessionUuid(uuid);
    setLoadingMessages(true);
    try {
      const data = await chatbotApi.getSession(uuid);
      setMessages((data as any).messages ?? data ?? []);
    } catch {
      toast.error("Failed to load session.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = () => {
    const userMsg = message.trim();
    if (!userMsg) return;
    setMessage("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, created_at: new Date().toISOString() },
    ]);
    sendMutation.mutate(userMsg);
  };

  const handleNewChat = () => { setActiveSessionUuid(null); setMessages([]); };
  const toggleSubject = (s: string) =>
    setSelectedSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleExplainConcept = async () => {
    if (!conceptTerm.trim() || selectedSubjects.length === 0) {
      toast.error("Please enter a term and select at least one subject.");
      return;
    }
    setExplaining(true);
    try {
      const results = await chatbotApi.explainConcept(conceptTerm, selectedSubjects);
      setConceptResults(results as unknown as any[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to explain concept.");
    } finally {
      setExplaining(false);
    }
  };

  const sessionsList: any[] = (sessions as unknown as any[]) ?? [];

  /* ── Session list (shared between desktop sidebar + mobile drawer) ─── */
  const sessionsListContent = (
    <>
      <div className="p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Button onClick={handleNewChat} size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {sessionsLoading ? (
          <div className="space-y-2 p-1">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : sessionsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            <MessageSquare className="h-7 w-7 mb-2 opacity-30" style={{ color: "rgba(167,139,250,0.60)" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>No conversations yet</p>
          </div>
        ) : (
          sessionsList.map((session: any) => {
            const isActive = activeSessionUuid === session.uuid;
            return (
              <div
                key={session.uuid}
                className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150"
                style={
                  isActive
                    ? { background: "var(--sidebar-accent)", color: "white" }
                    : { color: "rgba(255,255,255,0.55)" }
                }
                onClick={() => { loadSession(session.uuid); setMobileSessionsOpen(false); }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {session.title || `Chat ${session.uuid.slice(0, 8)}`}
                  </p>
                  {session.createdAt && (
                    <p className="text-[11px] mt-0.5" style={{ color: isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.30)" }}>
                      {formatDate(session.createdAt)}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(session.uuid); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-4 h-full">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-up">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-ai)" }}
            >
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">AI Tutor</h1>
          </div>
          <p className="text-sm text-muted-foreground">Ask anything — I'm context-aware of your courses.</p>
        </div>
        <Dialog open={conceptDialogOpen} onOpenChange={setConceptDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ai" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Explain Concept
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: "var(--ai)" }} />
                Explain a Concept
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Term or Concept</label>
                <Input placeholder="e.g., Photosynthesis, Recursion, Supply and Demand" value={conceptTerm} onChange={(e) => setConceptTerm(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Subjects ({selectedSubjects.length} selected)</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150"
                      style={
                        selectedSubjects.includes(subject)
                          ? { background: "var(--gradient-ai)", color: "white", border: "1px solid transparent" }
                          : { background: "var(--muted)", borderColor: "var(--border)", color: "var(--muted-foreground)" }
                      }
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleExplainConcept} disabled={explaining || !conceptTerm.trim() || selectedSubjects.length === 0} variant="ai" className="w-full">
                {explaining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {explaining ? "Generating…" : "Explain"}
              </Button>

              {conceptResults.length > 0 && (
                <div className="space-y-5 mt-4">
                  <Separator />
                  <h3 className="font-semibold">Explanations for &quot;{conceptTerm}&quot;</h3>
                  {conceptResults.map((result: any, i: number) => (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                      <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--gradient-ai)" }}>
                        <Sparkles className="h-4 w-4 text-white" />
                        <span className="font-bold text-sm text-white">{result.subject}</span>
                      </div>
                      <div className="p-4 space-y-4 bg-card">
                        {result.explanation && (
                          <div className="pl-3" style={{ borderLeft: "3px solid var(--primary)" }}>
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">What it means</p>
                            <p className="text-sm leading-relaxed">{result.explanation}</p>
                          </div>
                        )}
                        {result.analogy && (
                          <div className="pl-3" style={{ borderLeft: "3px solid #F59E0B" }}>
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-500 mb-1 flex items-center gap-1"><Lightbulb className="h-3 w-3" />Real-world analogy</p>
                            <p className="text-sm leading-relaxed italic">{result.analogy}</p>
                          </div>
                        )}
                        {result.visual && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500 mb-1.5 flex items-center gap-1"><BarChart2 className="h-3 w-3" />Visual diagram</p>
                            <pre className="rounded-xl px-4 py-3 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto" style={{ background: "#0D0B1A", color: "#34D399", fontFamily: "var(--font-mono, monospace)" }}>{result.visual}</pre>
                          </div>
                        )}
                        {result.steps?.length > 0 && (
                          <div className="pl-3" style={{ borderLeft: "3px solid #A855F7" }}>
                            <p className="text-xs font-bold uppercase tracking-wide text-purple-500 mb-2 flex items-center gap-1"><ListOrdered className="h-3 w-3" />Step-by-step</p>
                            <ol className="space-y-2">
                              {result.steps.map((step: string, si: number) => (
                                <li key={si} className="flex items-start gap-2.5 text-sm">
                                  <span className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ background: "var(--gradient-purple)" }}>{si + 1}</span>
                                  <span className="leading-relaxed">{step.replace(/^Step \d+:\s*/i, "")}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {result.example && (
                          <div className="pl-3" style={{ borderLeft: "3px solid #10B981" }}>
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-500 mb-1 flex items-center gap-1"><FlaskConical className="h-3 w-3" />Example</p>
                            <p className="text-sm leading-relaxed">{result.example}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Mobile backdrop ───────────────────────────────────────────── */}
      {mobileSessionsOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm lg:hidden" style={{ background: "rgba(13,11,26,0.60)" }} onClick={() => setMobileSessionsOpen(false)} />
      )}

      {/* ── Mobile sessions drawer ────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-[51] flex flex-col w-72 transform transition-transform duration-200 ease-out lg:hidden shadow-xl`}
        style={{
          background: "var(--sidebar)",
          transform: mobileSessionsOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="font-semibold text-sm text-white">Chat History</span>
          <button onClick={() => setMobileSessionsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {sessionsListContent}
      </div>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <div className="flex gap-4 h-[calc(100dvh-200px)] min-h-[480px]">

        {/* Desktop Sessions Sidebar */}
        <div
          className="hidden lg:flex lg:w-60 shrink-0 flex-col rounded-2xl overflow-hidden shadow-lg"
          style={{ background: "var(--sidebar)" }}
        >
          {sessionsListContent}
        </div>

        {/* Chat Area */}
        <div
          className="flex-1 flex flex-col rounded-2xl overflow-hidden min-w-0 shadow-[var(--shadow-md)]"
          style={{ border: "1px solid var(--border)", background: "var(--card)" }}
        >
          {/* Mobile top bar */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 lg:hidden"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}
          >
            <button
              onClick={() => setMobileSessionsOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className="text-xs text-muted-foreground truncate">
              {activeSessionUuid
                ? (sessionsList.find((s: any) => s.uuid === activeSessionUuid)?.title ?? "Chat")
                : "New Chat"}
            </span>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2"
            style={{ background: "var(--chat-bg)" }}
          >
            {/* Empty state */}
            {!activeSessionUuid && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ai-pulse"
                  style={{ background: "var(--gradient-ai)", boxShadow: "var(--shadow-ai)" }}
                >
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">AI Learning Assistant</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                  Ask me anything about your courses, concepts, or topics you&apos;re studying.
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setMessage(prompt)}
                      className="text-left px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingMessages && (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <Skeleton className={`h-14 ${i % 2 === 0 ? "w-3/4" : "w-2/3"} rounded-2xl`} />
                  </div>
                ))}
              </div>
            )}

            {messages.map((msg: any, index: number) => {
              const isUser = msg.role === "user";
              if (msg.role === "error") return (
                <div key={index} className="flex justify-center my-2">
                  <span className="text-xs text-muted-foreground px-3 py-1 rounded-full" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    {msg.content}
                  </span>
                </div>
              );

              return (
                <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1 gap-2`}>
                  {!isUser && (
                    <div
                      className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-1"
                      style={{ background: "var(--gradient-ai)", boxShadow: "var(--shadow-ai)" }}
                    >
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className="relative max-w-[75%] px-4 py-2.5 text-sm leading-relaxed shadow-sm"
                    style={
                      isUser
                        ? {
                            background: "var(--gradient-brand)",
                            color: "white",
                            borderRadius: "18px 18px 4px 18px",
                          }
                        : {
                            background: "var(--chat-ai-bg)",
                            color: "var(--foreground)",
                            border: "1px solid var(--chat-ai-border)",
                            borderRadius: "18px 18px 18px 4px",
                          }
                    }
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.created_at && (
                      <p className="text-[10px] mt-1 text-right opacity-50">
                        {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  {isUser && (
                    <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-1 bg-foreground">
                      <User className="h-3.5 w-3.5 text-background" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {sendMutation.isPending && (
              <div className="flex justify-start gap-2 mb-1">
                <div
                  className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-1"
                  style={{ background: "var(--gradient-ai)" }}
                >
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div
                  className="px-4 py-3 shadow-sm"
                  style={{ background: "var(--chat-ai-bg)", border: "1px solid var(--chat-ai-border)", borderRadius: "18px 18px 18px 4px" }}
                >
                  <div className="dot-bounce flex gap-1 items-center h-4">
                    <span className="h-2 w-2 rounded-full" style={{ background: "var(--ai)" }} />
                    <span className="h-2 w-2 rounded-full" style={{ background: "var(--ai)" }} />
                    <span className="h-2 w-2 rounded-full" style={{ background: "var(--ai)" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-3" style={{ borderTop: "1px solid var(--border)", background: "var(--card)" }}>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Ask your AI tutor anything…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={sendMutation.isPending}
                className="rounded-full"
              />
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || !message.trim()}
                size="icon"
                variant="ai"
                className="rounded-full shrink-0"
              >
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
