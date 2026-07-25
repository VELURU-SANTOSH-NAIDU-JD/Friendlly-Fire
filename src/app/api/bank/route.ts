import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { BankEntry } from '@/models/BankEntry';
import { Room } from '@/models/Room';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { roomId, type, text, authorPlayerId, isAnonymous, visibility, targetPlayerIds } = body;

    const room = await Room.findOne({ code: roomId.toUpperCase() });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const approved = !room.settings.requireHostApproval;

    const entry = await BankEntry.create({
      roomId: room.code,
      type,
      text,
      authorPlayerId,
      isAnonymous,
      visibility,
      targetPlayerIds: targetPlayerIds || [],
      approved,
      used: false
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Failed to add bank entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    
    if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });

    await connectDB();
    const entries = await BankEntry.find({ roomId: roomId.toUpperCase() }).sort({ _id: -1 });
    
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Failed to fetch bank entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
