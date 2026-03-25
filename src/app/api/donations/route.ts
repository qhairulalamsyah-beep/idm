import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/donations - List donations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');
    
    // If all=true, return all donations including pending (for admin)
    // Otherwise, only return completed donations
    const where = all === 'true' ? {} : { status: 'COMPLETED' as const };
    
    const donations = await db.donation.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalAmount = await db.donation.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: donations,
      total: totalAmount._sum.amount || 0,
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}

// POST /api/donations - Create donation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount, message, paymentMethod, userId } = body;

    if (!name || !amount || amount < 10000) {
      return NextResponse.json(
        { success: false, error: 'Nama wajib diisi dan minimal Rp 10.000' },
        { status: 400 }
      );
    }

    const donation = await db.donation.create({
      data: {
        name,
        amount,
        message,
        paymentMethod,
        userId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      data: donation,
      message: 'Donasi berhasil dibuat. Silakan lakukan pembayaran.',
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create donation' },
      { status: 500 }
    );
  }
}

// PUT /api/donations - Update donation status (for admin approval)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID dan status wajib diisi' },
        { status: 400 }
      );
    }

    const donation = await db.donation.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: donation,
      message: status === 'COMPLETED' 
        ? 'Donasi berhasil dikonfirmasi' 
        : 'Status donasi diperbarui',
    });
  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update donation' },
      { status: 500 }
    );
  }
}
