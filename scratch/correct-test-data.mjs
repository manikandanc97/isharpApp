import { PrismaService } from "../api/dist/prisma/prisma.service.js";

const p = new PrismaService();
await p.onModuleInit();

// Find tests where testType is FULL_SYLLABUS or GRAND_TEST and totalQuestions is not 180
const tests = await p.assessmentTest.findMany({
  where: {
    testType: { in: ["FULL_SYLLABUS", "GRAND_TEST"] },
  },
  include: { blueprints: true },
});

console.log(`Found ${tests.length} full mock / grand tests`);

for (const t of tests) {
  if (t.totalQuestions !== 180 || t.totalMarks !== 720) {
    console.log(`Correcting test ${t.title} (${t.code}): updating totalQuestions 180, totalMarks 720`);
    await p.assessmentTest.update({
      where: { id: t.id },
      data: {
        totalQuestions: 180,
        totalMarks: 720,
      },
    });
  }

  if (t.blueprints.length === 0) {
    console.log(`Adding official NEET 2026 default blueprint to test ${t.title} (${t.code})`);
    const defaultBlueprints = [
      { subjectCode: "PHY", subjectName: "Physics", sectionName: "Section A", totalQuestions: 45, mandatoryCount: 45, correctMarks: 4, negativeMarks: 1, orderIndex: 1 },
      { subjectCode: "CHE", subjectName: "Chemistry", sectionName: "Section A", totalQuestions: 45, mandatoryCount: 45, correctMarks: 4, negativeMarks: 1, orderIndex: 2 },
      { subjectCode: "BOT", subjectName: "Botany", sectionName: "Section A", totalQuestions: 45, mandatoryCount: 45, correctMarks: 4, negativeMarks: 1, orderIndex: 3 },
      { subjectCode: "ZOO", subjectName: "Zoology", sectionName: "Section A", totalQuestions: 45, mandatoryCount: 45, correctMarks: 4, negativeMarks: 1, orderIndex: 4 },
    ];

    for (const b of defaultBlueprints) {
      await p.testBlueprint.create({
        data: {
          assessmentTestId: t.id,
          ...b,
        },
      });
    }
  }
}

console.log("Safe data correction completed successfully.");
process.exit(0);
