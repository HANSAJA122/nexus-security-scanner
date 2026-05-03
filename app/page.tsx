import { ChatPanel } from "@/components/chat-panel";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Header for your project */}
      <div className="mb-6 text-center">
        <h1 className="text-primary font-mono text-2xl tracking-tighter uppercase">
          Cyber-Agent v1.0
        </h1>
        <p className="text-muted-foreground text-xs mt-1 font-mono">
          Secure Terminal Connection Established
        </p>
      </div>
      
      {/* Container for the Chat Panel */}
      <div className="w-full max-w-4xl h-[650px] border border-primary/20 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,0,0.05)] bg-zinc-900/20">
        <ChatPanel />
      </div>
    </main>
  );
}