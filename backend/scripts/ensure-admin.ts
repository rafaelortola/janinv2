import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { createPrismaClient } from '../src/prisma/create-prisma-client';

const prisma = createPrismaClient();

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin';

async function main() {
  let company = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!company) {
    const plan = await prisma.plan.findFirst({ orderBy: { seatLimit: 'asc' } });
    if (!plan) {
      throw new Error('Nenhum plano encontrado. Rode: npm run db:seed');
    }

    company = await prisma.company.create({
      data: {
        name: 'Acme Corp',
        slug: 'acme-corp',
        subscription: {
          create: {
            planId: plan.id,
            seatLimit: plan.seatLimit,
            seatsUsed: 1,
          },
        },
      },
    });
    console.log('Empresa criada:', company.name);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, name: 'Admin' },
    create: { email: ADMIN_EMAIL, name: 'Admin', passwordHash },
  });

  await prisma.member.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: { systemRole: 'ADMIN', status: 'ACTIVE' },
    create: {
      userId: user.id,
      companyId: company.id,
      systemRole: 'ADMIN',
      jobRole: 'OTHER',
      status: 'ACTIVE',
    },
  });

  const valid = await bcrypt.compare(ADMIN_PASSWORD, passwordHash);
  console.log('Admin configurado com sucesso!');
  console.log('  Usuário: admin  ou  admin@admin.com');
  console.log('  Senha:   admin');
  console.log('  Banco:  ', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  console.log('  Senha OK no hash:', valid);
}

main()
  .catch((err) => {
    console.error('Erro ao configurar admin:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
