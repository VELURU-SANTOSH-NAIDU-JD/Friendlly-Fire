"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, User } from "lucide-react";
import { usePartyStore } from "@/store/usePartyStore";

export default function JoinRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { code } = use(params);
  const { setJoinInfo } = usePartyStore();

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roomValid, setRoomValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if room is valid
    fetch(`/api/rooms/${code}`)
      .then(res => {
        if (res.ok) setRoomValid(true);
        else setRoomValid(false);
      })
      .catch(() => setRoomValid(false));
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    setError("");

    try {
      // Pick random color and avatar
      const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-purple-500", "bg-green-400", "bg-orange-500"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const emojis = ["🦊", "🐼", "🦁", "🐰", "🐯", "🐨", "🐸", "🐙"];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name: name.trim(),
          avatar: randomEmoji,
          color: randomColor
        })
      });

      const data = await res.json();

      if (res.ok) {
        setJoinInfo(code, data.player._id);
        router.push(`/room/${code}/lobby`);
      } else {
        setError(data.error || "Failed to join room");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (roomValid === null) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (roomValid === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Room Not Found</h2>
        <p className="text-gray-400 mb-8">The room code {code} is invalid or has expired.</p>
        <button onClick={() => router.push("/join")} className="px-6 py-2 bg-white text-dark font-bold rounded-full">
          Try Another Code
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-6 w-full max-w-md mx-auto h-full justify-center">
      <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-secondary/20 text-secondary">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold font-display mb-2">Who are you?</h1>
        <p className="text-gray-400 mb-8">Joining room <span className="font-bold text-white tracking-widest">{code}</span></p>
        
        <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-bold text-white placeholder-gray-600 outline-none focus:border-secondary/50 transition-colors"
            maxLength={15}
          />
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button 
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-4 mt-2 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Joining..." : "Join Party"}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
        
        <button onClick={() => router.push("/join")} className="mt-6 text-gray-500 hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
