"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_PROMPTS = [
  {
    label: "I need encouragement",
    prompt: "I'm feeling discouraged and low. What content on Kairo can lift my spirit right now?",
  },
  {
    label: "Content for my kids",
    prompt: "What's the best content on Kairo for young children? My kids are around 4–8 years old.",
  },
  {
    label: "I'm anxious",
    prompt:
      "I'm feeling anxious and overwhelmed. Can you suggest content and give me a short 3-day prayer plan?",
  },
  {
    label: "Grow my faith",
    prompt:
      "I want to go deeper spiritually. What teachings or documentaries do you recommend for spiritual growth?",
  },
];

const GREETING: Message = {
  role: "assistant",
  content:
    "Peace to you ✦\n\nI'm Kairo, your spiritual companion. I can help you find the right content for this moment, answer a biblical question, or create a prayer plan for you.\n\nWhat's on your heart today?",
};

export function SpiritualAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function handleClose() {
    if (streaming) {
      abortRef.current?.abort();
    }
    setOpen(false);
  }

  function handleReset() {
    if (streaming) {
      abortRef.current?.abort();
    }
    setMessages([GREETING]);
    setInput("");
    setStreaming(false);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStreaming(true);

    // Append empty assistant bubble to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            updated[updated.length - 1] = {
              role: last.role,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  const showQuickPrompts = messages.length === 1;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-gradient-to-r from-kairo-gold to-kairo-gold-light text-kairo-dark",
          "font-semibold text-sm shadow-xl shadow-kairo-gold/25",
          "hover:scale-105 active:scale-95 transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-kairo-gold focus-visible:ring-offset-2 focus-visible:ring-offset-kairo-dark",
          open && "opacity-0 pointer-events-none"
        )}
        aria-label="Open Kairo AI Spiritual Companion"
      >
        <Sparkles size={15} className="shrink-0" />
        <span>Ask Kairo AI</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 w-[380px] flex flex-col",
            "bg-kairo-dark-card border border-kairo-dark-border rounded-2xl",
            "shadow-2xl shadow-black/60",
            "animate-slide-up"
          )}
          style={{ maxHeight: "min(600px, calc(100vh - 6rem))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-kairo-dark-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kairo-gold to-kairo-gold-light flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-kairo-dark" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">Kairo AI</p>
                <p className="text-[11px] text-white/40 mt-0.5">Spiritual companion</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Start new conversation"
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-kairo-dark-muted transition-colors"
                aria-label="New conversation"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-kairo-dark-muted transition-colors"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-kairo-gold text-kairo-dark font-medium rounded-2xl rounded-br-sm"
                      : "bg-kairo-dark-muted text-white/90 rounded-2xl rounded-bl-sm"
                  )}
                >
                  {msg.content ||
                    (streaming && i === messages.length - 1 ? (
                      <span className="inline-flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:120ms]" />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:240ms]" />
                      </span>
                    ) : null)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts — shown only on first interaction */}
          {showQuickPrompts && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  disabled={streaming}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors",
                    "border-kairo-dark-border text-white/50",
                    "hover:border-kairo-gold/40 hover:text-white/90 hover:bg-kairo-gold/5",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 bg-kairo-dark-muted border border-kairo-dark-border rounded-xl px-3 py-2.5 focus-within:border-kairo-gold/30 transition-colors"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                disabled={streaming}
                maxLength={500}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className={cn(
                  "p-1.5 rounded-lg transition-colors shrink-0",
                  input.trim() && !streaming
                    ? "text-kairo-gold hover:bg-kairo-gold/10"
                    : "text-white/15 cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
