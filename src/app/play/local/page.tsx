"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalGameStore } from "@/store/useLocalGameStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCw, CheckCircle2, Users, Plus, X, BarChart3, Sparkles } from "lucide-react";
import { Bottle } from "@/components/Bottle";
import confetti from "canvas-confetti";
import { playTickSound, playTadaSound } from "@/lib/audio";
import { getRandomPrompt } from "@/lib/prompts";

export default function LocalPlayPage() {
  const router = useRouter();
  const { players, phase, currentPlayerId, spinRotation, spinBottle, endTurn, resetGame, addPlayer, removePlayer, stats, recordChoice } = useLocalGameStore();
  const [mounted, setMounted] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [randomPrompt, setRandomPrompt] = useState<string | null>(null);
  const [playerChoice, setPlayerChoice] = useState<'truth' | 'dare' | null>(null);
  const lastTickRef = React.useRef(0);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-purple-500", "bg-green-400", "bg-orange-500"];
    const randomColor = colors[players.length % colors.length];
    
    const emojis = ["🦊", "🐼", "🦁", "🐰", "🐯", "🐨", "🐸", "🐙"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    addPlayer(newPlayerName.trim(), randomEmoji, randomColor);
    setNewPlayerName("");
  };

  useEffect(() => {
    setMounted(true);
    if (players.length < 2) {
      router.push("/create?mode=local");
    }
  }, [players.length, router]);

  useEffect(() => {
    if (phase === 'revealed') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      playTadaSound();
      setRandomPrompt(null);
      setPlayerChoice(null);
    } else if (phase === 'complete') {
      lastTickRef.current = spinRotation; // Reset tick reference when ready for next spin
    }
  }, [phase, spinRotation]);

  if (!mounted || players.length < 2) return null;

  const currentPlayer = players.find(p => p.id === currentPlayerId);

  return (
    <div className="flex flex-col flex-1 h-full w-full max-w-md mx-auto relative overflow-hidden">
      
      {/* Top Bar */}
      <div className="p-4 flex justify-between items-center z-10">
        <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
          Local Game
        </div>
        <button 
          onClick={() => {
            resetGame();
            router.push("/");
          }}
          className="text-gray-400 hover:text-white text-sm transition-colors px-2 py-1"
        >
          Quit
        </button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        
        {/* The Circle */}
        <div className="relative w-80 h-80 flex items-center justify-center">
          
          {/* Players arranged in a circle */}
          {players.map((player, i) => {
            const angle = (i / players.length) * Math.PI * 2;
            const radius = 140; // distance from center
            
            // Adjust angle by -90deg so 1st player is at top
            const adjustedAngle = angle - Math.PI / 2;
            const x = Math.cos(adjustedAngle) * radius;
            const y = Math.sin(adjustedAngle) * radius;
            
            const isSelected = player.id === currentPlayerId && phase !== 'spinning';

            return (
              <div
                key={player.id}
                className="absolute flex flex-col items-center transition-all duration-300"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  zIndex: isSelected ? 20 : 10,
                }}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 transition-all duration-500
                  ${player.color} bg-opacity-20 backdrop-blur-md
                  ${isSelected ? 'border-white scale-125 shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-60'}
                `}>
                  {player.avatar}
                </div>
                <span className={`text-xs font-bold mt-2 transition-all ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {player.name}
                </span>
              </div>
            );
          })}

          {/* The Bottle */}
          <motion.div
            className="relative z-30 cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (phase === 'complete') {
                const velocity = Math.abs(info.velocity.x);
                if (velocity > 100) {
                  spinBottle(velocity);
                }
              }
            }}
            animate={{ rotate: spinRotation }}
            transition={{ duration: 3.5, ease: [0.2, 0.8, 0.2, 1] }} // nice slow down easing
            onUpdate={(latest) => {
              if (phase === 'spinning') {
                const rot = typeof latest.rotate === 'number' ? latest.rotate : parseFloat(latest.rotate as string);
                if (Math.abs(rot - lastTickRef.current) > 30) {
                  playTickSound();
                  lastTickRef.current = rot;
                }
              }
            }}
            onClick={() => {
              if (phase === 'complete') spinBottle();
            }}
          >
            <Bottle />
          </motion.div>

        </div>

        {/* Status Text or Action Button */}
        <div className="mt-16 h-32 w-full px-6 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            
            {phase === 'complete' && (
              <motion.button
                key="spin-btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={() => spinBottle()}
                className="w-full max-w-xs py-4 rounded-full font-bold text-lg text-dark bg-white hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCw className="w-5 h-5" />
                Spin the Bottle!
              </motion.button>
            )}

            {phase === 'spinning' && (
              <motion.p
                key="spinning-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-medium text-gray-300 animate-pulse"
              >
                Spinning...
              </motion.p>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* Overlay Modal when player is selected */}
      <AnimatePresence>
        {phase === 'revealed' && currentPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-0"
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-panel w-full sm:max-w-sm rounded-3xl p-6 flex flex-col items-center border-t border-white/20 sm:border"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${currentPlayer.color} bg-opacity-30 border border-white/30 shadow-xl`}>
                {currentPlayer.avatar}
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">{currentPlayer.name}</h2>
              <p className="text-gray-300 text-center mb-6">
                It's your turn! The group must ask you a Truth or give you a Dare.
              </p>
              
              {!playerChoice ? (
                <div className="flex gap-4 w-full mb-6">
                  <button 
                    onClick={() => {
                      setPlayerChoice('truth');
                      recordChoice('truth');
                    }}
                    className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/40 transition-colors"
                  >
                    Truth
                  </button>
                  <button 
                    onClick={() => {
                      setPlayerChoice('dare');
                      recordChoice('dare');
                    }}
                    className="flex-1 py-4 rounded-xl font-bold text-white bg-red-500/20 border border-red-500/50 hover:bg-red-500/40 transition-colors"
                  >
                    Dare
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {randomPrompt ? (
                    <motion.div
                      key="prompt"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-center"
                    >
                      <p className="text-lg font-medium text-white">{randomPrompt}</p>
                      <button
                        onClick={() => setRandomPrompt(getRandomPrompt(playerChoice))}
                        className="text-xs text-primary mt-3 hover:text-white transition-colors"
                      >
                        Pick Another
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="btn"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setRandomPrompt(getRandomPrompt(playerChoice))}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm mb-6"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      Need an idea?
                    </motion.button>
                  )}
                </AnimatePresence>
              )}
              
              <button 
                onClick={endTurn}
                disabled={!playerChoice}
                className="w-full py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                Done!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {isStatsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Game Stats
                </h2>
                <button 
                  onClick={() => setIsStatsModalOpen(false)}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {players.length === 0 && <p className="text-gray-400">No players.</p>}
                {[...players].sort((a, b) => (stats[b.id]?.spins || 0) - (stats[a.id]?.spins || 0)).map(player => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${player.color} bg-opacity-20`}>
                        {player.avatar}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{player.name}</span>
                        <div className="flex gap-2 text-xs text-gray-400">
                          <span className="text-blue-400">{stats[player.id]?.truths || 0} Truths</span>
                          <span className="text-red-400">{stats[player.id]?.dares || 0} Dares</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-primary font-display flex flex-col items-end">
                      {stats[player.id]?.spins || 0}
                      <span className="text-[10px] text-gray-500 font-sans uppercase font-normal">Spins</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsStatsModalOpen(false)}
                className="w-full mt-6 py-3 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Players Modal */}
      <AnimatePresence>
        {isManageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Manage Players
                </h2>
                <button 
                  onClick={() => setIsManageModalOpen(false)}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddPlayer} className="flex gap-2 mb-6 shrink-0">
                <input 
                  type="text" 
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="New player name..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-primary/50 transition-colors"
                  maxLength={15}
                />
                <button 
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className="bg-primary/20 hover:bg-primary/30 text-primary p-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {players.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${player.color} bg-opacity-20`}>
                        {player.avatar}
                      </div>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <button 
                      onClick={() => removePlayer(player.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {players.length < 2 && (
                <p className="text-red-400 text-sm text-center mt-4">Need at least 2 players!</p>
              )}

              <button 
                onClick={() => setIsManageModalOpen(false)}
                disabled={players.length < 2}
                className="w-full mt-6 py-3 rounded-xl font-bold text-dark bg-white hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-40 pointer-events-none px-4">
        <button 
          onClick={() => setIsStatsModalOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all shadow-lg active:scale-95"
        >
          <BarChart3 className="w-4 h-4 text-primary" /> Stats
        </button>
        <button 
          onClick={() => setIsManageModalOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all shadow-lg active:scale-95"
        >
          <Users className="w-4 h-4 text-primary" /> Players
          <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">{players.length}</span>
        </button>
      </div>

    </div>
  );
}
