// ============================================================
// FILE: backend/prisma/seed.ts  (REPLACE - NO process.exit)
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================
  // STEP 1: Create Sample Church
  // ============================================================
  const church = await prisma.church.upsert({
    where: { slug: 'grace-community' },
    update: {},
    create: {
      name: 'Grace Community Church',
      slug: 'grace-community',
      description: 'A welcoming community church',
      city: 'Goa',
      state: 'Goa',
      country: 'India',
      phone: '+91-1234567890',
      email: 'info@gracecommunity.org',
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      allowPublicEvents: true,
      allowInterChurch: true,
    },
  });

  console.log('✓ Church created:', church.name);

  // ============================================================
  // STEP 2: Create Super Admin (Platform Administrator)
  // ============================================================
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 12);

  await prisma.user.upsert({
    where: { email: 'superadmin@churchconnect.com' },
    update: {},
    create: {
      email: 'superadmin@churchconnect.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      churchId: church.id,
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✓ Super admin created');
  console.log('  Email: superadmin@churchconnect.com');
  console.log('  Password: SuperAdmin@123');

  // ============================================================
  // STEP 3: Create Church Admin (for Grace Community)
  // ============================================================
  const churchAdminPassword = await bcrypt.hash('Admin@123456', 12);

  const churchAdmin = await prisma.user.upsert({
    where: { email: 'admin@gracecommunity.org' },
    update: {},
    create: {
      email: 'admin@gracecommunity.org',
      password: churchAdminPassword,
      firstName: 'Church',
      lastName: 'Admin',
      role: 'CHURCH_ADMIN',
      churchId: church.id,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✓ Church admin created');
  console.log('  Email: admin@gracecommunity.org');
  console.log('  Password: Admin@123456');

  // ============================================================
  // STEP 4: Create Sample Members
  // ============================================================
  const memberPassword = await bcrypt.hash('Member@123', 12);

  const member1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: memberPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'MEMBER',
      churchId: church.id,
      isActive: true,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      password: memberPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'LEADER',
      churchId: church.id,
      isActive: true,
    },
  });

  console.log('✓ Sample members created');

  // ============================================================
  // STEP 5: Create Sample Announcement
  // ============================================================
  await prisma.announcement.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Welcome to Church Connect!',
      content: 'We are excited to launch our new church community platform. Stay connected with announcements, prayer requests, testimonies, and events!',
      priority: 'HIGH',
      isPublished: true,
      publishAt: new Date(),
      churchId: church.id,
      authorId: churchAdmin.id,
    },
  });

  console.log('✓ Sample announcement created');

  // ============================================================
  // STEP 6: Create Sample Prayer Request
  // ============================================================
  await prisma.prayerRequest.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Healing for Our Community',
      description: 'Please pray for healing and comfort for all those affected by recent events in our community.',
      category: 'HEALTH',
      status: 'ACTIVE',
      isAnonymous: false,
      isPrivate: false,
      churchId: church.id,
      requesterId: member1.id,
    },
  });

  console.log('✓ Sample prayer request created');

  // ============================================================
  // STEP 7: Create Sample Testimony
  // ============================================================
  await prisma.testimony.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'God\'s Faithfulness in My Life',
      content: 'I want to share how God has been faithful to me through difficult times. His grace has sustained me and brought me through every challenge. I am grateful for this community that has supported me.',
      category: 'LIFE_CHANGE',
      isPublished: true,
      isFeatured: true,
      churchId: church.id,
      authorId: member2.id,
    },
  });

  console.log('✓ Sample testimony created');

  // ============================================================
  // STEP 8: Create Sample Event
  // ============================================================
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
  nextSunday.setHours(10, 0, 0, 0);

  const endTime = new Date(nextSunday);
  endTime.setHours(12, 0, 0, 0);

  await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      title: 'Sunday Worship Service',
      description: 'Join us for our weekly worship service with praise, teaching, and fellowship.',
      type: 'SERVICE',
      location: 'Main Sanctuary',
      startTime: nextSunday,
      endTime: endTime,
      isPublic: true,
      churchId: church.id,
    },
  });

  console.log('✓ Sample event created');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('═══════════════════════════════════════');
  console.log('LOGIN CREDENTIALS:');
  console.log('═══════════════════════════════════════');
  console.log('\n📱 SUPER ADMIN (Platform Owner):');
  console.log('   Email:    superadmin@churchconnect.com');
  console.log('   Password: SuperAdmin@123');
  console.log('   Access:   /admin/churches (all churches)');
  console.log('\n⛪ CHURCH ADMIN (Grace Community):');
  console.log('   Email:    admin@gracecommunity.org');
  console.log('   Password: Admin@123456');
  console.log('   Access:   /settings (church settings)');
  console.log('\n👥 SAMPLE MEMBERS:');
  console.log('   Email:    john@example.com');
  console.log('   Email:    jane@example.com');
  console.log('   Password: Member@123');
  console.log('\n═══════════════════════════════════════\n');
}

// Just let errors bubble up naturally - no process.exit needed
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    throw e;  // Re-throw instead of process.exit
  })
  .finally(async () => {
    await prisma.$disconnect();
  });