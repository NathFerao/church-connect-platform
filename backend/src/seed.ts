import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create sample church
  const church = await prisma.church.create({
    data: {
      name: 'Grace Community Church',
      slug: 'grace-community',
      description: 'A welcoming community of believers',
      address: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      country: 'USA',
      zipCode: '62701',
      phone: '+1-555-0123',
      email: 'info@gracecommunity.org',
      website: 'https://gracecommunity.org',
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      allowPublicEvents: true,
      allowInterChurch: true,
    },
  });

  console.log('✓ Created church:', church.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123456', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gracecommunity.org',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Admin',
      churchId: church.id,
      role: 'CHURCH_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✓ Created admin user:', admin.email);

  // Create sample members
  const members = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sarah@example.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        churchId: church.id,
        role: 'MEMBER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'michael@example.com',
        password: hashedPassword,
        firstName: 'Michael',
        lastName: 'Smith',
        churchId: church.id,
        role: 'LEADER',
        isActive: true,
      },
    }),
  ]);

  console.log('✓ Created sample members');

  // Create sample announcement
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Church Connect!',
      content: 'We are excited to launch our new church community platform. Stay connected with announcements, prayer requests, and more!',
      priority: 'HIGH',
      isPublished: true,
      publishAt: new Date(),
      churchId: church.id,
      authorId: admin.id,
    },
  });

  console.log('✓ Created sample announcement');

  // Create sample prayer request
  await prisma.prayerRequest.create({
    data: {
      title: 'Healing for Our Community',
      description: 'Please pray for healing and comfort for all those affected by recent events.',
      category: 'HEALTH',
      status: 'ACTIVE',
      isAnonymous: false,
      isPrivate: false,
      churchId: church.id,
      requesterId: members[0].id,
    },
  });

  console.log('✓ Created sample prayer request');

  // Create sample testimony
  await prisma.testimony.create({
    data: {
      title: 'God\'s Faithfulness in My Life',
      content: 'I want to share how God has been faithful to me through difficult times. His grace has sustained me and brought me through every challenge.',
      category: 'LIFE_CHANGE',
      isPublished: true,
      isFeatured: true,
      churchId: church.id,
      authorId: members[1].id,
    },
  });

  console.log('✓ Created sample testimony');

  console.log('\nSeed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('Email: admin@gracecommunity.org');
  console.log('Password: Admin@123456');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });