import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { QuestionDuplicateDetectionService } from '../src/question-bank/question-duplicate-detection.service.js';
import { QuestionBankService } from '../src/question-bank/question-bank.service.js';

async function main() {
  console.log('--- Starting Question Fingerprint Backfill ---');
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  try {
    const dupService = new QuestionDuplicateDetectionService();
    const service = new QuestionBankService(
      prisma,
      new ConfigService(),
      dupService,
    );

    const initialNullCount = await prisma.question.count({
      where: { contentFingerprint: null },
    });
    console.log(`Questions needing fingerprints: ${initialNullCount}`);

    if (initialNullCount === 0) {
      console.log('All questions already have fingerprints.');
      return;
    }

    const result = await service.backfillFingerprints(50);
    console.log('Backfill result:', result);

    const remainingNullCount = await prisma.question.count({
      where: { contentFingerprint: null },
    });
    console.log(`Remaining questions with null fingerprints: ${remainingNullCount}`);

    const totalCount = await prisma.question.count();
    console.log(`Total questions in database: ${totalCount}`);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.onModuleDestroy();
  }
}

void main();
