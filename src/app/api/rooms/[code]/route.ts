import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Room } from '@/models/Room';

export async function GET(
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

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Failed to fetch room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
