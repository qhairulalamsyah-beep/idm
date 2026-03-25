// Push Notification API
// Handles Web Push subscriptions and notifications

import { NextRequest, NextResponse } from 'next/server';

// VAPID keys for push notifications (in production, store these securely)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BH_2GLmX9-SqPZYP9-SGlY5W5pJqF6mT8pVxR2qN1hK3cL5nM7oP9qR1sT3uV5wX7yZ9aB1cD3eF5gH7iJ9kL1mN3oP5qR7sT9uV1wX3yZ5aB7cD9eF1gH3iJ5kL7mN9oP1qR3sT5uV7wX9yZ1aB3cD5eF7gH9iJ1kL3mN5oP7qR9sT1uV3wX5yZ7aB9cD1eF3gH5iJ7kL9mN1oP3qR5sT7uV9wX1yZ3aB5cD7eF9gH1iJ3kL5mN7oP9qR1sT3uV5wX7yZ9aB1cD3eF5gH7iJ9kL';

// In-memory storage for push subscriptions (use database in production)
const pushSubscriptions = new Map<string, PushSubscription>();

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  events: string[];
}

// GET /api/notifications/vapid - Get VAPID public key
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'vapid') {
    return NextResponse.json({
      success: true,
      vapidPublicKey: VAPID_PUBLIC_KEY,
    });
  }

  if (action === 'status') {
    const userId = searchParams.get('userId');
    const isSubscribed = userId ? pushSubscriptions.has(userId) : false;
    
    return NextResponse.json({
      success: true,
      isSubscribed,
      subscriptionCount: pushSubscriptions.size,
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Push Notification API',
    endpoints: {
      'GET ?action=vapid': 'Get VAPID public key',
      'GET ?action=status&userId=xxx': 'Check subscription status',
      'POST': 'Subscribe to notifications',
      'DELETE': 'Unsubscribe from notifications',
      'POST ?action=send': 'Send notification (admin)',
    },
  });
}

// POST /api/notifications - Subscribe to push notifications
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Send notification (admin only)
    if (action === 'send') {
      const { userId, title, body: message, data } = body;
      
      const subscription = pushSubscriptions.get(userId);
      if (!subscription) {
        return NextResponse.json({
          success: false,
          error: 'User not subscribed',
        }, { status: 404 });
      }

      // In production, use web-push library to send
      console.log('[PUSH] Sending notification:', { userId, title, message, data });
      
      return NextResponse.json({
        success: true,
        message: 'Notification sent',
      });
    }

    // Broadcast to all subscribers
    if (action === 'broadcast') {
      const { title, body: message, data, event } = body;
      
      let sent = 0;
      for (const [userId, sub] of pushSubscriptions) {
        // Check if user wants this event
        if (sub.events.length === 0 || sub.events.includes(event)) {
          console.log('[PUSH] Broadcasting to:', userId, { title, message });
          sent++;
        }
      }
      
      return NextResponse.json({
        success: true,
        recipients: sent,
      });
    }

    // Subscribe
    const { subscription, userId, events } = body;
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription',
      }, { status: 400 });
    }

    pushSubscriptions.set(userId || subscription.endpoint, {
      ...subscription,
      userId,
      events: events || ['match', 'tournament', 'donation'],
    });

    console.log('[PUSH] New subscription:', userId || subscription.endpoint);

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
    });
  } catch (error) {
    console.error('[PUSH] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
    }, { status: 500 });
  }
}

// DELETE /api/notifications - Unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, endpoint } = body;

    const key = userId || endpoint;
    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'userId or endpoint required',
      }, { status: 400 });
    }

    const deleted = pushSubscriptions.delete(key);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Unsubscribed' : 'Not found',
    });
  } catch (error) {
    console.error('[PUSH] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to unsubscribe',
    }, { status: 500 });
  }
}
