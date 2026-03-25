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
    
    // Clear all data first
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

    // ============================================
    // MALE DIVISION - 24 Participants
    // ============================================
    const maleParticipants = [
      { name: 'Tazos', tier: Tier.S },
      { name: 'Bambang', tier: Tier.S },
      { name: 'Arthur', tier: Tier.S },
      { name: 'Sting', tier: Tier.S },
      { name: 'Helix', tier: Tier.S },
      { name: 'Afroki', tier: Tier.S },
      { name: 'Ipiin', tier: Tier.A },
      { name: 'Ren', tier: Tier.A },
      { name: 'Earth', tier: Tier.A },
      { name: 'Predator', tier: Tier.A },
      { name: 'Zeth', tier: Tier.A },
      { name: 'Marimo', tier: Tier.A },
      { name: 'Kageno', tier: Tier.A },
      { name: 'Janskie', tier: Tier.A },
      { name: 'Vriskey', tier: Tier.A },
      { name: 'Zmz', tier: Tier.B },
      { name: 'VarnceS', tier: Tier.B },
      { name: 'Mobtiel', tier: Tier.B },
      { name: 'Gunnery', tier: Tier.B },
      { name: 'Life', tier: Tier.B },
      { name: 'Zico', tier: Tier.B },
      { name: 'Chiko', tier: Tier.B },
      { name: 'Rivaldo', tier: Tier.B },
      { name: 'Afi', tier: Tier.B },
    ];

    // Create Male Tournament
    const maleTournament = await db.tournament.create({
      data: {
        name: 'Tarkam Male #1',
        division: Division.MALE,
        mode: 'GR Arena 3vs3',
        bpm: 'Random 120-140',
        bracketType: BracketType.SINGLE_ELIMINATION,
        status: 'REGISTRATION',
        maxParticipants: 24,
        currentParticipants: maleParticipants.length,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'GR Arena Mall X',
        rules: 'Dilarang menggunakan BOT atau cheat\nPeserta wajib hadir 15 menit sebelum pertandingan\nTim yang tidak hadir otomatis dianggap walkover\nKeputusan juri bersifat mutlak\nDilarang melakukan toxic behavior',
      },
    });

    // Male Prize Pool
    await db.prizePool.create({
      data: {
        tournamentId: maleTournament.id,
        championAmount: 500000,
        runnerUpAmount: 250000,
        thirdPlaceAmount: 100000,
        mvpAmount: 50000,
        totalAmount: 900000,
      },
    });

    // Create Male Participants
    for (let i = 0; i < maleParticipants.length; i++) {
      const p = maleParticipants[i];
      
      const user = await db.user.create({
        data: {
          phone: `+62812340${i.toString().padStart(4, '0')}`,
          name: p.name,
          tier: p.tier,
          role: 'PARTICIPANT',
          points: p.tier === Tier.S ? 1500 : p.tier === Tier.A ? 1000 : 500,
          isActive: true,
        },
      });

      await db.registration.create({
        data: {
          tournamentId: maleTournament.id,
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

    // ============================================
    // FEMALE DIVISION - 18 Participants
    // ============================================
    const femaleParticipants = [
      { name: 'Evony', tier: Tier.S },
      { name: 'Vion', tier: Tier.S },
      { name: 'Cheeyaqq', tier: Tier.S },
      { name: 'Skylin', tier: Tier.S },
      { name: 'Indi', tier: Tier.A },
      { name: 'Veronics', tier: Tier.A },
      { name: 'Moy', tier: Tier.A },
      { name: 'Metry', tier: Tier.A },
      { name: 'Aitan', tier: Tier.A },
      { name: 'Cikiw', tier: Tier.A },
      { name: 'Irazz', tier: Tier.B },
      { name: 'Yaay', tier: Tier.B },
      { name: 'Reptil', tier: Tier.B },
      { name: 'Dysa', tier: Tier.B },
      { name: 'Arcalya', tier: Tier.B },
      { name: 'Cami', tier: Tier.B },
      { name: 'Iparmaut', tier: Tier.B },
      { name: 'Weywey', tier: Tier.B },
    ];

    // Create Female Tournament
    const femaleTournament = await db.tournament.create({
      data: {
        name: 'Tarkam Female #1',
        division: Division.FEMALE,
        mode: 'GR Arena 3vs3',
        bpm: 'Random 120-140',
        bracketType: BracketType.SINGLE_ELIMINATION,
        status: 'REGISTRATION',
        maxParticipants: 24,
        currentParticipants: femaleParticipants.length,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'GR Arena Mall X',
        rules: 'Dilarang menggunakan BOT atau cheat\nPeserta wajib hadir 15 menit sebelum pertandingan\nTim yang tidak hadir otomatis dianggap walkover\nKeputusan juri bersifat mutlak\nDilarang melakukan toxic behavior',
      },
    });

    // Female Prize Pool
    await db.prizePool.create({
      data: {
        tournamentId: femaleTournament.id,
        championAmount: 500000,
        runnerUpAmount: 250000,
        thirdPlaceAmount: 100000,
        mvpAmount: 50000,
        totalAmount: 900000,
      },
    });

    // Create Female Participants
    for (let i = 0; i < femaleParticipants.length; i++) {
      const p = femaleParticipants[i];
      
      const user = await db.user.create({
        data: {
          phone: `+62812341${i.toString().padStart(4, '0')}`,
          name: p.name,
          tier: p.tier,
          role: 'PARTICIPANT',
          points: p.tier === Tier.S ? 1500 : p.tier === Tier.A ? 1000 : 500,
          isActive: true,
        },
      });

      await db.registration.create({
        data: {
          tournamentId: femaleTournament.id,
          userId: user.id,
          division: Division.FEMALE,
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

    // ============================================
    // CLUBS - 8 Clubs
    // ============================================
    const clubNames = ['Gymshark', 'Maximous', 'Southern', 'PlatR', 'Paranoid', 'Euphoric', 'Yakuza', 'Sensei'];
    
    for (let i = 0; i < clubNames.length; i++) {
      const club = await db.club.create({
        data: {
          name: clubNames[i],
          totalPoints: Math.floor(Math.random() * 3000) + 2000,
        },
      });

      await db.clubRank.create({
        data: {
          clubId: club.id,
          totalPoints: Math.floor(Math.random() * 3000) + 2000,
          wins: Math.floor(Math.random() * 20) + 10,
          losses: Math.floor(Math.random() * 10),
          tournaments: Math.floor(Math.random() * 8) + 2,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demo data seeded successfully!', 
      data: {
        maleTournament: maleTournament.name,
        femaleTournament: femaleTournament.name,
        maleParticipants: maleParticipants.length,
        femaleParticipants: femaleParticipants.length,
        clubs: clubNames.length,
        maleStats: {
          sTier: maleParticipants.filter(p => p.tier === Tier.S).length,
          aTier: maleParticipants.filter(p => p.tier === Tier.A).length,
          bTier: maleParticipants.filter(p => p.tier === Tier.B).length,
        },
        femaleStats: {
          sTier: femaleParticipants.filter(p => p.tier === Tier.S).length,
          aTier: femaleParticipants.filter(p => p.tier === Tier.A).length,
          bTier: femaleParticipants.filter(p => p.tier === Tier.B).length,
        },
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
    
    return NextResponse.json({ success: true, message: 'All tournament data cleared successfully' });
  } catch (error: unknown) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
