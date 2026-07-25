import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Turn } from '@/models/Turn';
import { BankEntry } from '@/models/BankEntry';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const turn = await Turn.findById(id);
    if (!turn) return NextResponse.json({ error: 'Turn not found' }, { status: 404 });

    turn.phase = 'complete';
    await turn.save();

    // Mark the bank entry as used
    if (turn.bankEntryId) {
      await BankEntry.findByIdAndUpdate(turn.bankEntryId, { used: true });
    }

    await pusherServer.trigger(`presence-room-${turn.roomId}`, 'turn-completed', {
      turnId: turn._id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to complete turn:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
