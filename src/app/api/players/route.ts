import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Player } from '@/models/Player';
import { Room } from '@/models/Room';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { code, name, avatar, color } = body;

    const room = await Room.findOne({ code: code.toUpperCase() });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status === 'ended') {
      return NextResponse.json({ error: 'Room has ended' }, { status: 400 });
    }

    // Check if player is the first one, meaning they are the host
    const existingPlayersCount = await Player.countDocuments({ roomId: room.code });
    const isHost = existingPlayersCount === 0;

    const player = await Player.create({
      roomId: room.code,
      name,
      avatar,
      color,
      isHost,
      connectionStatus: 'connected'
    });

    if (isHost) {
      room.hostPlayerId = player._id.toString();
      await room.save();
    }

    // Trigger Pusher event
    await pusherServer.trigger(`presence-room-${room.code}`, 'player-joined', {
      player
    });

    return NextResponse.json({ player, room }, { status: 201 });
  } catch (error) {
    console.error('Failed to join room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
