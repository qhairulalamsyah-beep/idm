// New Seed script for Idol Meta Tournament Platform
// Run with: bunx prisma db seed
// Or use the admin panel button

import { PrismaClient, Tier, Club, User } from '@prisma/client';

const prisma = new PrismaClient();

// Male participants (24)
const maleParticipants = [
  'tazos', 'Bambang', 'arthur', 'sting', 'ipiin', 'ren', 'earth', 'helix',
  'predator', 'zeth', 'zmz', 'varnces', 'mobtiel', 'gunnery', 'life', 'afroki',
  'marimo', 'kageno', 'janskie', 'vriskey', 'zico', 'chiko', 'rivaldo', 'afi'
];

// Female participants (18)
const femaleParticipants = [
  'evony', 'vion', 'cheeyaqq', 'skylin', 'indi', 'veronics', 'moy', 'metry',
  'aitan', 'cikiw', 'irazz', 'yaay', 'reptil', 'dysa', 'arcalya', 'cami',
  'iparmaut', 'weywey'
];

// Clubs (8)
const clubs = [
  'gymshark', 'maximous', 'southern', 'platR', 
  'paranoid', 'euphoric', 'yakuza', 'sensei'
];

// Helper to generate phone number
const generatePhone = (index: number) => `+6281234567${String(index).padStart(3, '0')}`;

// Helper to assign random tier
const assignTier = (): Tier => {
  const rand = Math.random();
  if (rand < 0.2) return 'S';
  if (rand < 0.5) return 'A';
  return 'B';
};

async function main() {
  console.log('🌱 Seeding database with new data...');

  // 1. Create Super Admin (keep existing)
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
  console.log('✅ Super admin ready:', superAdmin.name);

  // 2. Create Clubs
  console.log('\n📁 Creating clubs...');
  const createdClubs: Club[] = [];
  for (let i = 0; i < clubs.length; i++) {
    const club = await prisma.club.create({
      data: {
        name: clubs[i],
        description: `${clubs[i]} gaming club`,
        totalPoints: Math.floor(Math.random() * 1000) + 500,
      },
    });
    createdClubs.push(club);
    console.log(`   ✓ ${club.name}`);
  }
  console.log(`✅ Created ${createdClubs.length} clubs`);

  // 3. Create Male Participants
  console.log('\n👨 Creating male participants...');
  const maleUsers: User[] = [];
  for (let i = 0; i < maleParticipants.length; i++) {
    const user = await prisma.user.create({
      data: {
        phone: generatePhone(i),
        name: maleParticipants[i],
        role: 'PARTICIPANT',
        tier: assignTier(),
      },
    });
    maleUsers.push(user);
    console.log(`   ✓ ${user.name} (${user.tier})`);
  }
  console.log(`✅ Created ${maleUsers.length} male participants`);

  // 4. Create Female Participants
  console.log('\n👩 Creating female participants...');
  const femaleUsers: User[] = [];
  for (let i = 0; i < femaleParticipants.length; i++) {
    const user = await prisma.user.create({
      data: {
        phone: generatePhone(100 + i),
        name: femaleParticipants[i],
        role: 'PARTICIPANT',
        tier: assignTier(),
      },
    });
    femaleUsers.push(user);
    console.log(`   ✓ ${user.name} (${user.tier})`);
  }
  console.log(`✅ Created ${femaleUsers.length} female participants`);

  // 5. Assign some users to clubs
  console.log('\n🔗 Assigning users to clubs...');
  const allUsers = [...maleUsers, ...femaleUsers];
  let clubAssignments = 0;
  for (const user of allUsers) {
    // 60% chance to be in a club
    if (Math.random() < 0.6) {
      const randomClub = createdClubs[Math.floor(Math.random() * createdClubs.length)];
      await prisma.clubMember.create({
        data: {
          clubId: randomClub.id,
          userId: user.id,
          role: Math.random() < 0.2 ? 'ADMIN' : 'MEMBER',
        },
      });
      clubAssignments++;
    }
  }
  console.log(`✅ Assigned ${clubAssignments} users to clubs`);

  // 6. Create MALE tournament
  console.log('\n🏆 Creating MALE tournament...');
  const maleTournament = await prisma.tournament.create({
    data: {
      name: 'Tarkam #10',
      division: 'MALE',
      mode: 'GR Arena 3vs3',
      bpm: 'Random 120-140',
      bracketType: 'SINGLE_ELIMINATION',
      status: 'REGISTRATION',
      maxParticipants: 24,
      currentParticipants: 0,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      location: 'Pub 1',
      rules: 'Dilarang menggunakan BOT atau cheat\nPeserta wajib hadir 15 menit sebelum pertandingan\nTim yang tidak hadir otomatis dianggap walkover\nKeputusan juri bersifat mutlak\nDilarang melakukan toxic behavior',
    },
  });

  // Create prize pool for MALE
  await prisma.prizePool.create({
    data: {
      tournamentId: maleTournament.id,
      championAmount: 300000,
      runnerUpAmount: 150000,
      thirdPlaceAmount: 75000,
      mvpAmount: 25000,
      totalAmount: 550000,
    },
  });
  console.log(`✅ Created MALE tournament: ${maleTournament.name}`);

  // 7. Create FEMALE tournament
  console.log('\n🏆 Creating FEMALE tournament...');
  const femaleTournament = await prisma.tournament.create({
    data: {
      name: 'Queen Battle #4',
      division: 'FEMALE',
      mode: 'GR Arena 3vs3',
      bpm: 'Random 120-140',
      bracketType: 'SINGLE_ELIMINATION',
      status: 'REGISTRATION',
      maxParticipants: 18,
      currentParticipants: 0,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      location: 'Pub 1',
      rules: 'Dilarang menggunakan BOT atau cheat\nPeserta wajib hadir 15 menit sebelum pertandingan\nTim yang tidak hadir otomatis dianggap walkover\nKeputusan juri bersifat mutlak',
    },
  });

  // Create prize pool for FEMALE
  await prisma.prizePool.create({
    data: {
      tournamentId: femaleTournament.id,
      championAmount: 250000,
      runnerUpAmount: 125000,
      thirdPlaceAmount: 60000,
      mvpAmount: 20000,
      totalAmount: 455000,
    },
  });
  console.log(`✅ Created FEMALE tournament: ${femaleTournament.name}`);

  // 8. Register all male participants
  console.log('\n📝 Registering male participants...');
  for (const user of maleUsers) {
    await prisma.registration.create({
      data: {
        tournamentId: maleTournament.id,
        userId: user.id,
        division: 'MALE',
        tier: user.tier as Tier,
        status: 'APPROVED',
      },
    });
  }
  await prisma.tournament.update({
    where: { id: maleTournament.id },
    data: { currentParticipants: maleUsers.length },
  });
  console.log(`✅ Registered ${maleUsers.length} male participants`);

  // 9. Register all female participants
  console.log('\n📝 Registering female participants...');
  for (const user of femaleUsers) {
    await prisma.registration.create({
      data: {
        tournamentId: femaleTournament.id,
        userId: user.id,
        division: 'FEMALE',
        tier: user.tier as Tier,
        status: 'APPROVED',
      },
    });
  }
  await prisma.tournament.update({
    where: { id: femaleTournament.id },
    data: { currentParticipants: femaleUsers.length },
  });
  console.log(`✅ Registered ${femaleUsers.length} female participants`);

  // 10. Create settings
  console.log('\n⚙️ Creating settings...');
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

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${maleUsers.length} male participants`);
  console.log(`   - ${femaleUsers.length} female participants`);
  console.log(`   - ${createdClubs.length} clubs`);
  console.log(`   - 2 tournaments (MALE & FEMALE)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
