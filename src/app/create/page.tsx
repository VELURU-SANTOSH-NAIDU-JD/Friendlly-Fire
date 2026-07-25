"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocalGameStore } from "@/store/useLocalGameStore";
import { Users, Plus, X, Play, ArrowLeft } from "lucide-react";
import { Suspense } from "react";

function CreateGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "local";
  
  const { players, addPlayer, removePlayer, startGame } = useLocalGameStore();
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    // Fun colors for players
    const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-purple-500", "bg-green-400", "bg-orange-500"];
    const randomColor = colors[players.length % colors.length];
    
    // Avatars can just be emojis for now
    const emojis = ["🦊", "🐼", "🦁", "🐰", "🐯", "🐨", "🐸", "🐙"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    addPlayer(newPlayerName.trim(), randomEmoji, randomColor);
    setNewPlayerName("");
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleStartLocalGame = () => {
    if (players.length < 2) return;
    startGame();
    router.push("/play/local");
  };

  const handleCreateNetworkGame = async () => {
    try {
      setIsCreating(true);
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/join/${data.room.code}`);
      } else {
        alert("Failed to create room");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  if (mode === "party" || mode === "online") {
    return (
      <div className="flex flex-col flex-1 p-6 w-full max-w-md mx-auto h-full justify-center">
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-opacity-20 ${mode === 'party' ? 'bg-secondary text-secondary' : 'bg-accent text-accent'}`}>
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-2 capitalize">{mode} Mode</h1>
          <p className="text-gray-400 mb-8">
            {mode === 'party' 
              ? "Gather your friends in the same room. Everyone joins on their phone." 
              : "Play remotely with friends. Includes voice and photo uploads."}
          </p>
          
          <button 
            onClick={handleCreateNetworkGame}
            disabled={isCreating}
            className="w-full py-4 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreating ? "Creating Room..." : "Create Room"}
            {!isCreating && <Play className="w-5 h-5" />}
          </button>
          
          <button onClick={() => router.push("/")} className="mt-4 text-gray-500 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-6 w-full max-w-md mx-auto h-full">
      <div className="flex items-center gap-3 mb-8 pt-4">
        <button 
          onClick={() => router.push("/")}
          className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Users className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-display">Local Mode</h1>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col min-h-0 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Who is playing?</h2>
        
        <form onSubmit={handleAddPlayer} className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Enter player name"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-primary/50 transition-colors"
            maxLength={15}
          />
          <button 
            type="submit"
            disabled={!newPlayerName.trim()}
            className="bg-primary/20 hover:bg-primary/30 text-primary p-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {players.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <p>Add at least 2 players to start!</p>
            </div>
          ) : (
            players.map(player => (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${player.color} bg-opacity-20`}>
                    {player.avatar}
                  </div>
                  <span className="font-medium text-lg">{player.name}</span>
                </div>
                <button 
                  onClick={() => removePlayer(player.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <button 
        onClick={handleStartLocalGame}
        disabled={players.length < 2}
        className="w-full py-4 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mb-6"
      >
        <Play className="w-5 h-5" />
        Let's Go!
      </button>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <CreateGameForm />
    </Suspense>
  );
}
