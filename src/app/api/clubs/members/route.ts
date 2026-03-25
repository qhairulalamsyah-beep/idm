import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/clubs/members - Get club members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: 'clubId required' },
        { status: 400 }
      );
    }

    const members = await db.clubMember.findMany({
      where: { clubId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            tier: true,
            points: true,
            avatar: true,
            globalRank: { select: { rank: true } },
          },
        },
      },
      orderBy: [{ role: 'desc' }, { joinedAt: 'asc' }],
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/clubs/members - Add member to club
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubId, userId, role = 'MEMBER', addedBy } = body;

    if (!clubId || !userId) {
      return NextResponse.json(
        { success: false, error: 'clubId and userId required' },
        { status: 400 }
      );
    }

    // Check if user has permission (is owner or admin)
    if (addedBy) {
      const adderMembership = await db.clubMember.findUnique({
        where: {
          clubId_userId: { clubId, userId: addedBy },
        },
      });

      if (!adderMembership || !['OWNER', 'ADMIN'].includes(adderMembership.role)) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to add members' },
          { status: 403 }
        );
      }
    }

    // Check if already a member
    const existing = await db.clubMember.findUnique({
      where: {
        clubId_userId: { clubId, userId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this club' },
        { status: 400 }
      );
    }

    // Add member
    const member = await db.clubMember.create({
      data: { clubId, userId, role },
      include: {
        user: { select: { id: true, name: true, tier: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Member added successfully',
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    );
  }
}

// PATCH /api/clubs/members - Update member role
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubId, userId, role, updatedBy } = body;

    if (!clubId || !userId || !role) {
      return NextResponse.json(
        { success: false, error: 'clubId, userId, and role required' },
        { status: 400 }
      );
    }

    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check permission
    if (updatedBy) {
      const updaterMembership = await db.clubMember.findUnique({
        where: {
          clubId_userId: { clubId, userId: updatedBy },
        },
      });

      if (!updaterMembership || updaterMembership.role !== 'OWNER') {
        return NextResponse.json(
          { success: false, error: 'Only club owner can change member roles' },
          { status: 403 }
        );
      }
    }

    // Cannot change owner's role
    const targetMember = await db.clubMember.findUnique({
      where: {
        clubId_userId: { clubId, userId },
      },
    });

    if (targetMember?.role === 'OWNER' && role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Cannot change owner role. Transfer ownership first.' },
        { status: 400 }
      );
    }

    // Update role
    const member = await db.clubMember.update({
      where: {
        clubId_userId: { clubId, userId },
      },
      data: { role },
      include: {
        user: { select: { id: true, name: true, tier: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Member role updated',
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/members - Remove member from club
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const userId = searchParams.get('userId');
    const removedBy = searchParams.get('removedBy');

    if (!clubId || !userId) {
      return NextResponse.json(
        { success: false, error: 'clubId and userId required' },
        { status: 400 }
      );
    }

    // Check permission
    if (removedBy) {
      const removerMembership = await db.clubMember.findUnique({
        where: {
          clubId_userId: { clubId, userId: removedBy },
        },
      });

      if (!removerMembership || !['OWNER', 'ADMIN'].includes(removerMembership.role)) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to remove members' },
          { status: 403 }
        );
      }
    }

    // Cannot remove owner
    const targetMember = await db.clubMember.findUnique({
      where: {
        clubId_userId: { clubId, userId },
      },
    });

    if (targetMember?.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove club owner' },
        { status: 400 }
      );
    }

    // Remove member
    await db.clubMember.delete({
      where: {
        clubId_userId: { clubId, userId },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed from club',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}

// Transfer ownership
export async function transferOwnership(
  clubId: string,
  currentOwnerId: string,
  newOwnerId: string
) {
  try {
    // Verify current owner
    const currentOwner = await db.clubMember.findUnique({
      where: {
        clubId_userId: { clubId, userId: currentOwnerId },
      },
    });

    if (!currentOwner || currentOwner.role !== 'OWNER') {
      throw new Error('Only current owner can transfer ownership');
    }

    // Verify new owner is a member
    const newOwner = await db.clubMember.findUnique({
      where: {
        clubId_userId: { clubId, userId: newOwnerId },
      },
    });

    if (!newOwner) {
      throw new Error('New owner must be a club member');
    }

    // Update roles
    await db.$transaction([
      db.clubMember.update({
        where: { clubId_userId: { clubId, userId: currentOwnerId } },
        data: { role: 'ADMIN' },
      }),
      db.clubMember.update({
        where: { clubId_userId: { clubId, userId: newOwnerId } },
        data: { role: 'OWNER' },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error transferring ownership:', error);
    throw error;
  }
}
