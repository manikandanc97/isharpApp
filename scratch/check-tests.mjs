import { PrismaService } from "../api/dist/prisma/prisma.service.js";

const p = new PrismaService();
await p.onModuleInit();

const [testCount, qCount, tests] = await Promise.all([
  p.assessmentTest.count(),
  p.question.count(),
  p.assessmentTest.findMany({
    include: {
      testSeries: true,
      _count: { select: { questions: true } },
      blueprints: true,
    },
  }),
]);

console.log("Total Questions in DB:", qCount);
console.log("Total Assessment Tests in DB:", testCount);
console.log("Tests Details:", JSON.stringify(tests.map(t => ({
  id: t.id,
  code: t.code,
  title: t.title,
  testType: t.testType,
  totalQuestions: t.totalQuestions,
  totalMarks: t.totalMarks,
  assignedQuestions: t._count.questions,
  blueprintsCount: t.blueprints.length,
  blueprints: t.blueprints.map(b => ({ subject: b.subjectName, total: b.totalQuestions, mandatory: b.mandatoryCount })),
})), null, 2));

process.exit(0);
