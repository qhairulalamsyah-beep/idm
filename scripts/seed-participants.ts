// Script to seed participants into the tournament
// Run with: bun run scripts/seed-participants.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const participantNames = [
  'bambang', 'arthur', 'sting', 'ren', 'earth', 
  'ipiin', 'predator', 'zico', 'zmz', 'varnces', 
  'gunnery', 'afroki', 'ciko', 'rivaldo', 'astro', 
  'zeth', 'vankless'
];

// Random tier distribution
const tiers: ('S' | 'A' | 'B')[] = ['S', 'A', 'B'];

async function main() {
  console.log('🌱 Seeding participants...');

  // Find the active MALE tournament
  const tournament = await prisma.tournament.findFirst({
    where: {
      division: 'MALE',
      status: 'REGISTRATION'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!tournament) {
    console.error('❌ No MALE tournament with REGISTRATION status found!');
    return;
  }

  console.log('✅ Found tournament:', tournament.name);

  // Create users and registrations
  for (let i = 0; i < participantNames.length; i++) {
    const name = participantNames[i];
    const phone = `+62899${String(i + 100).padStart(8, '0')}`;
    const tier = tiers[Math.floor(Math.random() * 3)]; // Random tier

    // Create or update user
    const user = await prisma.user.upsert({
      where: { phone },
      update: { name, tier },
      create: {
        phone,
        name,
        tier,
        role: 'PARTICIPANT',
      }
    });

    // Check if registration already exists
    const existingReg = await prisma.registration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId: user.id
        }
      }
    });

    if (existingReg) {
      console.log(`⚠️ ${name} already registered`);
      continue;
    }

    // Create registration with APPROVED status and random tier
    await prisma.registration.create({
      data: {
        tournamentId: tournament.id,
        userId: user.id,
        division: 'MALE',
        tier,
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: 'seed-script'
      }
    });

    console.log(`✅ Registered: ${name} (Tier ${tier})`);
  }

  // Update tournament current participants count
  const registrationCount = await prisma.registration.count({
    where: {
      tournamentId: tournament.id,
      status: 'APPROVED'
    }
  });

  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { currentParticipants: registrationCount }
  });

  console.log(`\n🎉 Done! Total approved participants: ${registrationCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
