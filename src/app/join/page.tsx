"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (res.ok) {
        router.push(`/join/${code.toUpperCase()}`);
      } else {
        setError("Room not found");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 w-full max-w-md mx-auto h-full justify-center">
      <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-primary/20 text-primary">
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold font-display mb-2">Join Game</h1>
        <p className="text-gray-400 mb-8">Enter the 6-character room code from the host.</p>
        
        <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
          <input 
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Room Code (e.g. FX9K2Q)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.2em] text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors uppercase"
            maxLength={6}
          />
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button 
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full py-4 mt-2 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Checking..." : "Next"}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
        
        <button onClick={() => router.push("/")} className="mt-6 text-gray-500 hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
