import { PrismaService } from '../api/dist/prisma/prisma.service.js';
const p = new PrismaService();
await p.onModuleInit();

async function main() {
  const subjects = await p.subject.findMany();
  console.log('SUBJECTS IN DB:', JSON.stringify(subjects.map(s => ({ id: s.id, name: s.name, code: s.code })), null, 2));

  const questions = await p.question.findMany({
    select: {
      id: true,
      externalId: true,
      courseSubject: {
        select: {
          id: true,
          subject: { select: { id: true, name: true, code: true } }
        }
      }
    }
  });

  const subjectCounts = {};
  for (const q of questions) {
    const key = q.courseSubject?.subject?.name || q.courseSubject?.subject?.code || 'UNKNOWN';
    subjectCounts[key] = (subjectCounts[key] || 0) + 1;
  }
  console.log('QUESTION COUNT PER SUBJECT:', JSON.stringify(subjectCounts, null, 2));

  // Check blueprints on tests
  const blueprints = await p.testBlueprint.findMany({
    include: { assessmentTest: { select: { id: true, code: true, title: true } } }
  });
  console.log('BLUEPRINTS IN DB:', JSON.stringify(blueprints.map(b => ({
    testCode: b.assessmentTest.code,
    subjectCode: b.subjectCode,
    subjectName: b.subjectName,
    sectionName: b.sectionName,
    totalQuestions: b.totalQuestions,
    mandatoryCount: b.mandatoryCount
  })), null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
