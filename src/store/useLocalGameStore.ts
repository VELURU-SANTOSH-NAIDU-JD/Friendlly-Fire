import { create } from 'zustand';

export interface LocalPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface PlayerStats {
  spins: number;
  truths: number;
  dares: number;
}

interface LocalGameState {
  players: LocalPlayer[];
  currentPlayerId: string | null;
  phase: 'setup' | 'spinning' | 'revealed' | 'complete';
  spinRotation: number;
  stats: Record<string, PlayerStats>;
  
  // Actions
  addPlayer: (name: string, avatar: string, color: string) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  spinBottle: (velocity?: number) => void;
  recordChoice: (choice: 'truth' | 'dare') => void;
  endTurn: () => void;
  resetGame: () => void;
}

export const useLocalGameStore = create<LocalGameState>((set, get) => ({
  players: [],
  currentPlayerId: null,
  phase: 'setup',
  spinRotation: 0,
  stats: {},

  addPlayer: (name, avatar, color) => set((state) => ({
    players: [...state.players, { id: crypto.randomUUID(), name, avatar, color }]
  })),

  removePlayer: (id) => set((state) => {
    const isRemovingCurrent = state.currentPlayerId === id;
    return {
      players: state.players.filter(p => p.id !== id),
      ...(isRemovingCurrent && { phase: 'complete', currentPlayerId: null })
    };
  }),

  startGame: () => {
    const { players } = get();
    if (players.length < 2) return;
    set({ phase: 'complete' }); // Ready for first spin
  },

  spinBottle: (velocity = 0) => {
    const { players, spinRotation, stats } = get();
    if (players.length < 2) return;
    
    // Pick random player
    const targetIndex = Math.floor(Math.random() * players.length);
    const targetPlayer = players[targetIndex];
    
    // Calculate rotation: 
    // We want the bottle to spin at least 5 times (1800 deg) plus the angle to point to the player
    const anglePerPlayer = 360 / players.length;
    const targetAngle = targetIndex * anglePerPlayer;
    
    // Extra spins based on velocity or random if clicked
    const baseSpins = velocity > 100 ? Math.floor(velocity / 200) : 5 + Math.floor(Math.random() * 4);
    const extraSpins = 360 * Math.max(3, baseSpins);
    
    // Ensure we always rotate forward from current rotation by a large amount
    const newRotation = spinRotation + extraSpins + targetAngle - (spinRotation % 360);

    const currentStats = stats[targetPlayer.id] || { spins: 0, truths: 0, dares: 0 };

    set({ 
      phase: 'spinning',
      spinRotation: newRotation,
      currentPlayerId: targetPlayer.id,
      stats: { ...stats, [targetPlayer.id]: { ...currentStats, spins: currentStats.spins + 1 } }
    });
    
    // Auto transition to revealed after animation ends (e.g., 3s)
    setTimeout(() => {
      set({ phase: 'revealed' });
    }, 3000);
  },

  recordChoice: (choice) => set((state) => {
    if (!state.currentPlayerId) return state;
    const pId = state.currentPlayerId;
    const currentStats = state.stats[pId] || { spins: 0, truths: 0, dares: 0 };
    return {
      stats: {
        ...state.stats,
        [pId]: {
          ...currentStats,
          truths: choice === 'truth' ? currentStats.truths + 1 : currentStats.truths,
          dares: choice === 'dare' ? currentStats.dares + 1 : currentStats.dares
        }
      }
    };
  }),

  endTurn: () => set({ phase: 'complete', currentPlayerId: null }),
  
  resetGame: () => set({ players: [], currentPlayerId: null, phase: 'setup', spinRotation: 0, stats: {} })
}));
