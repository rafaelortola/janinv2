import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { createPrismaClient } from '../src/prisma/create-prisma-client';

const prisma = createPrismaClient();

async function main() {
  const plans = [
    { name: 'Team 5', seatLimit: 5, priceCents: 9900 },
    { name: 'Team 10', seatLimit: 10, priceCents: 17900 },
    { name: 'Team 25', seatLimit: 25, priceCents: 39900 },
    { name: 'Team 50', seatLimit: 50, priceCents: 69900 },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  const plan5 = await prisma.plan.findUnique({ where: { name: 'Team 5' } });
  if (!plan5) return;

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const existing = await prisma.company.findUnique({ where: { slug: 'acme-corp' } });
  if (existing) {
    console.log('Seed already applied');
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      name: 'Carlos Silva',
      passwordHash,
    },
  });

  const company = await prisma.company.create({
    data: { name: 'Acme Corp', slug: 'acme-corp' },
  });

  await prisma.subscription.create({
    data: {
      companyId: company.id,
      planId: plan5.id,
      seatLimit: 5,
      seatsUsed: 5,
    },
  });

  const members = [
    { email: 'admin@acme.com', name: 'Carlos Silva', jobRole: 'PO' as const, systemRole: 'ADMIN' as const },
    { email: 'ana@acme.com', name: 'Ana Dev', jobRole: 'DEV' as const, systemRole: 'MEMBER' as const },
    { email: 'bruno@acme.com', name: 'Bruno QA', jobRole: 'QA' as const, systemRole: 'MEMBER' as const },
    { email: 'diana@acme.com', name: 'Diana Lead', jobRole: 'TECH_LEAD' as const, systemRole: 'MEMBER' as const },
    { email: 'eduardo@acme.com', name: 'Eduardo PO', jobRole: 'PO' as const, systemRole: 'MEMBER' as const },
  ];

  for (const m of members) {
    const u =
      m.email === 'admin@acme.com'
        ? user
        : await prisma.user.create({
            data: {
              email: m.email,
              name: m.name,
              passwordHash: await bcrypt.hash('Member@123', 12),
            },
          });

    await prisma.member.create({
      data: {
        userId: u.id,
        companyId: company.id,
        jobRole: m.jobRole,
        systemRole: m.systemRole,
      },
    });
  }

  const project = await prisma.project.create({
    data: {
      companyId: company.id,
      key: 'ACME',
      name: 'Acme Platform',
      description: 'Demo project',
    },
  });

  const columns = [
    { name: 'Backlog', status: 'BACKLOG' as const, position: 0 },
    { name: 'To Do', status: 'TODO' as const, position: 1 },
    { name: 'In Progress', status: 'IN_PROGRESS' as const, position: 2 },
    { name: 'In Review', status: 'IN_REVIEW' as const, position: 3 },
    { name: 'Done', status: 'DONE' as const, position: 4 },
  ];
  for (const col of columns) {
    await prisma.boardColumn.create({ data: { ...col, projectId: project.id } });
  }

  const epic = await prisma.workItem.create({
    data: {
      companyId: company.id,
      projectId: project.id,
      type: 'EPIC',
      sequence: 1,
      key: 'ACME-1',
      title: 'User Management',
      status: 'TODO',
    },
  });

  const story = await prisma.workItem.create({
    data: {
      companyId: company.id,
      projectId: project.id,
      parentId: epic.id,
      type: 'STORY',
      sequence: 2,
      key: 'ACME-2',
      title: 'As a user I can login',
      status: 'TODO',
      storyPoints: 5,
    },
  });

  const testPlan = await prisma.testPlan.create({
    data: {
      companyId: company.id,
      projectId: project.id,
      name: 'Login Tests',
    },
  });

  await prisma.testCase.create({
    data: {
      testPlanId: testPlan.id,
      storyId: story.id,
      title: 'Valid login credentials',
      steps: 'Enter email and password',
      expectedResult: 'User redirected to dashboard',
    },
  });

  console.log('Seed completed: admin@acme.com / Admin@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
