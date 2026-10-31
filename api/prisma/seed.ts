import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const roles = [
  {
    name: 'ADMIN',
    description: 'Academy administrator',
  },
  {
    name: 'SUPERADMIN',
    description: 'System administrator with privileged account management',
  },
  {
    name: 'STUDENT',
    description: 'Enrolled learner',
  },
] as const;

async function main(): Promise<void> {
  await prisma.$transaction(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        create: role,
        update: { description: role.description },
      }),
    ),
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
