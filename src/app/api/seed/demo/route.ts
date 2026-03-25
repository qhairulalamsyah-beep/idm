import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Tier, Division, BracketType } from '@prisma/client';

export async function GET() {
  try {
    const tournaments = await db.tournament.count();
    const users = await db.user.count({ where: { role: 'PARTICIPANT' } });
    const registrations = await db.registration.count();
    const teams = await db.team.count();
    const clubs = await db.club.count();
    
    return NextResponse.json({
      success: true,
      data: { tournaments, users, registrations, teams, clubs }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get super admin
    const superAdmin = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    
    // Clear all data first (with error handling for each)
    try { await db.champion.deleteMany(); } catch {}
    try { await db.matchResult.deleteMany(); } catch {}
    try { await db.match.deleteMany(); } catch {}
    try { await db.groupMember.deleteMany(); } catch {}
    try { await db.group.deleteMany(); } catch {}
    try { await db.bracket.deleteMany(); } catch {}
    try { await db.teamMember.deleteMany(); } catch {}
    try { await db.team.deleteMany(); } catch {}
    try { await db.saweran.deleteMany(); } catch {}
    try { await db.prizePool.deleteMany(); } catch {}
    try { await db.registration.deleteMany(); } catch {}
    try { await db.tournament.deleteMany(); } catch {}
    try { await db.clubMember.deleteMany(); } catch {}
    try { await db.clubRank.deleteMany(); } catch {}
    try { await db.club.deleteMany(); } catch {}
    try { await db.globalRank.deleteMany(); } catch {}
    try { await db.mVPAward.deleteMany(); } catch {}
    
    // Clear non-admin users
    if (superAdmin) {
      await db.user.deleteMany({ where: { id: { not: superAdmin.id } } });
    } else {
      await db.user.deleteMany({ where: { role: 'PARTICIPANT' } });
    }

    // Create tournament
    const tournament = await db.tournament.create({
      data: {
        name: 'Tarkam Male #1',
        division: Division.MALE,
        mode: 'GR Arena 3vs3',
        bpm: 'Random 120-140',
        bracketType: BracketType.SINGLE_ELIMINATION,
        status: 'REGISTRATION',
        maxParticipants: 24,
        currentParticipants: 23,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'GR Arena Mall X',
      },
    });

    // Prize pool
    await db.prizePool.create({
      data: {
        tournamentId: tournament.id,
        championAmount: 500000,
        runnerUpAmount: 250000,
        thirdPlaceAmount: 100000,
        mvpAmount: 50000,
        totalAmount: 900000,
      },
    });

    // 23 Male Participants - exact names from user
    const participants = [
      { name: 'Tazos', tier: Tier.S },
      { name: 'Bambang', tier: Tier.S },
      { name: 'Arthur', tier: Tier.S },
      { name: 'Sting', tier: Tier.S },
      { name: 'Ipiin', tier: Tier.A },
      { name: 'Ren', tier: Tier.A },
      { name: 'Earth', tier: Tier.A },
      { name: 'Kira', tier: Tier.A },
      { name: 'Predator', tier: Tier.A },
      { name: 'Zmz', tier: Tier.B },
      { name: 'VarnceS', tier: Tier.B },
      { name: 'Zeth', tier: Tier.B },
      { name: 'Zico', tier: Tier.B },
      { name: 'Montiel', tier: Tier.B },
      { name: 'Gunnery', tier: Tier.B },
      { name: 'Afroki', tier: Tier.S },
      { name: 'Marimo', tier: Tier.A },
      { name: 'Oura', tier: Tier.B },
      { name: 'Georgie', tier: Tier.B },
      { name: 'Rivaldo', tier: Tier.B },
      { name: 'Astro', tier: Tier.B },
      { name: 'Ciko', tier: Tier.B },
      { name: 'TestPlayer', tier: Tier.B }, // 23rd player
    ];

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      
      const user = await db.user.create({
        data: {
          phone: `+62812340000${i.toString().padStart(2, '0')}`,
          name: p.name,
          tier: p.tier,
          role: 'PARTICIPANT',
          points: p.tier === Tier.S ? 1500 : p.tier === Tier.A ? 1000 : 500,
          isActive: true,
        },
      });

      await db.registration.create({
        data: {
          tournamentId: tournament.id,
          userId: user.id,
          division: Division.MALE,
          status: 'APPROVED',
          tier: p.tier,
          approvedBy: superAdmin?.id,
          approvedAt: new Date(),
        },
      });

      await db.globalRank.create({
        data: {
          userId: user.id,
          totalPoints: p.tier === Tier.S ? 1500 : p.tier === Tier.A ? 1000 : 500,
          wins: Math.floor(Math.random() * 10) + 5,
          losses: Math.floor(Math.random() * 5),
          tournaments: Math.floor(Math.random() * 5) + 1,
        },
      });
    }

    // Club
    const club = await db.club.create({ 
      data: { 
        name: 'Alpha Squad', 
        totalPoints: 5000 
      } 
    });
    
    const clubUsers = await db.user.findMany({ 
      where: { name: { in: ['Tazos', 'Arthur', 'Sting', 'Ipiin', 'Ren'] } } 
    });
    
    for (const u of clubUsers) {
      await db.clubMember.create({ 
        data: { 
          clubId: club.id, 
          userId: u.id, 
          role: u.name === 'Tazos' ? 'OWNER' : 'MEMBER' 
        } 
      });
    }

    await db.clubRank.create({ 
      data: { 
        clubId: club.id, 
        totalPoints: 5000, 
        wins: 25, 
        losses: 5, 
        tournaments: 10 
      } 
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Demo data seeded successfully!', 
      data: {
        tournament: tournament.name,
        participants: participants.length,
        sTier: participants.filter(p => p.tier === Tier.S).length,
        aTier: participants.filter(p => p.tier === Tier.A).length,
        bTier: participants.filter(p => p.tier === Tier.B).length,
      }
    });
  } catch (error: unknown) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Delete in correct order (respecting foreign keys)
    // Use deleteMany only on tables that exist
    try { await db.champion.deleteMany(); } catch {}
    try { await db.matchResult.deleteMany(); } catch {}
    try { await db.match.deleteMany(); } catch {}
    try { await db.groupMember.deleteMany(); } catch {}
    try { await db.group.deleteMany(); } catch {}
    try { await db.bracket.deleteMany(); } catch {}
    try { await db.teamMember.deleteMany(); } catch {}
    try { await db.team.deleteMany(); } catch {}
    try { await db.saweran.deleteMany(); } catch {}
    try { await db.prizePool.deleteMany(); } catch {}
    try { await db.registration.deleteMany(); } catch {}
    try { await db.tournament.deleteMany(); } catch {}
    try { await db.clubMember.deleteMany(); } catch {}
    try { await db.clubRank.deleteMany(); } catch {}
    try { await db.club.deleteMany(); } catch {}
    try { await db.globalRank.deleteMany(); } catch {}
    try { await db.mVPAward.deleteMany(); } catch {}
    
    const sa = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (sa) {
      await db.user.deleteMany({ where: { id: { not: sa.id } } });
    }
    
    return NextResponse.json({ success: true, message: 'All tournament data cleared' });
  } catch (error: unknown) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
