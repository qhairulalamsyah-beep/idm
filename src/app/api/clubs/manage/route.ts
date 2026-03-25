import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/clubs/manage - Get clubs managed by user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const clubId = searchParams.get('clubId');

    if (clubId) {
      // Get specific club details
      const club = await db.club.findUnique({
        where: { id: clubId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, phone: true, tier: true, points: true, avatar: true },
              },
            },
            orderBy: [{ role: 'desc' }, { joinedAt: 'asc' }],
          },
          clubRank: true,
          teams: {
            include: {
              tournament: { select: { id: true, name: true, division: true, status: true } },
              members: {
                include: {
                  user: { select: { id: true, name: true, tier: true } },
                },
              },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!club) {
        return NextResponse.json(
          { success: false, error: 'Club not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: club });
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId or clubId required' },
        { status: 400 }
      );
    }

    // Get clubs where user is owner or admin
    const managedClubs = await db.clubMember.findMany({
      where: {
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      include: {
        club: {
          include: {
            _count: { select: { members: true, teams: true } },
            clubRank: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: managedClubs.map(m => ({
        ...m.club,
        userRole: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching managed clubs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clubs' },
      { status: 500 }
    );
  }
}

// POST /api/clubs/manage - Create new club
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, logo, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { success: false, error: 'name and ownerId required' },
        { status: 400 }
      );
    }

    // Create club and add owner as member
    const club = await db.club.create({
      data: {
        name,
        description,
        logo,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
        clubRank: {
          create: {},
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: club,
      message: 'Club created successfully',
    });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create club' },
      { status: 500 }
    );
  }
}

// PATCH /api/clubs/manage - Update club details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubId, name, description, logo } = body;

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: 'clubId required' },
        { status: 400 }
      );
    }

    const club = await db.club.update({
      where: { id: clubId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(logo && { logo }),
      },
    });

    return NextResponse.json({
      success: true,
      data: club,
      message: 'Club updated successfully',
    });
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update club' },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/manage - Delete club (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: 'clubId required' },
        { status: 400 }
      );
    }

    // Delete club (cascade will handle members)
    await db.club.delete({
      where: { id: clubId },
    });

    return NextResponse.json({
      success: true,
      message: 'Club deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete club' },
      { status: 500 }
    );
  }
}
