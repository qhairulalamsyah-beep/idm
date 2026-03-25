import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Tier, UserRole } from '@prisma/client';

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/users/[id] - Update user tier or role
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tier, role } = body;

    const updateData: { tier?: Tier; role?: UserRole } = {};
    
    if (tier && ['S', 'A', 'B'].includes(tier)) {
      updateData.tier = tier as Tier;
    }
    
    if (role && ['SUPER_ADMIN', 'ADMIN', 'PARTICIPANT', 'CLUB_ADMIN'].includes(role)) {
      updateData.role = role as UserRole;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid update data' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
