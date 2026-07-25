import { pusherServer } from '@/lib/pusherServer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const data = await request.formData();
  const socketId = data.get('socket_id') as string;
  const channelName = data.get('channel_name') as string;
  
  // The client can pass a user_id if they have one (from localStorage/MongoDB)
  const userId = data.get('user_id') as string || crypto.randomUUID();

  const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: userId,
    user_info: { id: userId }
  });

  return NextResponse.json(authResponse);
}
