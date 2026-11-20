import { PrismaService } from "../api/dist/prisma/prisma.service.js";

const p = new PrismaService();
await p.onModuleInit();

// Delete old BOT and ZOO blueprints from test1
const tests = await p.assessmentTest.findMany({
  where: { code: "NEET-7045" },
  include: { blueprints: true }
});

for (const test of tests) {
  console.log(`Updating test ${test.code} (${test.title})...`);
  // Delete all existing blueprints for this test
  await p.testBlueprint.deleteMany({
    where: { assessmentTestId: test.id }
  });

  // Re-create the 3 official subjects: Physics (45), Chemistry (45), Biology (90)
  await p.testBlueprint.createMany({
    data: [
      {
        assessmentTestId: test.id,
        subjectCode: "PHY",
        subjectName: "Physics",
        sectionName: "Section A",
        totalQuestions: 45,
        mandatoryCount: 45,
        correctMarks: 4,
        negativeMarks: 1,
        orderIndex: 1,
      },
      {
        assessmentTestId: test.id,
        subjectCode: "CHE",
        subjectName: "Chemistry",
        sectionName: "Section A",
        totalQuestions: 45,
        mandatoryCount: 45,
        correctMarks: 4,
        negativeMarks: 1,
        orderIndex: 2,
      },
      {
        assessmentTestId: test.id,
        subjectCode: "BIO",
        subjectName: "Biology",
        sectionName: "Section A",
        totalQuestions: 90,
        mandatoryCount: 90,
        correctMarks: 4,
        negativeMarks: 1,
        orderIndex: 3,
      },
    ]
  });

  // Ensure totalQuestions is 180 and totalMarks is 720
  await p.assessmentTest.update({
    where: { id: test.id },
    data: {
      totalQuestions: 180,
      totalMarks: 720,
    }
  });
  console.log(`Test ${test.code} updated to 3 subjects: Physics 45, Chemistry 45, Biology 90 (Total 180 Qs, 720 Marks).`);
}

// Print all blueprints to verify
const allBp = await p.testBlueprint.findMany({
  include: { assessmentTest: { select: { code: true } } }
});
console.log("Current Blueprints:", JSON.stringify(allBp, null, 2));

await p.$disconnect();
