// Seed script for Idol Meta Tournament Platform
// Run with: bunx prisma db seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { phone: '+6281349924210' },
    update: {},
    create: {
      phone: '+6281349924210',
      name: 'Tazos Admin',
      role: 'SUPER_ADMIN',
      tier: 'S',
    },
  });
  console.log('✅ Created super admin:', superAdmin.name);

  // Create sample participants
  const participants = await Promise.all([
    prisma.user.upsert({
      where: { phone: '+628111111111' },
      update: {},
      create: { phone: '+628111111111', name: 'Tazos', role: 'PARTICIPANT', tier: 'S' },
    }),
    prisma.user.upsert({
      where: { phone: '+628222222222' },
      update: {},
      create: { phone: '+628222222222', name: 'Rexxar', role: 'PARTICIPANT', tier: 'S' },
    }),
    prisma.user.upsert({
      where: { phone: '+628333333333' },
      update: {},
      create: { phone: '+628333333333', name: 'Shadow', role: 'PARTICIPANT', tier: 'A' },
    }),
    prisma.user.upsert({
      where: { phone: '+628444444444' },
      update: {},
      create: { phone: '+628444444444', name: 'Blaze', role: 'PARTICIPANT', tier: 'A' },
    }),
    prisma.user.upsert({
      where: { phone: '+628555555555' },
      update: {},
      create: { phone: '+628555555555', name: 'Storm', role: 'PARTICIPANT', tier: 'B' },
    }),
    prisma.user.upsert({
      where: { phone: '+628666666666' },
      update: {},
      create: { phone: '+628666666666', name: 'Phoenix', role: 'PARTICIPANT', tier: 'B' },
    }),
    prisma.user.upsert({
      where: { phone: '+628777777777' },
      update: {},
      create: { phone: '+628777777777', name: 'Luna', role: 'PARTICIPANT', tier: 'S' },
    }),
    prisma.user.upsert({
      where: { phone: '+628888888888' },
      update: {},
      create: { phone: '+628888888888', name: 'Aurora', role: 'PARTICIPANT', tier: 'A' },
    }),
  ]);
  console.log('✅ Created', participants.length, 'participants');

  // Create clubs
  const clubs = await Promise.all([
    prisma.club.create({
      data: {
        name: 'Alpha Squad',
        description: 'Elite gaming club',
        totalPoints: 1500,
      },
    }),
    prisma.club.create({
      data: {
        name: 'Phoenix Gaming',
        description: 'Professional esports team',
        totalPoints: 1200,
      },
    }),
  ]);
  console.log('✅ Created', clubs.length, 'clubs');

  // Create tournaments
  const tournaments = await Promise.all([
    prisma.tournament.create({
      data: {
        name: 'Tarkam #9',
        division: 'MALE',
        mode: 'GR Arena 3vs3',
        bpm: 'Random 120-140',
        bracketType: 'SINGLE_ELIMINATION',
        status: 'REGISTRATION',
        maxParticipants: 18,
        currentParticipants: 6,
        startDate: new Date('2025-01-25T19:00:00'),
        location: 'GR Arena Mall X',
        rules: '- Dilarang menggunakan BOT\n- Wajib hadir 15 menit sebelum pertandingan\n- Tim yang tidak hadir otomatis walkover',
      },
    }),
    prisma.tournament.create({
      data: {
        name: 'Queen Battle #3',
        division: 'FEMALE',
        mode: 'GR Arena 3vs3',
        bpm: 'Random 120-140',
        bracketType: 'DOUBLE_ELIMINATION',
        status: 'REGISTRATION',
        maxParticipants: 12,
        currentParticipants: 2,
        startDate: new Date('2025-01-26T18:00:00'),
        location: 'GR Arena Mall X',
        rules: '- Dilarang menggunakan BOT\n- Wajib hadir 15 menit sebelum pertandingan',
      },
    }),
    prisma.tournament.create({
      data: {
        name: 'Liga IDM Season 2',
        division: 'LIGA',
        mode: 'GR Arena 5vs5',
        bpm: 'Random 120-140',
        bracketType: 'GROUP_STAGE',
        status: 'REGISTRATION',
        maxParticipants: 20,
        currentParticipants: 2,
        startDate: new Date('2025-02-01T19:00:00'),
        location: 'GR Arena Mall X',
        rules: '- Hanya untuk club terdaftar\n- Minimal 5 pemain per tim\n- Dilarang menggunakan pemain pengganti tanpa izin',
      },
    }),
  ]);
  console.log('✅ Created', tournaments.length, 'tournaments');

  // Create prize pools
  for (const tournament of tournaments) {
    const amounts = tournament.division === 'LIGA'
      ? { championAmount: 1000000, runnerUpAmount: 500000, thirdPlaceAmount: 250000, mvpAmount: 50000 }
      : { championAmount: 300000, runnerUpAmount: 150000, thirdPlaceAmount: 75000, mvpAmount: 25000 };

    await prisma.prizePool.create({
      data: {
        tournamentId: tournament.id,
        ...amounts,
        totalAmount: amounts.championAmount + amounts.runnerUpAmount + amounts.thirdPlaceAmount + amounts.mvpAmount,
      },
    });
  }
  console.log('✅ Created prize pools');

  // Create registrations
  const maleTournament = tournaments.find(t => t.division === 'MALE')!;
  for (let i = 0; i < 6; i++) {
    await prisma.registration.create({
      data: {
        tournamentId: maleTournament.id,
        userId: participants[i].id,
        division: 'MALE',
        tier: participants[i].tier as 'S' | 'A' | 'B',
        status: i < 4 ? 'APPROVED' : 'PENDING',
      },
    });
  }
  console.log('✅ Created registrations');

  // Create settings
  const settingsData = [
    { key: 'app_name', value: 'Idol Meta Tournament', type: 'TEXT' as const },
    { key: 'app_version', value: '1.0.0', type: 'TEXT' as const },
    { key: 'maintenance_mode', value: 'false', type: 'BOOLEAN' as const },
  ];
  
  for (const setting of settingsData) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Created settings');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
