import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '+6281349924210';
  
  // Check if super admin exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });
  
  if (existingAdmin) {
    console.log('Super Admin already exists:');
    console.log({
      id: existingAdmin.id,
      name: existingAdmin.name,
      phone: existingAdmin.phone,
      role: existingAdmin.role,
      tier: existingAdmin.tier,
    });
    
    // Update if needed
    const updated = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        phone: adminPhone,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        tier: 'S',
        isActive: true,
      }
    });
    console.log('\nUpdated Super Admin:');
    console.log({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      role: updated.role,
      tier: updated.tier,
    });
    return;
  }
  
  // Create new super admin
  const superAdmin = await prisma.user.create({
    data: {
      phone: adminPhone,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      tier: 'S',
      isActive: true,
    }
  });
  
  console.log('Super Admin created successfully!');
  console.log({
    id: superAdmin.id,
    name: superAdmin.name,
    phone: superAdmin.phone,
    role: superAdmin.role,
    tier: superAdmin.tier,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
