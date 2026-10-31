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
    id: '10000000-0000-4000-8000-000000000001',
    name: 'ADMIN',
    description: 'Academy administrator',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'INSTRUCTOR',
    description: 'Faculty member',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
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
