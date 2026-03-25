import { PrismaClient, Tier } from '@prisma/client';

const prisma = new PrismaClient();

const PARTICIPANTS = [
  { name: 'bambang', tier: 'B' as Tier },
  { name: 'arthur', tier: 'A' as Tier },
  { name: 'sting', tier: 'S' as Tier },
  { name: 'ren', tier: 'A' as Tier },
  { name: 'earth', tier: 'B' as Tier },
  { name: 'ipiin', tier: 'B' as Tier },
  { name: 'predator', tier: 'S' as Tier },
  { name: 'zico', tier: 'A' as Tier },
  { name: 'zmz', tier: 'B' as Tier },
  { name: 'varnces', tier: 'A' as Tier },
  { name: 'gunnery', tier: 'S' as Tier },
  { name: 'afroki', tier: 'B' as Tier },
  { name: 'ciko', tier: 'A' as Tier },
  { name: 'rivaldo', tier: 'B' as Tier },
  { name: 'astro', tier: 'A' as Tier },
  { name: 'zeth', tier: 'S' as Tier },
  { name: 'vankless', tier: 'A' as Tier },
];

async function main() {
  console.log('Seeding participants...');

  // Get the first active tournament
  const tournament = await prisma.tournament.findFirst({
    where: {
      status: {
        in: ['REGISTRATION', 'APPROVAL']
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!tournament) {
    console.log('No active tournament found. Creating a test tournament...');
    
    const newTournament = await prisma.tournament.create({
      data: {
        name: 'Tarkam Test #1',
        division: 'MALE',
        mode: 'GR Arena 3vs3',
        bpm: 'Random 120-140',
        bracketType: 'SINGLE_ELIMINATION',
        status: 'APPROVAL',
        maxParticipants: 32,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        location: 'Pub 1',
      }
    });

    await prisma.prizePool.create({
      data: {
        tournamentId: newTournament.id,
        championAmount: 100000,
        runnerUpAmount: 50000,
        thirdPlaceAmount: 25000,
        mvpAmount: 10000,
        totalAmount: 185000,
      }
    });

    console.log(`Created tournament: ${newTournament.name} (${newTournament.id})`);
    
    // Now seed participants for this tournament
    await seedParticipantsForTournament(newTournament.id, newTournament.division);
  } else {
    console.log(`Found tournament: ${tournament.name} (${tournament.id}) with status: ${tournament.status}`);
    await seedParticipantsForTournament(tournament.id, tournament.division);
  }
}

async function seedParticipantsForTournament(tournamentId: string, division: string) {
  for (const participant of PARTICIPANTS) {
    // Create user if not exists
    const phone = `081${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        name: participant.name,
        phone,
        tier: participant.tier,
        role: 'PARTICIPANT',
      },
    });

    // Check if already registered
    const existingReg = await prisma.registration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        }
      }
    });

    if (existingReg) {
      console.log(`${participant.name} already registered`);
      continue;
    }

    // Create registration with APPROVED status and tier
    const registration = await prisma.registration.create({
      data: {
        tournamentId,
        userId: user.id,
        division: division as 'MALE' | 'FEMALE' | 'LIGA',
        status: 'APPROVED',
        tier: participant.tier,
        approvedAt: new Date(),
      },
    });

    console.log(`Registered ${participant.name} (Tier ${participant.tier}) - Status: APPROVED`);
  }

  // Count registrations
  const count = await prisma.registration.count({
    where: { tournamentId, status: 'APPROVED' }
  });
  
  console.log(`\nTotal approved registrations: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
