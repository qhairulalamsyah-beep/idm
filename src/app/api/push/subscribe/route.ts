import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/push/subscribe - Get VAPID public key for client
export async function GET() {
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  
  if (!VAPID_PUBLIC_KEY) {
    return NextResponse.json({
      success: false,
      error: 'Push notifications not configured',
    });
  }

  return NextResponse.json({
    success: true,
    data: { publicKey: VAPID_PUBLIC_KEY },
  });
}

// POST /api/push/subscribe - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { success: false, error: 'userId and subscription required' },
        { status: 400 }
      );
    }

    // Store push token in user record
    await db.user.update({
      where: { id: userId },
      data: { pushToken: JSON.stringify(subscription) },
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved',
    });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/push/subscribe - Unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: userId },
      data: { pushToken: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed',
    });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
