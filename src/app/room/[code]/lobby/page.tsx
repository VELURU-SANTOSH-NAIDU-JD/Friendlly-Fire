"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { usePartyStore } from "@/store/usePartyStore";
import { usePusherRoom } from "@/hooks/usePusherRoom";
import { Users, Play, LibraryBig, Copy, Check } from "lucide-react";

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { code } = use(params);
  const { myPlayerId } = usePartyStore();
  
  const [players, setPlayers] = useState<any[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const channel = usePusherRoom(code);

  useEffect(() => {
    if (!myPlayerId) {
      router.push(`/join/${code}`);
      return;
    }

    // Fetch initial room & players
    fetch(`/api/rooms/${code}`).then(res => res.json()).then(data => setRoom(data.room));
    fetch(`/api/players/${code}`).then(res => res.json()).then(data => setPlayers(data.players));
  }, [code, myPlayerId, router]);

  useEffect(() => {
    if (!channel) return;

    const handlePlayerJoined = (data: { player: any }) => {
      setPlayers(prev => {
        // Prevent duplicates in strict mode
        if (prev.find(p => p._id === data.player._id)) return prev;
        return [...prev, data.player];
      });
    };

    const handleGameStarted = () => {
      router.push(`/room/${code}/play`);
    };

    channel.bind('player-joined', handlePlayerJoined);
    channel.bind('game-started', handleGameStarted);

    return () => {
      channel.unbind('player-joined', handlePlayerJoined);
      channel.unbind('game-started', handleGameStarted);
    };
  }, [channel, code, router]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    await fetch(`/api/rooms/${code}/start`, { method: 'POST' });
    // Pusher event will redirect everyone
  };

  if (!room || players.length === 0) {
    return <div className="flex-1 flex items-center justify-center">Loading Lobby...</div>;
  }

  const me = players.find(p => p._id === myPlayerId);
  const isHost = me?.isHost;

  return (
    <div className="flex flex-col flex-1 p-6 w-full max-w-md mx-auto h-full">
      
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Room Code</p>
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl font-bold font-display tracking-[0.2em]">{code}</h1>
          <button 
            onClick={handleCopyLink}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col min-h-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            Players ({players.length})
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {players.map(player => (
            <div key={player._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${player.color} bg-opacity-20`}>
                  {player.avatar}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight">
                    {player.name} {player._id === myPlayerId && "(You)"}
                  </span>
                  {player.isHost && <span className="text-xs text-accent font-bold uppercase tracking-wider">Host</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => router.push(`/room/${code}/bank`)}
          className="w-full py-4 rounded-xl font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
        >
          <LibraryBig className="w-5 h-5" />
          Add to Question Bank
        </button>

        {isHost ? (
          <button 
            onClick={handleStartGame}
            disabled={players.length < 2}
            className="w-full py-4 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {players.length < 2 ? "Waiting for players..." : "Start Game"}
          </button>
        ) : (
          <div className="w-full py-4 rounded-xl font-bold text-gray-400 bg-white/5 border border-white/5 flex items-center justify-center gap-2 text-center">
            Waiting for host to start...
          </div>
        )}
      </div>

    </div>
  );
}
