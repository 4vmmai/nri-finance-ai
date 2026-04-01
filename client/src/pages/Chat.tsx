import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageSquare, Brain, Search, Zap, Send, Plus, Trash2,
  Bot, User, ChevronDown, Info, CheckCircle2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { ChatSession, ChatMessage } from "@shared/schema";

const AI_MODES = [
  {
    id: "conversational",
    label: "Conversational",
    icon: MessageSquare,
    color: "mode-conversational",
    borderActive: "border-blue-400",
    desc: "Natural Q&A style responses",
    tip: "Best for: simple questions, explanations, comparisons",
  },
  {
    id: "agentic",
    label: "Agentic AI",
    icon: Brain,
    color: "mode-agentic",
    borderActive: "border-purple-400",
    desc: "Multi-step reasoning with action plans",
    tip: "Best for: complex tax scenarios, investment planning, compliance tasks",
  },
  {
    id: "rag",
    label: "RAG",
    icon: Search,
    color: "mode-rag",
    borderActive: "border-emerald-400",
    desc: "Retrieval from verified knowledge base",
    tip: "Best for: laws, rules, exact regulations, policy lookups",
  },
  {
    id: "augmented",
    label: "Augmented",
    icon: Zap,
    color: "mode-augmented",
    borderActive: "border-orange-400",
    desc: "Personalized advice based on your profile",
    tip: "Best for: personalized planning, profile-based guidance",
  },
];

const SAMPLE_QUESTIONS = [
  "What is the difference between NRE and NRO accounts?",
  "How do I file income tax in India as an NRI?",
  "Can I buy agricultural land in India as an NRI?",
  "What is the repatriation limit from NRO account?",
  "How does DTAA help me avoid double taxation?",
  "What are the rules for investing in stocks as an NRI?",
];

export default function Chat() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [activeMode, setActiveMode] = useState<string>("conversational");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive session ID from URL params
  const sessionId = params.id ? Number(params.id) : null;

  const { data: sessions = [], refetch: refetchSessions } = useQuery<ChatSession[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/sessions", sessionId, "messages"],
    queryFn: async () => {
      if (!sessionId) return [];
      return (await apiRequest("GET", `/api/sessions/${sessionId}/messages`)).json();
    },
    enabled: !!sessionId,
    refetchInterval: isTyping ? 1000 : false,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput("");
    setIsSending(true);
    setIsTyping(true);

    try {
      let sid = sessionId;

      if (!sid) {
        // Create a new session first
        const title = trimmed.slice(0, 50) + (trimmed.length > 50 ? "..." : "");
        const newSession: ChatSession = await (await apiRequest("POST", "/api/sessions", { title, mode: activeMode })).json();
        sid = newSession.id;
        await qc.invalidateQueries({ queryKey: ["/api/sessions"] });
        navigate(`/chat/${sid}`);
        // Small delay to let navigation happen
        await new Promise(r => setTimeout(r, 100));
      }

      // Send the message
      await apiRequest("POST", `/api/sessions/${sid}/chat`, { message: trimmed, mode: activeMode });

      await qc.invalidateQueries({ queryKey: ["/api/sessions", sid, "messages"] });
      await qc.invalidateQueries({ queryKey: ["/api/sessions"] });
    } catch (e) {
      console.error("Send failed:", e);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    await apiRequest("DELETE", `/api/sessions/${id}`);
    await qc.invalidateQueries({ queryKey: ["/api/sessions"] });
    if (sessionId === id) navigate("/chat");
  };

  const activeModeMeta = AI_MODES.find(m => m.id === activeMode)!;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sessions Sidebar */}
      <div className="hidden md:flex flex-col w-56 border-r border-border bg-card flex-shrink-0">
        <div className="p-3 border-b border-border">
          <Button
            onClick={() => navigate("/chat")}
            size="sm"
            className="w-full gap-2 text-xs"
            data-testid="button-new-chat"
          >
            <Plus size={13} />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4 px-2">
                No chats yet. Start a conversation!
              </p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg cursor-pointer group transition-colors text-xs",
                  sessionId === session.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/60"
                )}
                onClick={() => navigate(`/chat/${session.id}`)}
                data-testid={`session-${session.id}`}
              >
                <MessageSquare size={12} className="mt-0.5 flex-shrink-0 opacity-60" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{session.title}</div>
                  <Badge variant="outline" className={cn("text-[9px] py-0 h-3 mt-0.5", AI_MODES.find(m => m.id === session.mode)?.color)}>
                    {session.mode}
                  </Badge>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-destructive shrink-0 mt-0.5"
                  data-testid={`delete-session-${session.id}`}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mode Selector */}
        <div className="flex-shrink-0 border-b border-border bg-card px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="text-xs text-muted-foreground flex-shrink-0 font-medium">Mode:</span>
            <TooltipProvider>
              {AI_MODES.map(mode => {
                const Icon = mode.icon;
                const active = activeMode === mode.id;
                return (
                  <Tooltip key={mode.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveMode(mode.id)}
                        data-testid={`mode-${mode.id}`}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 border",
                          active
                            ? `${mode.color} ${mode.borderActive} ai-active`
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <Icon size={11} />
                        {mode.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-52">
                      <p className="font-semibold mb-0.5">{mode.label}</p>
                      <p className="text-xs opacity-80">{mode.tip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {!sessionId && messages.length === 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8 mt-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bot size={26} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">NRI Finance AI Assistant</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Ask me anything about managing your finances in India as an NRI. 
                  Choose an AI mode above for different types of assistance.
                </p>
                <div className={cn(
                  "inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-medium border",
                  activeModeMeta.color, activeModeMeta.borderActive
                )}>
                  <activeModeMeta.icon size={12} />
                  Active: {activeModeMeta.label} — {activeModeMeta.desc}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Try asking:</p>
                {SAMPLE_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="w-full text-left text-sm p-3 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all group"
                    data-testid="sample-question"
                  >
                    <span className="flex items-start gap-2">
                      <ChevronDown size={14} className="mt-0.5 flex-shrink-0 text-primary group-hover:translate-y-0.5 transition-transform rotate-[-90deg]" />
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "message-enter flex gap-3 max-w-4xl",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} className="text-primary" />}
              </div>

              <div className={cn("flex-1 min-w-0", msg.role === "user" ? "text-right" : "")}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {msg.role === "assistant" && msg.aiMode && (
                    <Badge className={cn("text-[10px] py-0 h-4", AI_MODES.find(m => m.id === msg.aiMode)?.color || "mode-conversational")}>
                      {AI_MODES.find(m => m.id === msg.aiMode)?.label || msg.aiMode}
                    </Badge>
                  )}
                </div>

                {msg.role === "assistant" && msg.agentSteps && (() => {
                  const steps = JSON.parse(msg.agentSteps) as string[];
                  return (
                    <div className="mb-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 mb-1.5 flex items-center gap-1">
                        <Brain size={10} />
                        Agent Reasoning Steps
                      </div>
                      {steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1">
                          <CheckCircle2 size={10} className="text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-[11px] text-purple-700 dark:text-purple-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className={cn(
                  "rounded-2xl px-4 py-3 text-sm inline-block max-w-full",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border rounded-tl-sm text-foreground"
                )}>
                  {msg.role === "assistant" ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                {msg.role === "assistant" && msg.sources && (() => {
                  const sources = JSON.parse(msg.sources) as string[];
                  return sources.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {sources.map((src, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0 h-4 text-muted-foreground">
                          <Info size={9} className="mr-1" />
                          {src}
                        </Badge>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 message-enter">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                  <span className="text-xs text-muted-foreground ml-1">AI thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask about NRI finance... (${activeModeMeta.label} mode)`}
                className="resize-none min-h-[44px] max-h-32 text-sm"
                rows={1}
                data-testid="input-message"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                size="icon"
                className="h-11 w-11 flex-shrink-0"
                data-testid="button-send"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Press Enter to send • Shift+Enter for new line • For educational purposes only — consult a CA for personalized advice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
