import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  // Create or update admin user
  const adminPhone = '+6281349924210';
  
  const existingUser = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });

  if (existingUser) {
    // Update existing user to SUPER_ADMIN
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: 'Tazos Admin',
        role: 'SUPER_ADMIN',
        tier: 'S',
      },
    });
    console.log('✅ Updated admin user:', updated.id, updated.name, updated.role);
  } else {
    // Create new admin user
    const admin = await prisma.user.create({
      data: {
        phone: adminPhone,
        name: 'Tazos Admin',
        role: 'SUPER_ADMIN',
        tier: 'S',
      },
    });
    console.log('✅ Created admin user:', admin.id, admin.name, admin.role);
  }

  console.log('🎉 Admin user seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
