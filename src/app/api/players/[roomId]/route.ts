import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Player } from '@/models/Player';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await connectDB();
    const { roomId } = await params;
    
    const players = await Player.find({ roomId: roomId.toUpperCase() }).sort({ joinedAt: 1 });
    
    return NextResponse.json({ players });
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
