import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Club, User, Tier } from '@prisma/client';

// Male participants (24) - exact names from user
const maleParticipants = [
  'tazos', 'Bambang', 'arthur', 'sting', 'ipiin', 'ren', 'earth', 'helix',
  'predator', 'zeth', 'zmz', 'varnces', 'mobtiel', 'gunnery', 'life', 'afroki',
  'marimo', 'kageno', 'janskie', 'vriskey', 'zico', 'chiko', 'rivaldo', 'afi'
];

// Female participants (18) - exact names from user
const femaleParticipants = [
  'evony', 'vion', 'cheeyaqq', 'skylin', 'indi', 'veronics', 'moy', 'metry',
  'aitan', 'cikiw', 'irazz', 'yaay', 'reptil', 'dysa', 'arcalya', 'cami',
  'iparmaut', 'weywey'
];

// Clubs (8) - exact names from user
const clubs = [
  'gymshark', 'maximous', 'southern', 'platR', 
  'paranoid', 'euphoric', 'yakuza', 'sensei'
];

const generatePhone = (index: number) => `+6281234567${String(index).padStart(3, '0')}`;
const assignTier = (): Tier => {
  const rand = Math.random();
  if (rand < 0.2) return 'S';
  if (rand < 0.5) return 'A';
  return 'B';
};

// POST - Seed data
export async function POST(request: NextRequest) {
  try {
    // Keep super admin
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    // 1. Create Clubs
    const createdClubs: Club[] = [];
    for (let i = 0; i < clubs.length; i++) {
      const club = await db.club.create({
        data: {
          name: clubs[i],
          description: `${clubs[i]} gaming club`,
          totalPoints: Math.floor(Math.random() * 1000) + 500,
        },
      });
      createdClubs.push(club);
    }

    // 2. Create Male Participants
    const maleUsers: User[] = [];
    for (let i = 0; i < maleParticipants.length; i++) {
      const user = await db.user.create({
        data: {
          phone: generatePhone(i),
          name: maleParticipants[i],
          role: 'PARTICIPANT',
          tier: assignTier(),
        },
      });
      maleUsers.push(user);
    }

    // 3. Create Female Participants
    const femaleUsers: User[] = [];
    for (let i = 0; i < femaleParticipants.length; i++) {
      const user = await db.user.create({
        data: {
          phone: generatePhone(100 + i),
          name: femaleParticipants[i],
          role: 'PARTICIPANT',
          tier: assignTier(),
        },
      });
      femaleUsers.push(user);
    }

    // 4. Assign users to clubs (60% chance)
    const allUsers = [...maleUsers, ...femaleUsers];
    for (const user of allUsers) {
      if (Math.random() < 0.6) {
        const randomClub = createdClubs[Math.floor(Math.random() * createdClubs.length)];
        await db.clubMember.create({
          data: {
            clubId: randomClub.id,
            userId: user.id,
            role: Math.random() < 0.2 ? 'ADMIN' : 'MEMBER',
          },
        });
      }
    }

    // 5. Create MALE tournament
    const maleTournament = await db.tournament.create({
      data: {
        name: 'Tarkam #10',
        division: 'MALE',
        mode: 'GR Arena 3vs3',
        bpm: 'Random 120-140',
        bracketType: 'SINGLE_ELIMINATION',
        status: 'REGISTRATION',
        maxParticipants: 24,
        currentParticipants: maleUsers.length,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Pub 1',
        rules: 'Dilarang menggunakan BOT atau cheat\nPeserta wajib hadir 15 menit sebelum pertandingan\nTim yang tidak hadir otomatis dianggap walkover\nKeputusan juri bersifat mutlak\nDilarang melakukan toxic behavior',
      },
    });

    await db.prizePool.create({
      data: {
        tournamentId: maleTournament.id,
        championAmount: 300000,
        runnerUpAmount: 150000,
        thirdPlaceAmount: 75000,
        mvpAmount: 25000,
        totalAmount: 550000,
      },
    });

    // Register male participants
    for (const user of maleUsers) {
      await db.registration.create({
        data: {
          tournamentId: maleTournament.id,
          userId: user.id,
          division: 'MALE',
          tier: user.tier as Tier,
          status: 'APPROVED',
        },
      });
    }

    // 6. Create FEMALE tournament
    const femaleTournament = await db.tournament.create({
      data: {
        name: 'Queen Battle #4',
        division: 'FEMALE',
        mode: 'GR Arena 3vs3',
        bpm: 'Random 120-140',
        bracketType: 'SINGLE_ELIMINATION',
        status: 'REGISTRATION',
        maxParticipants: 18,
        currentParticipants: femaleUsers.length,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Pub 1',
        rules: 'Dilarang menggunakan BOT atau cheat\nPeserta wajib hadir 15 menit sebelum pertandingan\nTim yang tidak hadir otomatis dianggap walkover\nKeputusan juri bersifat mutlak',
      },
    });

    await db.prizePool.create({
      data: {
        tournamentId: femaleTournament.id,
        championAmount: 250000,
        runnerUpAmount: 125000,
        thirdPlaceAmount: 60000,
        mvpAmount: 20000,
        totalAmount: 455000,
      },
    });

    // Register female participants
    for (const user of femaleUsers) {
      await db.registration.create({
        data: {
          tournamentId: femaleTournament.id,
          userId: user.id,
          division: 'FEMALE',
          tier: user.tier as Tier,
          status: 'APPROVED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      data: {
        maleParticipants: maleUsers.length,
        femaleParticipants: femaleUsers.length,
        clubs: createdClubs.length,
        tournaments: 2,
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to seed data'
    }, { status: 500 });
  }
}

// DELETE - Reset data
export async function DELETE(request: NextRequest) {
  try {
    // Keep super admin
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    // Delete in correct order (respecting foreign keys)
    
    // 1. Delete match results
    await db.matchResult.deleteMany({});
    
    // 2. Delete matches
    await db.match.deleteMany({});
    
    // 3. Delete group members
    await db.groupMember.deleteMany({});
    
    // 4. Delete groups
    await db.group.deleteMany({});
    
    // 5. Delete brackets
    await db.bracket.deleteMany({});
    
    // 6. Delete team members
    await db.teamMember.deleteMany({});
    
    // 7. Delete teams
    await db.team.deleteMany({});
    
    // 8. Delete registrations
    await db.registration.deleteMany({});
    
    // 9. Delete saweran
    await db.saweran.deleteMany({});
    
    // 10. Delete donations
    await db.donation.deleteMany({});
    
    // 11. Delete prize pools
    await db.prizePool.deleteMany({});
    
    // 12. Delete champions
    await db.champion.deleteMany({});
    
    // 13. Delete tournaments
    await db.tournament.deleteMany({});
    
    // 14. Delete club members
    await db.clubMember.deleteMany({});
    
    // 15. Delete clubs
    await db.club.deleteMany({});
    
    // 16. Delete OTP codes
    await db.oTPCode.deleteMany({});
    
    // 17. Delete notifications
    await db.notification.deleteMany({});
    
    // 18. Delete global ranks
    await db.globalRank.deleteMany({});
    
    // 19. Delete player stats
    await db.playerStats.deleteMany({});
    
    // 20. Delete match history
    await db.matchHistory.deleteMany({});
    
    // 21. Delete user achievements
    await db.userAchievement.deleteMany({});
    
    // 22. Delete MVP awards
    await db.mVPAward.deleteMany({});
    
    // 23. Delete user admin profiles
    await db.userAdminProfile.deleteMany({});
    
    // 24. Delete users except super admin
    if (superAdmin) {
      await db.user.deleteMany({
        where: {
          NOT: {
            id: superAdmin.id
          }
        }
      });
    } else {
      await db.user.deleteMany({});
    }

    return NextResponse.json({
      success: true,
      message: 'All data has been reset',
      data: {
        deleted: true
      }
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reset data'
    }, { status: 500 });
  }
}
