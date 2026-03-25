import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import midtrans from '@/lib/payment/midtrans';

// POST /api/webhooks/midtrans - Handle Midtrans payment callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Midtrans Webhook] Received:', JSON.stringify(body, null, 2));

    // Handle webhook
    const result = await midtrans.handleWebhook(body);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid webhook data' },
        { status: 400 }
      );
    }

    const { orderId, status, amount, paymentType } = result.data;

    // Update payment status in database
    const donation = await db.donation.findUnique({
      where: { id: orderId },
    });

    if (!donation) {
      console.error('[Midtrans Webhook] Payment not found:', orderId);
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Update status
    await db.donation.update({
      where: { id: orderId },
      data: {
        status: status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'PENDING',
        paidAt: status === 'COMPLETED' ? new Date() : null,
        message: `Paid via ${paymentType}`,
      },
    });

    // If completed, trigger any additional logic
    if (status === 'COMPLETED') {
      console.log('[Midtrans Webhook] Payment completed:', orderId);
      
      // Check if this is a tournament registration payment
      if (orderId.includes('REGISTRATION')) {
        // Could auto-approve registration here
        console.log('[Midtrans Webhook] Registration payment:', orderId);
      }

      // Broadcast notification
      try {
        await fetch('http://localhost:3004/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'donation',
            data: {
              from: donation.name,
              amount,
              message: donation.message,
            },
          }),
        });
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Midtrans Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
