import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Turn } from '@/models/Turn';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { answerText } = body;
    
    const turn = await Turn.findById(id);
    if (!turn) return NextResponse.json({ error: 'Turn not found' }, { status: 404 });

    turn.phase = 'proof_pending';
    turn.answerText = answerText;
    await turn.save();

    await pusherServer.trigger(`presence-room-${turn.roomId}`, 'answer-submitted', {
      turnId: turn._id,
      answerText
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to submit answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
