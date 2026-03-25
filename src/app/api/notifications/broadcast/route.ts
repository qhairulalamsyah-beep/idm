import { NextRequest, NextResponse } from 'next/server';

const WA_BOT_PORT = 3004;
const WA_BOT_URL = `http://localhost:${WA_BOT_PORT}`;

async function callWABot(endpoint: string, data: unknown) {
  try {
    const res = await fetch(`${WA_BOT_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (error) {
    console.error('[WA-BOT] Failed to call:', error);
    return false;
  }
}

// POST /api/notifications/broadcast - Send broadcast notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event type required' },
        { status: 400 }
      );
    }

    // Call WhatsApp bot service
    const success = await callWABot('/broadcast', { event, data });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      event,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
