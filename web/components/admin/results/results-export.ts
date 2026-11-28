import type { ResultsOverview } from "@/lib/results-store";

export async function exportResultsLeaderboardToExcel(
  data: ResultsOverview,
): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "I-SHARP Academy";
  const ws = wb.addWorksheet("NEET Results Leaderboard");

  ws.addRow([
    "Rank",
    "Student ID",
    "Student Name",
    "Category",
    "Test Paper",
    "Score",
    "Total Marks",
    "Percentage",
    "Accuracy %",
    "Percentile",
    "Physics Score",
    "Chemistry Score",
    "Biology Score",
    "Submitted At",
  ]);

  data.leaderboard.forEach((row) => {
    ws.addRow([
      row.rank,
      row.studentId,
      row.studentName,
      row.category,
      row.testName,
      row.score,
      row.totalMarks,
      `${row.percentage}%`,
      `${row.accuracy}%`,
      row.percentile,
      row.physicsScore,
      row.chemistryScore,
      row.biologyScore,
      row.submittedAt,
    ]);
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `isharp-neet-results-leaderboard-${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
