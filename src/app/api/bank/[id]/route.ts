import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { BankEntry } from '@/models/BankEntry';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { approved } = body;
    
    const entry = await BankEntry.findByIdAndUpdate(id, { approved }, { new: true });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    await BankEntry.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
