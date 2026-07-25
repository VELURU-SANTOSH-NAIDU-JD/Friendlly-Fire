import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Room } from '@/models/Room';
import { Player } from '@/models/Player';
import { BankEntry } from '@/models/BankEntry';
import { Turn } from '@/models/Turn';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await connectDB();
    const { code } = await params;
    
    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const players = await Player.find({ roomId: room.code, connectionStatus: 'connected' });
    if (players.length < 2) return NextResponse.json({ error: 'Not enough players' }, { status: 400 });

    // Pick random player
    const targetPlayer = players[Math.floor(Math.random() * players.length)];

    // Pick random eligible bank entry
    // - approved: true
    // - used: false
    // - visibility: everyone OR targetPlayerIds includes targetPlayer._id
    const eligibleEntries = await BankEntry.find({
      roomId: room.code,
      approved: true,
      used: false,
      $or: [
        { visibility: 'everyone' },
        { targetPlayerIds: targetPlayer._id.toString() }
      ]
    });

    if (eligibleEntries.length === 0) {
      return NextResponse.json({ error: 'empty_bank' }, { status: 400 });
    }

    const selectedEntry = eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)];

    // Create a new Turn
    const turn = await Turn.create({
      roomId: room.code,
      currentPlayerId: targetPlayer._id,
      bankEntryId: selectedEntry._id,
      phase: 'spinning'
    });

    // Notify all clients to start the spin animation pointing to the target player
    // Include the entry details so they can be revealed after the spin
    await pusherServer.trigger(`presence-room-${room.code}`, 'spin-started', {
      turnId: turn._id,
      targetPlayerId: targetPlayer._id,
      entry: selectedEntry
    });

    return NextResponse.json({ turn });
  } catch (error) {
    console.error('Failed to start turn:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
