"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Terminal, AlertTriangle, ShieldCheck, Info, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define the structured finding interface
interface Finding {
  port: number;
  status: string;
  service: string;
  banner: string;
  severity: "critical" | "warning" | "secure" | "info";
  advice: string;
}

interface Message {
  id: string;
  role: "user" | "agent";
  content?: string;
  findings?: Finding[];
  timestamp: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: currentInput }),
      });

      const data = await response.json();

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        findings: data.findings || [],
        content: data.findings?.length === 0 ? "Scan complete. No active services identified on common ports." : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.error("API Error:", err);
      // Optional: Add an error message to the UI here
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Dashboard Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/40 backdrop-blur-md">
        <Terminal className="h-5 w-5 text-primary" />
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-foreground leading-none">CyberAgent V1.1</h2>
          <span className="text-[10px] text-muted-foreground mt-1">Advanced Reconnaissance Engine</span>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold uppercase text-emerald-500 tracking-widest">Live</span>
        </div>
      </div>

      {/* Message Feed */}
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-6 scroll-smooth bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/20 via-background to-background">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}>
            {message.role === "agent" && (
              <div className="flex flex-col items-center gap-1 h-fit">
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              </div>
            )}
            
            <div className={cn("max-w-[85%] space-y-2 flex flex-col", message.role === "user" ? "items-end" : "items-start")}>
              {/* Text Bubbles */}
              {message.content && (
                <div className={cn("rounded-2xl px-4 py-2.5 text-sm shadow-sm border", 
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground border-primary/50" 
                    : "bg-secondary/50 text-secondary-foreground border-border backdrop-blur-sm"
                )}>
                  <p>{message.content}</p>
                </div>
              )}

              {/* Security Findings Grid */}
              {message.findings && message.findings.length > 0 && (
                <div className="grid gap-3 w-full min-w-[320px]">
                  {message.findings.map((finding, i) => (
                    <div key={i} className={cn("group flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300 hover:translate-x-1", 
                      finding.severity === "critical" ? "bg-red-500/5 border-red-500/20 hover:border-red-500/50" :
                      finding.severity === "warning" ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50" :
                      finding.severity === "secure" ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50" :
                      "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {finding.severity === "critical" ? <ShieldAlert className="h-4 w-4 text-red-500" /> :
                           finding.severity === "secure" ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> :
                           <Info className="h-4 w-4 text-blue-400" />}
                          <span className="text-xs font-mono font-black text-foreground uppercase tracking-tight">
                            Port {finding.port} • {finding.service}
                          </span>
                        </div>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border",
                          finding.severity === "critical" ? "bg-red-500/20 border-red-500/30 text-red-400" :
                          finding.severity === "secure" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                          "bg-blue-500/20 border-blue-500/30 text-blue-400"
                        )}>
                          {finding.severity}
                        </span>
                      </div>

                      {/* Code Block for Banner Data */}
                      <div className="bg-black/60 rounded-md p-2 border border-white/5 font-mono">
                        <p className="text-[9px] text-muted-foreground mb-1 uppercase font-bold tracking-widest">Server Response (Banner)</p>
                        <code className="text-[10px] text-primary/90 break-all leading-tight">
                          {finding.banner || "No banner response from service."}
                        </code>
                      </div>

                      <p className="text-[11px] text-muted-foreground/90 font-medium leading-relaxed bg-white/5 p-2 rounded border border-white/5">
                        {finding.advice}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <span className="text-[9px] opacity-40 px-2 uppercase font-black tracking-widest">{message.timestamp}</span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-3 text-primary animate-pulse">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Executing Banner Grabbing Analysis...</span>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 bg-muted/30 border-t border-border backdrop-blur-md">
        <div className="flex gap-2 bg-background/50 border border-border p-1.5 rounded-2xl shadow-inner focus-within:ring-2 ring-primary/20 transition-all duration-300">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Enter target IP or Domain (e.g. google.com)"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50"
          />
          <Button onClick={handleSend} size="icon" className="rounded-xl shadow-lg transition-transform active:scale-95">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground mt-3 uppercase tracking-widest opacity-50 font-bold">
          Authorized Security Testing Only
        </p>
      </div>
    </div>
  );
}