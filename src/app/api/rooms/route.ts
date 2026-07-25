import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Room } from '@/models/Room';

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { mode } = body;

    if (!['local', 'party', 'online'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    let code = generateRoomCode();
    let isUnique = false;
    
    // Ensure unique code
    while (!isUnique) {
      const existing = await Room.findOne({ code });
      if (!existing) {
        isUnique = true;
      } else {
        code = generateRoomCode();
      }
    }

    const room = await Room.create({
      code,
      mode,
      status: 'lobby'
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
