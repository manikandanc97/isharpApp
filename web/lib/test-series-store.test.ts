import { describe, expect, it } from "vitest";
import { testSeriesStore } from "./test-series-store";

describe("Test Series Store & Management Engine", () => {
  it("initializes with the three mandatory default categories", () => {
    const categories = testSeriesStore.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(3);

    const names = categories.map((c) => c.name);
    expect(names).toContain("Class 11");
    expect(names).toContain("Class 12");
    expect(names).toContain("Repeater Course");
  });

  it("supports category CRUD and activation toggles", () => {
    const created = testSeriesStore.addCategory({
      name: "NEET Crash Course",
      slug: "neet-crash-course",
      description: "Fast track 60-day revision series",
      position: 4,
      isActive: true,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("NEET Crash Course");

    // Update category
    const updated = testSeriesStore.updateCategory(created.id, {
      isActive: false,
    });
    expect(updated.isActive).toBe(false);

    // Delete category
    testSeriesStore.deleteCategory(created.id);
    const afterDelete = testSeriesStore.getCategories();
    expect(afterDelete.find((c) => c.id === created.id)).toBeUndefined();
  });

  it("calculates accurate overview stats across series and individual tests", () => {
    const stats = testSeriesStore.getOverviewStats();
    expect(stats.totalSeries).toBeGreaterThanOrEqual(3);
    expect(stats.totalTests).toBeGreaterThanOrEqual(12);
    expect(stats.publishedSeries).toBeGreaterThanOrEqual(1);
    expect(stats.scheduledTests).toBeGreaterThanOrEqual(1);
  });

  it("supports duplicating an entire test series and its child tests", () => {
    const seriesList = testSeriesStore.getSeriesList();
    const sourceSeries = seriesList[0];
    const originalCount = seriesList.length;

    const duplicated = testSeriesStore.duplicateSeries(sourceSeries.id);
    expect(duplicated.name).toContain("(Copy)");
    expect(duplicated.status).toBe("DRAFT");
    expect(duplicated.tests?.length).toBe(sourceSeries.totalTests);

    const nextList = testSeriesStore.getSeriesList();
    expect(nextList.length).toBe(originalCount + 1);

    // Clean up
    testSeriesStore.deleteSeries(duplicated.id);
  });

  it("supports reordering individual tests inside a series", () => {
    const seriesList = testSeriesStore.getSeriesList();
    const series = seriesList[0];
    const initialTests = series.tests || [];
    if (initialTests.length >= 2) {
      const reversedIds = [...initialTests].reverse().map((t) => t.id);
      const reordered = testSeriesStore.reorderTests(series.id, reversedIds);
      expect(reordered[0].id).toBe(reversedIds[0]);
      expect(reordered[0].orderIndex).toBe(1);
    }
  });
});
