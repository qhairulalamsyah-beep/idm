import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tournaments/[id] - Get tournament by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        prizePool: {
          include: {
            saweran: {
              where: { status: 'COMPLETED' },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        registrations: {
          include: { 
            user: {
              include: {
                clubs: {
                  include: { club: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
        },
        teams: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
        bracket: {
          include: {
            matches: {
              include: {
                homeTeam: {
                  include: { members: { include: { user: true } } },
                },
                awayTeam: {
                  include: { members: { include: { user: true } } },
                },
              },
              orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
            },
            groups: {
              include: {
                members: {
                  include: {
                    team: {
                      include: { members: { include: { user: true } } },
                    },
                  },
                },
              },
            },
          },
        },
        champion: {
          include: {
            championTeam: true,
            runnerUpTeam: true,
            thirdPlaceTeam: true,
            mvp: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

// PUT /api/tournaments/[id] - Update tournament
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const tournament = await db.tournament.update({
      where: { id },
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

// PATCH /api/tournaments/[id] - Partial update tournament (status change)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    
    if (body.status) updateData.status = body.status;
    if (body.name) updateData.name = body.name;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.location) updateData.location = body.location;
    if (body.rules) updateData.rules = body.rules;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    
    updateData.updatedAt = new Date();

    const tournament = await db.tournament.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    console.error('Error patching tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.tournament.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tournament deleted',
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}
