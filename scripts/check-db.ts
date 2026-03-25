import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      tier: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  console.log('=== ALL USERS IN DATABASE ===\n');
  console.log(`Total users: ${await prisma.user.count()}\n`);
  
  for (const user of users) {
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Role: ${user.role}`);
    console.log(`Tier: ${user.tier}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Created: ${user.createdAt}`);
    console.log('---');
  }
  
  // Specifically show Super Admin
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });
  
  console.log('\n=== SUPER ADMIN RECORD ===\n');
  if (superAdmin) {
    console.log('✅ Super Admin EXISTS in database');
    console.log(JSON.stringify(superAdmin, null, 2));
  } else {
    console.log('❌ Super Admin NOT FOUND in database');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
