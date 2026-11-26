import type {
  TestSeriesCategory,
  TestSeries,
  IndividualTest,
  TestSeriesOverviewStats,
} from "@/components/admin/test-series/types";

// Dynamic default categories (never hardcoded in UI; dynamically loaded)
export const DEFAULT_TEST_CATEGORIES: TestSeriesCategory[] = [
  {
    id: "cat-class-11",
    name: "Class 11",
    slug: "class-11",
    description: "Targeted NEET Foundation & Advanced Test Series for Grade 11",
    position: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-class-12",
    name: "Class 12",
    slug: "class-12",
    description: "Rigorous Board & National Entrance Mock Series for Grade 12",
    position: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-repeater",
    name: "Repeater Course",
    slug: "repeater-course",
    description: "Intensive 1-Year Droppers & Repeater Rank Booster Mock Papers",
    position: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_TEST_SERIES: TestSeries[] = [
  {
    id: "series-c11-2026",
    name: "NEET 2026 Class 11 Comprehensive Test Series",
    description:
      "Full coverage test series designed exclusively for Class 11 NEET aspirants. Includes chapter-wise, subject-wise, and milestone revision tests.",
    categoryId: "cat-class-11",
    academicYear: "2026-2027",
    coverImage: "/experience/neet-hero.jpg",
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2027-04-30T23:59:59.000Z",
    totalTests: 4,
    totalMarks: 720,
    durationMinutes: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tests: [
      {
        id: "test-c11-01",
        testSeriesId: "series-c11-2026",
        name: "Test 01 – Physics Chapter 1 (Units & Measurements)",
        code: "NEET-11-PHY-01",
        description: "Chapter assessment on Physical World, Units, and Dimensional Analysis.",
        instructions: "+4 marks for correct, -1 for incorrect. 45 questions.",
        instructionsTa: "சரியான பதிலுக்கு +4 மதிப்பெண்கள், தவறான பதிலுக்கு -1 கழித்தல்.",
        testType: "CHAPTER_WISE",
        testDate: "2026-07-15",
        startTime: "10:00",
        endTime: "13:00",
        durationMinutes: 60,
        totalQuestions: 45,
        totalMarks: 180,
        passingMarks: 90,
        negativeMarking: true,
        maxAttempts: 2,
        isActive: true,
        lifecycleStatus: "COMPLETED",
        orderIndex: 1,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-c11-02",
        testSeriesId: "series-c11-2026",
        name: "Test 02 – Chemistry Chapter 1 (Some Basic Concepts)",
        code: "NEET-11-CHE-01",
        description: "Mole concept, stoichiometry, and atomic mass.",
        instructions: "Calculators prohibited. Bilingual instructions provided.",
        instructionsTa: "கணிப்பான் அனுமதிக்கப்படாது. இருமொழி வினாத்தாள்.",
        testType: "CHAPTER_WISE",
        testDate: "2026-07-22",
        startTime: "10:00",
        endTime: "13:00",
        durationMinutes: 60,
        totalQuestions: 45,
        totalMarks: 180,
        passingMarks: 90,
        negativeMarking: true,
        maxAttempts: 2,
        isActive: true,
        lifecycleStatus: "COMPLETED",
        orderIndex: 2,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-c11-03",
        testSeriesId: "series-c11-2026",
        name: "Test 03 – Biology Chapter 1 (The Living World & Classification)",
        code: "NEET-11-BIO-01",
        description: "Taxonomy, binomial nomenclature, and five kingdoms.",
        instructions: "Botanical and Zoological classification questions included.",
        instructionsTa: "தாவரவியல் மற்றும் விலங்கியல் வகைப்பாடு வினாக்கள்.",
        testType: "CHAPTER_WISE",
        testDate: "2026-07-29",
        startTime: "10:00",
        endTime: "13:00",
        durationMinutes: 60,
        totalQuestions: 90,
        totalMarks: 360,
        passingMarks: 180,
        negativeMarking: true,
        maxAttempts: 2,
        isActive: true,
        lifecycleStatus: "ONGOING",
        orderIndex: 3,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-c11-04",
        testSeriesId: "series-c11-2026",
        name: "Test 04 – Class 11 Mid-Term Full Syllabus Grand Test",
        code: "NEET-11-FULL-01",
        description: "Full NTA standard paper covering all term 1 Class 11 topics.",
        instructions: "Strict 180 minutes. Full length test paper.",
        instructionsTa: "180 நிமிடங்கள். முழு நீள தேர்வுத்தாள்.",
        testType: "FULL_SYLLABUS",
        testDate: "2026-08-15",
        startTime: "14:00",
        endTime: "17:20",
        durationMinutes: 180,
        totalQuestions: 180,
        totalMarks: 720,
        passingMarks: 350,
        negativeMarking: true,
        maxAttempts: 1,
        isActive: true,
        lifecycleStatus: "UPCOMING",
        orderIndex: 4,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "series-c12-2026",
    name: "NEET 2026 Class 12 Master Test Series",
    description:
      "High-yield Class 12 syllabus mock series with board-entrance balanced papers and simulated All-India rank benchmarking.",
    categoryId: "cat-class-12",
    academicYear: "2026-2027",
    coverImage: "/experience/neet-hero.jpg",
    startDate: "2026-05-15T00:00:00.000Z",
    endDate: "2027-05-01T23:59:59.000Z",
    totalTests: 4,
    totalMarks: 720,
    durationMinutes: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tests: [
      {
        id: "test-c12-01",
        testSeriesId: "series-c12-2026",
        name: "Test 01 – Physics (Electrostatics & Current Electricity)",
        code: "NEET-12-PHY-01",
        description: "Coulomb's Law, Gauss theorem, circuits, and Kirchhoff's laws.",
        instructions: "+4 correct, -1 incorrect. 45 questions.",
        testType: "SUBJECT_WISE",
        testDate: "2026-06-20",
        startTime: "10:00",
        endTime: "13:00",
        durationMinutes: 60,
        totalQuestions: 45,
        totalMarks: 180,
        passingMarks: 90,
        negativeMarking: true,
        maxAttempts: 1,
        isActive: true,
        lifecycleStatus: "COMPLETED",
        orderIndex: 1,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-c12-02",
        testSeriesId: "series-c12-2026",
        name: "Test 02 – Chemistry (Solutions & Electrochemistry)",
        code: "NEET-12-CHE-01",
        description: "Raoult's law, colligative properties, Nernst equation.",
        instructions: "Numerical questions carry exact scoring.",
        testType: "SUBJECT_WISE",
        testDate: "2026-06-27",
        startTime: "10:00",
        endTime: "13:00",
        durationMinutes: 60,
        totalQuestions: 45,
        totalMarks: 180,
        passingMarks: 90,
        negativeMarking: true,
        maxAttempts: 1,
        isActive: true,
        lifecycleStatus: "COMPLETED",
        orderIndex: 2,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-c12-03",
        testSeriesId: "series-c12-2026",
        name: "Test 03 – Biology (Genetics, Evolution & Biotechnology)",
        code: "NEET-12-BIO-01",
        description: "Mendelian inheritance, molecular basis, and gene technology.",
        instructions: "High weightage NEET questions.",
        testType: "SUBJECT_WISE",
        testDate: "2026-07-04",
        startTime: "10:00",
        endTime: "13:00",
        durationMinutes: 60,
        totalQuestions: 90,
        totalMarks: 360,
        passingMarks: 200,
        negativeMarking: true,
        maxAttempts: 1,
        isActive: true,
        lifecycleStatus: "ONGOING",
        orderIndex: 3,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-c12-04",
        testSeriesId: "series-c12-2026",
        name: "Test 04 – Class 12 Full Syllabus Pre-Board Mock",
        code: "NEET-12-FULL-01",
        description: "Complete Class 12 curriculum simulation under official exam pressure.",
        instructions: "Full 720 marks NTA blueprint.",
        testType: "FULL_SYLLABUS",
        testDate: "2026-09-01",
        startTime: "14:00",
        endTime: "17:20",
        durationMinutes: 180,
        totalQuestions: 180,
        totalMarks: 720,
        passingMarks: 400,
        negativeMarking: true,
        maxAttempts: 1,
        isActive: true,
        lifecycleStatus: "UPCOMING",
        orderIndex: 4,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "series-rep-2026",
    name: "NEET 2026 Repeater Course – Rank Booster Series",
    description:
      "Fast-paced, high-frequency grand tests and weekly speed tests for Repeaters and Droppers aiming for 680+ score.",
    categoryId: "cat-repeater",
    academicYear: "2026-2027",
    coverImage: "/experience/neet-hero.jpg",
    startDate: "2026-05-01T00:00:00.000Z",
    endDate: "2027-05-05T23:59:59.000Z",
    totalTests: 4,
    totalMarks: 720,
    durationMinutes: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tests: [
      {
        id: "test-rep-01",
        testSeriesId: "series-rep-2026",
        name: "Test 01 – Weekly Speed Test 01 (Mechanics & Organic Basics)",
        code: "NEET-REP-W01",
        description: "Speed & accuracy drill covering Kinematics and GOC.",
        instructions: "Strict 90 minutes speed drill.",
        testType: "CHAPTER_WISE",
        testDate: "2026-05-15",
        startTime: "09:00",
        endTime: "10:30",
        durationMinutes: 90,
        totalQuestions: 90,
        totalMarks: 360,
        passingMarks: 180,
        negativeMarking: true,
        maxAttempts: 2,
        isActive: true,
        lifecycleStatus: "COMPLETED",
        orderIndex: 1,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-rep-02",
        testSeriesId: "series-rep-2026",
        name: "Test 02 – Weekly Speed Test 02 (Optics & Chemical Kinetics)",
        code: "NEET-REP-W02",
        description: "Wave optics, Ray optics, rate of reactions, and nuclear chemistry.",
        instructions: "Standard speed drill.",
        testType: "CHAPTER_WISE",
        testDate: "2026-05-22",
        startTime: "09:00",
        endTime: "10:30",
        durationMinutes: 90,
        totalQuestions: 90,
        totalMarks: 360,
        passingMarks: 180,
        negativeMarking: true,
        maxAttempts: 2,
        isActive: true,
        lifecycleStatus: "COMPLETED",
        orderIndex: 2,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-rep-03",
        testSeriesId: "series-rep-2026",
        name: "Test 03 – Grand Test 01 (Combined 11th & 12th Syllabus)",
        code: "NEET-REP-GT01",
        description: "Full length grand test simulating real exam hall environment.",
        instructions: "Full 720 marks test. Mandatory attempt.",
        testType: "GRAND_TEST",
        testDate: "2026-06-10",
        startTime: "14:00",
        endTime: "17:20",
        durationMinutes: 180,
        totalQuestions: 180,
        totalMarks: 720,
        passingMarks: 450,
        negativeMarking: true,
        maxAttempts: 1,
        isActive: true,
        lifecycleStatus: "ONGOING",
        orderIndex: 3,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-rep-04",
        testSeriesId: "series-rep-2026",
        name: "Test 04 – Grand Test 02 (All India Benchmark Paper)",
        code: "NEET-REP-GT02",
        description: "Grand Test 02 with live state-wide rank predictor.",
        instructions: "Full NTA blueprint test paper.",
        testType: "GRAND_TEST",
        testDate: "2026-07-01",
        startTime: "14:00",
        endTime: "17:20",
        durationMinutes: 180,
        totalQuestions: 180,
        totalMarks: 720,
        passingMarks: 500,
        negativeMarking: true,
        maxAttempts: 1,
        isActive: true,
        lifecycleStatus: "UPCOMING",
        orderIndex: 4,
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
];

// Singleton store maintaining memory state in Next.js server instance
class TestSeriesDataStore {
  private categories: TestSeriesCategory[] = [...DEFAULT_TEST_CATEGORIES];
  private series: TestSeries[] = JSON.parse(JSON.stringify(INITIAL_TEST_SERIES));

  getCategories(): TestSeriesCategory[] {
    return [...this.categories].sort((a, b) => a.position - b.position);
  }

  addCategory(category: Omit<TestSeriesCategory, "id" | "createdAt" | "updatedAt">): TestSeriesCategory {
    const newCat: TestSeriesCategory = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.categories.push(newCat);
    return newCat;
  }

  updateCategory(id: string, updates: Partial<TestSeriesCategory>): TestSeriesCategory {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    this.categories[index] = {
      ...this.categories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.categories[index];
  }

  deleteCategory(id: string): void {
    const inUse = this.series.some((s) => s.categoryId === id);
    if (inUse) {
      throw new Error("Cannot delete category currently associated with test series. Move or delete the series first.");
    }
    this.categories = this.categories.filter((c) => c.id !== id);
  }

  getSeriesList(): TestSeries[] {
    return this.series.map((s) => {
      const cat = this.categories.find((c) => c.id === s.categoryId);
      const testCount = s.tests?.length || 0;
      return {
        ...s,
        categoryName: cat?.name || "Unassigned",
        totalTests: testCount,
      };
    });
  }

  getSeriesById(id: string): TestSeries | null {
    const s = this.series.find((item) => item.id === id);
    if (!s) return null;
    const cat = this.categories.find((c) => c.id === s.categoryId);
    return {
      ...s,
      categoryName: cat?.name || "Unassigned",
      totalTests: s.tests?.length || 0,
    };
  }

  createSeries(data: Omit<TestSeries, "id" | "createdAt" | "updatedAt" | "totalTests">): TestSeries {
    const newSeries: TestSeries = {
      ...data,
      id: `series-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      totalTests: 0,
      tests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.series.unshift(newSeries);
    return this.getSeriesById(newSeries.id)!;
  }

  updateSeries(id: string, updates: Partial<TestSeries>): TestSeries {
    const index = this.series.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Test series not found");
    this.series[index] = {
      ...this.series[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.getSeriesById(id)!;
  }

  deleteSeries(id: string): void {
    this.series = this.series.filter((s) => s.id !== id);
  }

  duplicateSeries(id: string): TestSeries {
    const original = this.getSeriesById(id);
    if (!original) throw new Error("Test series not found");
    const duplicatedTests = (original.tests || []).map((t) => ({
      ...t,
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${t.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const duplicatedSeries: TestSeries = {
      ...original,
      id: `series-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${original.name} (Copy)`,
      tests: duplicatedTests,
      totalTests: duplicatedTests.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.series.unshift(duplicatedSeries);
    return this.getSeriesById(duplicatedSeries.id)!;
  }

  addTestToSeries(seriesId: string, testData: Omit<IndividualTest, "id" | "testSeriesId" | "createdAt" | "updatedAt">): IndividualTest {
    const series = this.series.find((s) => s.id === seriesId);
    if (!series) throw new Error("Test series not found");
    if (!series.tests) series.tests = [];

    const newTest: IndividualTest = {
      ...testData,
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      testSeriesId: seriesId,
      orderIndex: (series.tests.length || 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    series.tests.push(newTest);
    series.totalTests = series.tests.length;
    series.updatedAt = new Date().toISOString();
    return newTest;
  }

  updateTest(seriesId: string, testId: string, updates: Partial<IndividualTest>): IndividualTest {
    const series = this.series.find((s) => s.id === seriesId);
    if (!series || !series.tests) throw new Error("Test series not found");
    const testIndex = series.tests.findIndex((t) => t.id === testId);
    if (testIndex === -1) throw new Error("Test not found");

    series.tests[testIndex] = {
      ...series.tests[testIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    series.updatedAt = new Date().toISOString();
    return series.tests[testIndex];
  }

  deleteTest(seriesId: string, testId: string): void {
    const series = this.series.find((s) => s.id === seriesId);
    if (!series || !series.tests) throw new Error("Test series not found");
    series.tests = series.tests.filter((t) => t.id !== testId);
    // re-index
    series.tests.forEach((t, i) => {
      t.orderIndex = i + 1;
    });
    series.totalTests = series.tests.length;
    series.updatedAt = new Date().toISOString();
  }

  duplicateTest(seriesId: string, testId: string): IndividualTest {
    const series = this.series.find((s) => s.id === seriesId);
    if (!series || !series.tests) throw new Error("Test series not found");
    const original = series.tests.find((t) => t.id === testId);
    if (!original) throw new Error("Test not found");

    const duplicated: IndividualTest = {
      ...original,
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${original.name} (Copy)`,
      orderIndex: series.tests.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    series.tests.push(duplicated);
    series.totalTests = series.tests.length;
    series.updatedAt = new Date().toISOString();
    return duplicated;
  }

  reorderTests(seriesId: string, orderedTestIds: string[]): IndividualTest[] {
    const series = this.series.find((s) => s.id === seriesId);
    if (!series || !series.tests) throw new Error("Test series not found");

    const testMap = new Map(series.tests.map((t) => [t.id, t]));
    const nextList: IndividualTest[] = [];

    orderedTestIds.forEach((id, index) => {
      const t = testMap.get(id);
      if (t) {
        t.orderIndex = index + 1;
        nextList.push(t);
      }
    });

    // append any missing
    series.tests.forEach((t) => {
      if (!orderedTestIds.includes(t.id)) {
        t.orderIndex = nextList.length + 1;
        nextList.push(t);
      }
    });

    series.tests = nextList;
    series.updatedAt = new Date().toISOString();
    return series.tests;
  }

  getOverviewStats(): TestSeriesOverviewStats {
    const allSeries = this.series;
    const allTests = allSeries.flatMap((s) => s.tests || []);

    return {
      totalSeries: allSeries.length,
      totalTests: allTests.length,
      upcomingTests: allTests.filter((t) => t.lifecycleStatus === "UPCOMING").length,
      completedTests: allTests.filter((t) => t.lifecycleStatus === "COMPLETED").length,
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __testSeriesStore: TestSeriesDataStore | undefined;
}

export const testSeriesStore = globalThis.__testSeriesStore ?? new TestSeriesDataStore();
if (process.env.NODE_ENV !== "production") {
  globalThis.__testSeriesStore = testSeriesStore;
}
