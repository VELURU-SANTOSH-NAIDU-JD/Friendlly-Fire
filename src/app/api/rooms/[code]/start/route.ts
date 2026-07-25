import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Room } from '@/models/Room';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await connectDB();
    const { code } = await params;
    
    const room = await Room.findOne({ code: code.toUpperCase() });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    room.status = 'in_progress';
    await room.save();

    await pusherServer.trigger(`presence-room-${room.code}`, 'game-started', {
      roomId: room._id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to start game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
