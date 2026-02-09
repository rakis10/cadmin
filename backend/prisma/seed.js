import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@cadmin.io' },
    update: {},
    create: {
      email: 'admin@cadmin.io',
      name: 'Super Admin',
      password,
      role: 'SUPER_ADMIN',
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'user@cadmin.io' },
    update: {},
    create: {
      email: 'user@cadmin.io',
      name: 'Demo User',
      password: await bcrypt.hash('user1234', 12),
      role: 'USER',
    },
  });

  // Seed some resources
  const categories = ['General', 'Marketing', 'Engineering', 'Design', 'Operations'];
  const statuses = ['ACTIVE', 'DRAFT', 'ARCHIVED'];

  const resources = [
    { title: 'Q1 Marketing Plan', description: 'Comprehensive marketing strategy for Q1', category: 'Marketing', status: 'ACTIVE' },
    { title: 'API Documentation', description: 'REST API reference documentation', category: 'Engineering', status: 'ACTIVE' },
    { title: 'Brand Guidelines v2', description: 'Updated brand identity and usage guidelines', category: 'Design', status: 'ACTIVE' },
    { title: 'Onboarding Checklist', description: 'New employee onboarding process', category: 'Operations', status: 'ACTIVE' },
    { title: 'Sprint Retrospective Notes', description: 'Notes from latest sprint retro', category: 'Engineering', status: 'DRAFT' },
    { title: 'Social Media Calendar', description: 'Monthly social media posting schedule', category: 'Marketing', status: 'DRAFT' },
    { title: 'Old Style Guide', description: 'Deprecated style guide from 2023', category: 'Design', status: 'ARCHIVED' },
    { title: 'Infrastructure Runbook', description: 'Procedures for common infra tasks', category: 'Engineering', status: 'ACTIVE' },
  ];

  for (const r of resources) {
    await prisma.resource.create({
      data: {
        ...r,
        createdById: Math.random() > 0.5 ? superAdmin.id : demoUser.id,
      },
    });
  }

  console.log('Seed complete');
  console.log('Super Admin: admin@cadmin.io / admin123');
  console.log('Demo User:   user@cadmin.io / user1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
