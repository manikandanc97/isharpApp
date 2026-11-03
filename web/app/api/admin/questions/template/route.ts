import ExcelJS from 'exceljs';
import type { NextRequest } from 'next/server';
import { QUESTION_HEADERS } from '@/lib/question-import';
import { getRequestAccessToken } from '@/lib/server-access-token';

export async function GET(request: NextRequest) {
  if (!await getRequestAccessToken(request)) return Response.json({ message: 'Authentication is required' }, { status: 401 });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Questions');
  sheet.addRow([...QUESTION_HEADERS]);
  sheet.addRow(['NEET-PHY-001', 'NEET', 'PHYSICS', 'Units and Measurements', 'SINGLE_CORRECT', 'BILINGUAL', 'MEDIUM', 'English question text', 'தமிழ் கேள்வி', '', 'Option A', 'விருப்பம் A', '', 'Option B', 'விருப்பம் B', '', 'Option C', 'விருப்பம் C', '', 'Option D', 'விருப்பம் D', '', 'B', '', 'English solution', 'தமிழ் தீர்வு', '', 4, 1, 'NEET practice']);
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18134F' } }; sheet.views = [{ state: 'frozen', ySplit: 1 }]; sheet.autoFilter = { from: 'A1', to: 'AD1' }; sheet.columns.forEach((column) => { column.width = 22; });
  sheet.getRow(2).height = 90;
  QUESTION_HEADERS.forEach((header, index) => { if (header.endsWith('_image')) { sheet.getColumn(index + 1).width = 28; sheet.getCell(2, index + 1).note = 'Insert a JPG/PNG picture here and resize it completely inside this cell. Import uploads it to Supabase automatically. A public HTTPS URL is also supported.'; sheet.getCell(2, index + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7D6' } }; } });
  const instructions = workbook.addWorksheet('Instructions');
  [
    ['Field', 'Allowed value / rule'], ['course_code', 'Use NEET'], ['subject_code', 'PHYSICS, CHEMISTRY or BIOLOGY'],
    ['question_type', 'SINGLE_CORRECT, MULTIPLE_CORRECT or NUMERICAL'], ['language', 'ENGLISH, TAMIL or BILINGUAL'], ['difficulty', 'EASY, MEDIUM or HARD'],
    ['correct_options', 'A for single answer; A,C for multiple answers; blank for numerical'], ['image columns', 'Insert > Pictures, place one JPG/PNG completely inside the matching *_image cell. Import uploads it to Supabase automatically. Existing public HTTPS URLs also work.'],
    ['embedded image limits', 'Maximum 100 pictures per workbook, 5 MB per picture and 25 MB workbook.'],
    ['marks', 'NEET default is +4 correct and -1 wrong'], ['duplicate policy', 'external_id is matched case-insensitively. Existing IDs and later repetitions in the same workbook are skipped; existing questions are never overwritten.'],
    ['batch limit', 'Maximum 500 non-empty question rows per workbook.'], ['Important', 'Do not rename columns. Every new question must have a unique external_id.'],
  ].forEach((row) => instructions.addRow(row)); instructions.getRow(1).font = { bold: true }; instructions.columns = [{ width: 24 }, { width: 100 }];
  const bytes = await workbook.xlsx.writeBuffer();
  return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="isharp-neet-question-template.xlsx"', 'Cache-Control': 'no-store' } });
}
