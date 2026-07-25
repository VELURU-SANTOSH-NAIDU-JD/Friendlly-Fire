"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { usePartyStore } from "@/store/usePartyStore";
import { usePusherRoom } from "@/hooks/usePusherRoom";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, CheckCircle2, LibraryBig } from "lucide-react";
import { Bottle } from "@/components/Bottle";

export default function PartyPlayPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { code } = use(params);
  const { myPlayerId } = usePartyStore();
  const channel = usePusherRoom(code);

  const [players, setPlayers] = useState<any[]>([]);
  const [phase, setPhase] = useState<'complete' | 'spinning' | 'answering' | 'proof_pending'>('complete');
  const [spinRotation, setSpinRotation] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [emptyBank, setEmptyBank] = useState(false);
  
  const [answerText, setAnswerText] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (phase === 'answering' && timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [phase, timeLeft]);

  useEffect(() => {
    fetch(`/api/players/${code}`).then(res => res.json()).then(data => setPlayers(data.players));
  }, [code]);

  useEffect(() => {
    if (!channel) return;

    channel.bind('player-joined', (data: { player: any }) => {
      setPlayers(prev => prev.find(p => p._id === data.player._id) ? prev : [...prev, data.player]);
    });

    channel.bind('spin-started', (data: { turnId: string, targetPlayerId: string, entry: any }) => {
      setCurrentTurnId(data.turnId);
      setCurrentPlayerId(data.targetPlayerId);
      setCurrentEntry(data.entry);
      setEmptyBank(false);

      // We need to calculate the exact rotation so the bottle points to targetPlayerId
      setPlayers(currentPlayers => {
        const targetIndex = currentPlayers.findIndex(p => p._id === data.targetPlayerId);
        if (targetIndex !== -1) {
          const anglePerPlayer = 360 / currentPlayers.length;
          const targetAngle = targetIndex * anglePerPlayer;
          
          setSpinRotation(prev => {
            const extraSpins = 360 * 6; // 6 full spins
            return prev + extraSpins + targetAngle - (prev % 360);
          });
        }
        return currentPlayers;
      });

      setAnswerText("");
      setTimeLeft(60);
      setPhase('spinning');
      setTimeout(() => setPhase('answering'), 3500); // Wait for animation
    });

    channel.bind('answer-submitted', (data: { turnId: string, answerText: string }) => {
      setAnswerText(data.answerText);
      setPhase('proof_pending');
    });

    channel.bind('turn-completed', () => {
      setPhase('complete');
      setCurrentPlayerId(null);
      setCurrentEntry(null);
    });

    return () => {
      channel.unbind('player-joined');
      channel.unbind('spin-started');
      channel.unbind('answer-submitted');
      channel.unbind('turn-completed');
    };
  }, [channel]);

  const handleSpin = async () => {
    if (phase !== 'complete') return;
    const res = await fetch(`/api/rooms/${code}/turn`, { method: 'POST' });
    const data = await res.json();
    if (data.error === 'empty_bank') {
      setEmptyBank(true);
      setTimeout(() => setEmptyBank(false), 3000);
    }
  };

  const handleComplete = async () => {
    if (!currentTurnId) return;
    await fetch(`/api/turns/${currentTurnId}/complete`, { method: 'POST' });
  };

  const handleSubmitAnswer = async () => {
    if (!currentTurnId || !answerText.trim()) return;
    await fetch(`/api/turns/${currentTurnId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerText })
    });
  };

  const me = players.find(p => p._id === myPlayerId);
  const isHost = me?.isHost;
  const isMyTurn = currentPlayerId === myPlayerId;

  if (players.length === 0) return null;

  return (
    <div className="flex flex-col flex-1 h-full w-full max-w-md mx-auto relative overflow-hidden">
      
      {/* Top Bar */}
      <div className="p-4 flex justify-between items-center z-10">
        <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium tracking-widest">
          {code}
        </div>
        <button 
          onClick={() => router.push(`/room/${code}/bank`)}
          className="flex items-center gap-2 text-white bg-primary/20 hover:bg-primary/40 px-3 py-1.5 rounded-full text-sm transition-colors"
        >
          <LibraryBig className="w-4 h-4" /> Bank
        </button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-80 h-80 flex items-center justify-center">
          {players.map((player, i) => {
            const angle = (i / players.length) * Math.PI * 2;
            const radius = 140;
            const adjustedAngle = angle - Math.PI / 2;
            const x = Math.cos(adjustedAngle) * radius;
            const y = Math.sin(adjustedAngle) * radius;
            const isSelected = player._id === currentPlayerId && phase !== 'spinning';

            return (
              <div
                key={player._id}
                className="absolute flex flex-col items-center transition-all duration-300"
                style={{ transform: `translate(${x}px, ${y}px)`, zIndex: isSelected ? 20 : 10 }}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 transition-all duration-500
                  ${player.color} bg-opacity-20 backdrop-blur-md
                  ${isSelected ? 'border-white scale-125 shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-60'}
                `}>
                  {player.avatar}
                </div>
                <span className={`text-xs font-bold mt-2 transition-all ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {player.name} {player._id === myPlayerId ? "(You)" : ""}
                </span>
              </div>
            );
          })}

          <motion.div
            className="relative z-30 cursor-pointer"
            animate={{ rotate: spinRotation }}
            transition={{ duration: 3.5, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={() => isHost && handleSpin()}
          >
            <Bottle />
          </motion.div>
        </div>

        <div className="mt-16 h-32 w-full px-6 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === 'complete' && isHost && (
              <motion.button
                key="spin-btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={handleSpin}
                className="w-full max-w-xs py-4 rounded-full font-bold text-lg text-dark bg-white hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCw className="w-5 h-5" />
                Spin the Bottle
              </motion.button>
            )}
            {phase === 'complete' && !isHost && (
              <motion.p
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-400 font-medium"
              >
                Waiting for host to spin...
              </motion.p>
            )}
            {emptyBank && (
               <motion.p
               key="empty-bank"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="text-red-400 font-bold mt-2"
             >
               The bank is empty! Add more entries.
             </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Overlay Modal */}
      <AnimatePresence>
        {(phase === 'answering' || phase === 'proof_pending') && currentEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col items-center text-center border-t-4 ${currentEntry.type === 'truth' ? 'border-t-secondary' : 'border-t-primary'}`}
            >
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${currentEntry.type === 'truth' ? 'text-secondary' : 'text-primary'}`}>
                {currentEntry.type}
              </h3>
              
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4 leading-tight">
                "{currentEntry.text}"
              </h2>

              <p className="text-gray-400 text-sm mb-6">
                Target: <span className="font-bold text-white">{players.find(p => p._id === currentPlayerId)?.name}</span>
              </p>
              
              {phase === 'answering' && isMyTurn && (
                <div className="w-full flex flex-col gap-4">
                  <div className="flex justify-between items-center text-sm font-bold text-accent">
                    <span>Submit your proof</span>
                    <span>{timeLeft}s</span>
                  </div>
                  <textarea 
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Type your answer or proof..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-white/30 resize-none h-24"
                  />
                  <button 
                    onClick={handleSubmitAnswer}
                    disabled={!answerText.trim()}
                    className="w-full py-4 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              )}

              {phase === 'answering' && !isMyTurn && (
                <div className="w-full py-4 bg-white/5 rounded-xl border border-white/10 text-gray-300 animate-pulse">
                  Waiting for {players.find(p => p._id === currentPlayerId)?.name} to answer... ({timeLeft}s)
                </div>
              )}

              {phase === 'proof_pending' && (
                <div className="w-full flex flex-col gap-4">
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-left">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Submitted Proof</p>
                    <p className="text-lg text-white">"{answerText}"</p>
                  </div>
                  
                  {isHost ? (
                    <button 
                      onClick={handleComplete}
                      className="w-full py-4 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Approve & Complete
                    </button>
                  ) : (
                    <div className="w-full py-4 text-center text-gray-400">
                      Waiting for host approval...
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
