import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PartyState {
  roomCode: string | null;
  myPlayerId: string | null;
  
  setJoinInfo: (roomCode: string, playerId: string) => void;
  clearJoinInfo: () => void;
}

export const usePartyStore = create<PartyState>()(
  persist(
    (set) => ({
      roomCode: null,
      myPlayerId: null,

      setJoinInfo: (roomCode, playerId) => set({ roomCode, myPlayerId: playerId }),
      clearJoinInfo: () => set({ roomCode: null, myPlayerId: null })
    }),
    {
      name: 'friendlly-fire-party-storage',
    }
  )
);
