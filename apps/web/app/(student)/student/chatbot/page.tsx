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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  FlaskConical,
  BarChart2,
  ListOrdered,
  History,
  X,
} from "lucide-react";

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "History",
  "Literature",
  "Economics",
  "Geography",
  "Psychology",
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
      chatbotApi.sendMessage({
        message: msg,
        sessionUuid: activeSessionUuid || undefined,
      }),
    onSuccess: (data: any) => {
      const newSessionUuid = data.sessionUuid;
      if (!activeSessionUuid) {
        setActiveSessionUuid(newSessionUuid);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, created_at: new Date().toISOString() },
      ]);
      queryClient.invalidateQueries({ queryKey: ["chatbot-sessions"] });
    },
    onError: (err: any) => {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: err.message || "Failed to get a response. Please try again.", created_at: new Date().toISOString() },
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => chatbotApi.deleteSession(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-sessions"] });
      if (activeSessionUuid) {
        setActiveSessionUuid(null);
        setMessages([]);
      }
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
      setMessages((data as any).messages || data || []);
    } catch (err: any) {
      toast.error("Failed to load session.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, created_at: new Date().toISOString() },
    ]);
    sendMutation.mutate(userMsg);
  };

  const handleNewChat = () => {
    setActiveSessionUuid(null);
    setMessages([]);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

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

  const sessionsList: any[] = (sessions as unknown as any[]) || [];

  // Shared sessions list content — rendered inside both the desktop sidebar and mobile drawer
  const sessionsListContent = (
    <>
      <div className="p-3 border-b">
        <Button onClick={handleNewChat} size="sm" className="w-full">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessionsLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : sessionsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground h-full">
            <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {sessionsList.map((session: any) => (
              <li key={session.uuid}>
                <div
                  className={`group flex items-center justify-between gap-1 rounded-lg p-2 cursor-pointer transition-colors ${
                    activeSessionUuid === session.uuid
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => { loadSession(session.uuid); setMobileSessionsOpen(false); }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {session.title || `Chat ${session.uuid.slice(0, 8)}`}
                    </p>
                    {session.createdAt && (
                      <p className={`text-xs ${activeSessionUuid === session.uuid ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatDate(session.createdAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(session.uuid); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chatbot</h1>
          <p className="text-muted-foreground mt-1">Ask questions and get AI-powered explanations</p>
        </div>
        <Dialog open={conceptDialogOpen} onOpenChange={setConceptDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Sparkles className="h-4 w-4" />
              Explain Concept
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Explain a Concept
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Term or Concept</label>
                <Input
                  placeholder="e.g., Photosynthesis, Recursion, Supply and Demand"
                  value={conceptTerm}
                  onChange={(e) => setConceptTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Subjects ({selectedSubjects.length} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        selectedSubjects.includes(subject)
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background hover:bg-accent border-input"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleExplainConcept}
                disabled={explaining || !conceptTerm.trim() || selectedSubjects.length === 0}
                className="w-full"
              >
                {explaining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Explain
              </Button>

              {conceptResults.length > 0 && (
                <div className="space-y-6 mt-4">
                  <Separator />
                  <h3 className="font-semibold text-base">
                    Explanations for &quot;{conceptTerm}&quot;
                  </h3>
                  {conceptResults.map((result: any, i: number) => (
                    <div key={i} className="rounded-xl border bg-white dark:bg-card overflow-hidden shadow-sm">
                      {/* Subject header bar */}
                      <div className="bg-foreground text-background px-4 py-2.5 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 shrink-0" />
                        <span className="font-semibold text-sm">{result.subject}</span>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Explanation */}
                        <div className="border-l-4 border-foreground pl-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">What it means</p>
                          <p className="text-sm leading-relaxed text-foreground">{result.explanation}</p>
                        </div>

                        {/* Analogy */}
                        {result.analogy && (
                          <div className="border-l-4 border-amber-400 pl-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-1 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" /> Real-world analogy
                            </p>
                            <p className="text-sm leading-relaxed text-foreground italic">{result.analogy}</p>
                          </div>
                        )}

                        {/* Visual diagram — dark terminal style */}
                        {result.visual && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-1.5 flex items-center gap-1">
                              <BarChart2 className="h-3 w-3" /> Visual diagram
                            </p>
                            <pre className="rounded-lg bg-gray-900 text-emerald-300 text-xs font-mono p-4 whitespace-pre-wrap leading-relaxed overflow-x-auto">
{result.visual}
                            </pre>
                          </div>
                        )}

                        {/* Steps */}
                        {result.steps && result.steps.length > 0 && (
                          <div className="border-l-4 border-purple-400 pl-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-purple-600 mb-2 flex items-center gap-1">
                              <ListOrdered className="h-3 w-3" /> Step-by-step
                            </p>
                            <ol className="space-y-2">
                              {result.steps.map((step: string, si: number) => (
                                <li key={si} className="flex items-start gap-2.5 text-sm">
                                  <span className="shrink-0 h-5 w-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                                    {si + 1}
                                  </span>
                                  <span className="leading-relaxed text-foreground">{step.replace(/^Step \d+:\s*/i, "")}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Example */}
                        {result.example && (
                          <div className="border-l-4 border-green-500 pl-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
                              <FlaskConical className="h-3 w-3" /> Example
                            </p>
                            <p className="text-sm leading-relaxed text-foreground">{result.example}</p>
                          </div>
                        )}
                      </div>

                      {i < conceptResults.length - 1 && <div className="h-3 bg-muted/40" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Mobile Sessions Drawer backdrop ──────────────────────────────────── */}
      {mobileSessionsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setMobileSessionsOpen(false)}
        />
      )}

      {/* ── Mobile Sessions Drawer ────────────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-[51] flex flex-col w-72 bg-background border-r transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileSessionsOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <span className="font-semibold text-sm">Chat History</span>
          <button
            onClick={() => setMobileSessionsOpen(false)}
            className="p-1 rounded hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {sessionsListContent}
      </div>

      {/* ── Main layout: sidebar (desktop) + chat area ───────────────────────── */}
      <div className="flex gap-4 h-[calc(100dvh-180px)] min-h-[480px]">

        {/* Desktop Sessions Sidebar */}
        <div className="hidden lg:flex lg:w-64 shrink-0 flex-col border rounded-xl overflow-hidden bg-card">
          {sessionsListContent}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col border rounded-xl overflow-hidden min-w-0">
          {/* Mobile top bar: history toggle */}
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 lg:hidden">
            <button
              onClick={() => setMobileSessionsOpen(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className="text-xs text-muted-foreground truncate">
              {activeSessionUuid
                ? (sessionsList.find((s: any) => s.uuid === activeSessionUuid)?.title || "Chat")
                : "New Chat"}
            </span>
          </div>

          {/* Chat messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-1"
            style={{ background: "var(--chat-bg, #efeae2)" }}
          >
            {!activeSessionUuid && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="rounded-full bg-background/80 p-5 mb-4 shadow-sm border">
                  <Bot className="h-12 w-12 opacity-50" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">AI Learning Assistant</h3>
                <p className="text-sm mt-2 max-w-sm">
                  Ask me anything about your courses, concepts, or topics you&apos;re studying.
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                  {[
                    "Explain machine learning basics",
                    "What is the Pythagorean theorem?",
                    "Summarize the French Revolution",
                    "How does DNA replication work?",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setMessage(prompt)}
                      className="text-left px-3 py-2 text-xs bg-background border rounded-lg hover:bg-accent transition-colors shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingMessages && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <Skeleton className={`h-14 ${i % 2 === 0 ? "w-2/3" : "w-3/4"} rounded-2xl`} />
                  </div>
                ))}
              </div>
            )}

            {messages.map((msg: any, index: number) => {
              const isUser = msg.role === "user";
              const isError = msg.role === "error";

              if (isError) {
                return (
                  <div key={index} className="flex justify-center my-2">
                    <span className="text-xs text-muted-foreground bg-white/70 rounded-full px-3 py-1 shadow-sm">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1`}
                >
                  {/* Bot avatar */}
                  {!isUser && (
                    <div className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center shrink-0 mt-1 mr-1.5">
                      <Bot className="h-4 w-4 text-background" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`relative max-w-[75%] px-3.5 py-2.5 shadow-sm text-sm leading-relaxed
                      ${isUser
                        ? "bg-primary text-primary-foreground rounded-t-2xl rounded-bl-2xl rounded-br-sm"
                        : "bg-card text-card-foreground border rounded-t-2xl rounded-br-2xl rounded-bl-sm"
                      }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.created_at && (
                      <p className="text-[10px] mt-1 text-right opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  {/* User avatar */}
                  {isUser && (
                    <div className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center shrink-0 mt-1 ml-1.5">
                      <User className="h-4 w-4 text-background" />
                    </div>
                  )}
                </div>
              );
            })}

            {sendMutation.isPending && (
              <div className="flex justify-start mb-1">
                <div className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center shrink-0 mt-1 mr-1.5">
                  <Bot className="h-4 w-4 text-background" />
                </div>
                <div className="bg-card border rounded-t-2xl rounded-br-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-muted/40">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sendMutation.isPending}
                className="rounded-full bg-background focus-visible:ring-1"
              />
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || !message.trim()}
                size="icon"
                className="rounded-full shrink-0"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
