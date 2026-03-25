import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import midtrans from '@/lib/payment/midtrans';
import xendit from '@/lib/payment/xendit';

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'midtrans';

// POST /api/payment/create - Create payment for registration/tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, // 'registration', 'donation', 'entry_fee'
      amount,
      userId,
      tournamentId,
      phone,
      name,
      email,
    } = body;

    if (!amount || amount < 10000) {
      return NextResponse.json(
        { success: false, error: 'Minimum amount is Rp 10.000' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `IDM-${type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create payment based on provider
    if (PAYMENT_PROVIDER === 'midtrans') {
      if (!midtrans.isConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Payment gateway not configured' },
          { status: 500 }
        );
      }

      const result = await midtrans.createTransaction({
        orderId,
        amount,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        description: `Tournament ${type} - Idol Meta`,
        items: [{
          id: type,
          price: amount,
          quantity: 1,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Fee`,
        }],
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/payment/success?orderId=${orderId}`,
          error: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/payment/error?orderId=${orderId}`,
          pending: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/payment/pending?orderId=${orderId}`,
        },
      });

      if (!result.success || !result.data) {
        return NextResponse.json(
          { success: false, error: result.error || 'Payment creation failed' },
          { status: 400 }
        );
      }

      // Store payment record
      await db.donation.create({
        data: {
          id: orderId,
          userId,
          name: name || 'Anonymous',
          amount,
          message: `${type} payment via Midtrans`,
          paymentMethod: 'MIDTRANS',
          status: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          provider: 'midtrans',
          token: result.data.token,
          redirectUrl: result.data.redirect_url,
        },
      });
    }

    // Xendit provider
    if (PAYMENT_PROVIDER === 'xendit') {
      if (!xendit.isConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Payment gateway not configured' },
          { status: 500 }
        );
      }

      // Create QRIS payment (universal for Indonesian e-wallets)
      const result = await xendit.createQRCode({
        referenceId: orderId,
        type: 'DYNAMIC',
        amount,
      });

      if (!result.success || !result.data) {
        return NextResponse.json(
          { success: false, error: result.error || 'Payment creation failed' },
          { status: 400 }
        );
      }

      // Store payment record
      await db.donation.create({
        data: {
          id: orderId,
          userId,
          name: name || 'Anonymous',
          amount,
          message: `${type} payment via Xendit QRIS`,
          paymentMethod: 'XENDIT_QRIS',
          status: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          provider: 'xendit',
          qrString: result.data.qrString,
          qrImageUrl: result.data.qrImageUrl,
          expiresAt: result.data.expiresAt,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payment provider' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// GET /api/payment/create - Get payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId required' },
        { status: 400 }
      );
    }

    // Get from database
    const donation = await db.donation.findUnique({
      where: { id: orderId },
    });

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}
