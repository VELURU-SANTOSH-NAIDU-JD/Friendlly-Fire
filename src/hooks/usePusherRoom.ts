import { useEffect, useState } from 'react';
import { getPusherClient } from '@/lib/pusherClient';
import { usePartyStore } from '@/store/usePartyStore';
import type { Channel } from 'pusher-js';

export function usePusherRoom(roomCode: string) {
  const { myPlayerId } = usePartyStore();
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!roomCode || !myPlayerId) return;

    const pusher = getPusherClient();
    if (!pusher) return;
    
    // Pass user_id for presence channel authentication
    pusher.config.auth = {
      params: { user_id: myPlayerId }
    };

    const channelName = `presence-room-${roomCode}`;
    
    // Check if already subscribed to avoid multiple subscriptions in dev strict mode
    const existingChannel = pusher.channel(channelName);
    const chan = existingChannel || pusher.subscribe(channelName);
    
    setChannel(chan);

    return () => {
      // In a real app we might not unsubscribe on every re-render, but strict mode can be tricky.
      // We will leave the channel subscribed and only unsubscribe if roomCode changes.
    };
  }, [roomCode, myPlayerId]);

  return channel;
}
