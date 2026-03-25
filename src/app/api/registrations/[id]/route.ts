import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/registrations/[id] - Update registration (approve/reject/update tier)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, tier, approvedBy } = body;

    const updateData: Record<string, unknown> = {};
    
    // Only update status if provided
    if (status) {
      updateData.status = status;
      if (status === 'APPROVED') {
        updateData.approvedBy = approvedBy || 'system';
        updateData.approvedAt = new Date();
      }
    }
    
    // Update tier if provided
    if (tier) {
      updateData.tier = tier;
    }

    const registration = await db.registration.update({
      where: { id },
      data: updateData,
      include: { user: true, tournament: true },
    });

    // Update user's tier when tier is provided
    if (tier && registration.user) {
      await db.user.update({
        where: { id: registration.userId },
        data: { tier },
      });
    }

    return NextResponse.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

// PATCH /api/registrations/[id] - Partial update registration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, tier, approvedBy } = body;

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === 'APPROVED') {
        updateData.approvedBy = approvedBy || 'system';
        updateData.approvedAt = new Date();
      }
    }
    if (tier) updateData.tier = tier;

    const registration = await db.registration.update({
      where: { id },
      data: updateData,
      include: { user: true, tournament: true },
    });

    // Update user's tier when approved
    if (status === 'APPROVED' && tier && registration.user) {
      await db.user.update({
        where: { id: registration.userId },
        data: { tier },
      });
    }

    return NextResponse.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error('Error patching registration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

// DELETE /api/registrations/[id] - Delete registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const registration = await db.registration.delete({
      where: { id },
    });

    // Update tournament current participants
    await db.tournament.update({
      where: { id: registration.tournamentId },
      data: { currentParticipants: { decrement: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration deleted',
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}
