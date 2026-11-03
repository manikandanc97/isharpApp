/* eslint-disable @next/next/no-img-element */
"use client";

import {
  AlertCircle,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  FileQuestion,
  FileSpreadsheet,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Option = {
  label: string;
  textEn: string | null;
  textTa: string | null;
  imageUrl: string | null;
  isCorrect: boolean;
};
type Question = {
  id: string;
  externalId: string;
  type: string;
  language: string;
  difficulty: string;
  textEn: string | null;
  textTa: string | null;
  questionImageUrl: string | null;
  solutionEn: string | null;
  solutionTa: string | null;
  solutionImageUrl: string | null;
  numericalAnswer: string | null;
  source: string | null;
  correctMarks: number;
  negativeMarks: number;
  options: Option[];
  courseSubject: {
    course: { code: string };
    subject: { code: string; name: string };
  };
  chapter: { title: string } | null;
};
type MockTest = {
  id: string;
  code: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  status: string;
  _count: { questions: number };
};
type Draft = {
  externalId: string;
  courseCode: string;
  subjectCode: string;
  chapterTitle: string;
  type: string;
  language: string;
  difficulty: string;
  textEn: string;
  textTa: string;
  questionImageUrl: string;
  solutionEn: string;
  solutionTa: string;
  solutionImageUrl: string;
  numericalAnswer: string;
  source: string;
  options: {
    label: string;
    textEn: string;
    textTa: string;
    imageUrl: string;
    isCorrect: boolean;
  }[];
};
type ImportRowResult = {
  row: number;
  externalId?: string;
  status: "imported" | "skipped" | "failed";
  reason?: string;
  error?: string;
};
type ImportReport = {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  results: ImportRowResult[];
};
const emptyDraft = (): Draft => ({
  externalId: `NEET-${Date.now().toString().slice(-8)}`,
  courseCode: "",
  subjectCode: "",
  chapterTitle: "",
  type: "SINGLE_CORRECT",
  language: "BILINGUAL",
  difficulty: "MEDIUM",
  textEn: "",
  textTa: "",
  questionImageUrl: "",
  solutionEn: "",
  solutionTa: "",
  solutionImageUrl: "",
  numericalAnswer: "",
  source: "",
  options: ["A", "B", "C", "D"].map((label) => ({
    label,
    textEn: "",
    textTa: "",
    imageUrl: "",
    isCorrect: label === "A",
  })),
});

const demoQuestions: Question[] = [
  {
    id: "demo-physics-force",
    externalId: "DEMO-PHY-001",
    type: "SINGLE_CORRECT",
    language: "BILINGUAL",
    difficulty: "MEDIUM",
    textEn:
      "A 2 kg body accelerates at 3 m/s². What is the net force acting on it?",
    textTa:
      "2 kg நிறையுள்ள பொருள் 3 m/s² முடுக்கத்தில் நகர்கிறது. அதன் மீது செயல்படும் நிகர விசை என்ன?",
    questionImageUrl: null,
    solutionEn: "Using Newton’s second law, F = ma = 2 × 3 = 6 N.",
    solutionTa: "நியூட்டனின் இரண்டாம் விதிப்படி F = ma = 2 × 3 = 6 N.",
    solutionImageUrl: null,
    numericalAnswer: null,
    source: "NCERT Physics · Laws of Motion",
    correctMarks: 4,
    negativeMarks: 1,
    options: ["2 N", "3 N", "6 N", "9 N"].map((text, index) => ({
      label: ["A", "B", "C", "D"][index],
      textEn: text,
      textTa: null,
      imageUrl: null,
      isCorrect: index === 2,
    })),
    courseSubject: {
      course: { code: "NEET" },
      subject: { code: "PHYSICS", name: "Physics" },
    },
    chapter: { title: "Laws of Motion" },
  },
  {
    id: "demo-physics-optics",
    externalId: "DEMO-PHY-002",
    type: "SINGLE_CORRECT",
    language: "ENGLISH",
    difficulty: "EASY",
    textEn: "Which lens is used to correct myopia?",
    textTa: null,
    questionImageUrl: null,
    solutionEn:
      "A concave lens diverges incoming rays before they enter the eye, shifting the image onto the retina.",
    solutionTa: null,
    solutionImageUrl: null,
    numericalAnswer: null,
    source: "NCERT Physics · Ray Optics",
    correctMarks: 4,
    negativeMarks: 1,
    options: [
      "Convex lens",
      "Concave lens",
      "Cylindrical lens",
      "Bifocal lens",
    ].map((text, index) => ({
      label: ["A", "B", "C", "D"][index],
      textEn: text,
      textTa: null,
      imageUrl: null,
      isCorrect: index === 1,
    })),
    courseSubject: {
      course: { code: "NEET" },
      subject: { code: "PHYSICS", name: "Physics" },
    },
    chapter: { title: "Ray Optics" },
  },
  {
    id: "demo-chemistry-ph",
    externalId: "DEMO-CHE-001",
    type: "SINGLE_CORRECT",
    language: "ENGLISH",
    difficulty: "MEDIUM",
    textEn: "What is the pH of a 1 × 10⁻³ M HCl solution?",
    textTa: null,
    questionImageUrl: null,
    solutionEn: "HCl is a strong acid, so [H⁺] = 10⁻³ M and pH = −log[H⁺] = 3.",
    solutionTa: null,
    solutionImageUrl: null,
    numericalAnswer: null,
    source: "NCERT Chemistry · Equilibrium",
    correctMarks: 4,
    negativeMarks: 1,
    options: ["1", "2", "3", "11"].map((text, index) => ({
      label: ["A", "B", "C", "D"][index],
      textEn: text,
      textTa: null,
      imageUrl: null,
      isCorrect: index === 2,
    })),
    courseSubject: {
      course: { code: "NEET" },
      subject: { code: "CHEMISTRY", name: "Chemistry" },
    },
    chapter: { title: "Equilibrium" },
  },
  {
    id: "demo-biology-cell",
    externalId: "DEMO-BIO-001",
    type: "SINGLE_CORRECT",
    language: "BILINGUAL",
    difficulty: "EASY",
    textEn: "Which organelle is known as the powerhouse of the cell?",
    textTa: "செல்லின் ஆற்றல் மையம் என அழைக்கப்படும் நுண்ணுறுப்பு எது?",
    questionImageUrl: null,
    solutionEn:
      "Mitochondria generate most cellular ATP through aerobic respiration.",
    solutionTa:
      "மைட்டோகாண்ட்ரியா காற்றுச் சுவாசத்தின் மூலம் செல்லுக்குத் தேவையான ATP-ஐ உருவாக்குகிறது.",
    solutionImageUrl: null,
    numericalAnswer: null,
    source: "NCERT Biology · Cell: The Unit of Life",
    correctMarks: 4,
    negativeMarks: 1,
    options: ["Ribosome", "Golgi apparatus", "Mitochondrion", "Lysosome"].map(
      (text, index) => ({
        label: ["A", "B", "C", "D"][index],
        textEn: text,
        textTa: null,
        imageUrl: null,
        isCorrect: index === 2,
      }),
    ),
    courseSubject: {
      course: { code: "NEET" },
      subject: { code: "BIOLOGY", name: "Biology" },
    },
    chapter: { title: "Cell: The Unit of Life" },
  },
];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload as T;
}

export function QuestionBankManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<"bank" | "tests">("bank");
  const [subjectFilter, setSubjectFilter] = useState<
    "PHYSICS" | "CHEMISTRY" | "BIOLOGY"
  >("PHYSICS");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [q, t] = await Promise.all([
        request<Question[]>("questions"),
        request<MockTest[]>("mock-tests"),
      ]);
      setQuestions(q);
      setTests(t);
      setDraft((current) =>
        current.courseCode
          ? current
          : { ...current, courseCode: "NEET", subjectCode: "PHYSICS" },
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Question bank could not load",
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!editorOpen && !importOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (importOpen && !importBusy) setImportOpen(false);
        else if (editorOpen) setEditorOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [editorOpen, importBusy, importOpen]);
  const visible = useMemo(() => {
    const value = query.toLowerCase();
    return questions.filter(
      (item) =>
        item.courseSubject.subject.code === subjectFilter &&
        (!value ||
          item.externalId.toLowerCase().includes(value) ||
          item.textEn?.toLowerCase().includes(value) ||
          item.textTa?.toLowerCase().includes(value)),
    );
  }, [questions, query, subjectFilter]);
  const patchOption = (
    index: number,
    patch: Partial<Draft["options"][number]>,
  ) =>
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    }));
  const chooseCorrect = (index: number) =>
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({
        ...option,
        isCorrect:
          current.type === "MULTIPLE_CORRECT"
            ? optionIndex === index
              ? !option.isCorrect
              : option.isCorrect
            : optionIndex === index,
      })),
    }));
  const uploadImage = async (file: File, apply: (url: string) => void) => {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/question-media", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        url?: string;
        message?: string;
      };
      if (!response.ok || !payload.url)
        throw new Error(payload.message || "Upload failed");
      apply(payload.url);
      setNotice("Image uploaded securely.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("questions", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          courseCode: "NEET",
          subjectCode: subjectFilter,
          correctMarks: 4,
          negativeMarks: 1,
        }),
      });
      setDraft({
        ...emptyDraft(),
        courseCode: "NEET",
        subjectCode: subjectFilter,
      });
      setEditingId(null);
      setEditorOpen(false);
      setNotice(
        editingId
          ? "Question updated successfully."
          : "Question added successfully.",
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Question save failed");
    } finally {
      setBusy(false);
    }
  };
  const editQuestion = (question: Question) => {
    const options = ["A", "B", "C", "D"].map((label) => {
      const existing = question.options.find((item) => item.label === label);
      return {
        label,
        textEn: existing?.textEn ?? "",
        textTa: existing?.textTa ?? "",
        imageUrl: existing?.imageUrl ?? "",
        isCorrect: existing?.isCorrect ?? false,
      };
    });
    setSubjectFilter(
      question.courseSubject.subject.code as typeof subjectFilter,
    );
    setEditingId(question.id);
    setDraft({
      externalId: question.externalId,
      courseCode: question.courseSubject.course.code,
      subjectCode: question.courseSubject.subject.code,
      chapterTitle: question.chapter?.title ?? "",
      type: question.type,
      language: question.language,
      difficulty: question.difficulty,
      textEn: question.textEn ?? "",
      textTa: question.textTa ?? "",
      questionImageUrl: question.questionImageUrl ?? "",
      solutionEn: question.solutionEn ?? "",
      solutionTa: question.solutionTa ?? "",
      solutionImageUrl: question.solutionImageUrl ?? "",
      numericalAnswer: question.numericalAnswer ?? "",
      source: question.source ?? "",
      options,
    });
    setEditorOpen(true);
  };
  const createQuestion = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft(),
      courseCode: "NEET",
      subjectCode: subjectFilter,
    });
    setEditorOpen(true);
  };
  const applyDemoQuestion = (question: Question) => {
    const fresh = emptyDraft();
    setSubjectFilter(
      question.courseSubject.subject.code as typeof subjectFilter,
    );
    setEditingId(null);
    setDraft({
      externalId: fresh.externalId,
      courseCode: "NEET",
      subjectCode: question.courseSubject.subject.code,
      chapterTitle: question.chapter?.title ?? "",
      type: question.type,
      language: question.language,
      difficulty: question.difficulty,
      textEn: question.textEn ?? "",
      textTa: question.textTa ?? "",
      questionImageUrl: question.questionImageUrl ?? "",
      solutionEn: question.solutionEn ?? "",
      solutionTa: question.solutionTa ?? "",
      solutionImageUrl: question.solutionImageUrl ?? "",
      numericalAnswer: question.numericalAnswer ?? "",
      source: question.source ?? "",
      options: ["A", "B", "C", "D"].map((label) => {
        const option = question.options.find((item) => item.label === label);
        return {
          label,
          textEn: option?.textEn ?? "",
          textTa: option?.textTa ?? "",
          imageUrl: option?.imageUrl ?? "",
          isCorrect: option?.isCorrect ?? false,
        };
      }),
    });
    setEditorOpen(true);
  };
  const deleteQuestion = async (question: Question) => {
    if (
      !window.confirm(`Delete ${question.externalId}? This cannot be undone.`)
    )
      return;
    setBusy(true);
    try {
      await request(`questions/${question.id}`, { method: "DELETE" });
      setQuestions((current) =>
        current.filter((item) => item.id !== question.id),
      );
      setSelected((current) => current.filter((id) => id !== question.id));
      setNotice("Question deleted.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Question delete failed",
      );
    } finally {
      setBusy(false);
    }
  };
  const selectImportFile = (file: File | null) => {
    setImportReport(null);
    if (!file) {
      setImportFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportFile(null);
      setError("Choose a valid .xlsx workbook.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setImportFile(null);
      setError("Excel file must be 25 MB or smaller.");
      return;
    }
    setError("");
    setImportFile(file);
  };
  const importExcel = async () => {
    if (!importFile) return;
    setImportBusy(true);
    setError("");
    setImportReport(null);
    try {
      const form = new FormData();
      form.set("file", importFile);
      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as ImportReport & {
        message?: string;
      };
      if (!response.ok) throw new Error(result.message || "Import failed");
      setImportReport(result);
      setNotice(
        [result.imported, " imported, ", result.skipped, " skipped, ", result.failed, " failed."].join(""),
      );
      if (result.imported) await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Excel import failed");
    } finally {
      setImportBusy(false);
    }
  };
  const subjectCounts = {
    PHYSICS: questions.filter(
      (item) => item.courseSubject.subject.code === "PHYSICS",
    ).length,
    CHEMISTRY: questions.filter(
      (item) => item.courseSubject.subject.code === "CHEMISTRY",
    ).length,
    BIOLOGY: questions.filter(
      (item) => item.courseSubject.subject.code === "BIOLOGY",
    ).length,
  };
  const showingExamples =
    !busy && !query.trim() && subjectCounts[subjectFilter] === 0;
  const libraryQuestions = showingExamples
    ? demoQuestions.filter(
        (item) => item.courseSubject.subject.code === subjectFilter,
      )
    : visible;
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">
              <BookOpenCheck className="size-3.5" /> Content operations
            </div>
            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">
              Assessment content workspace
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Author, validate and organise bilingual NEET questions and mock
              assessments across the core syllabus.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {[
                {
                  label: "Questions",
                  value: questions.length,
                  icon: FileQuestion,
                },
                {
                  label: "Mock tests",
                  value: tests.length,
                  icon: ClipboardCheck,
                },
                { label: "Selected", value: selected.length, icon: Target },
              ].map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className={`min-w-24 px-3 py-3 ${index ? "border-l border-slate-100" : ""}`}
                  >
                    <div className="flex items-center gap-1.5 text-indigo-700">
                      <Icon className="size-3.5" />
                      <span className="text-lg font-black text-slate-950">
                        {metric.value}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {metric.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={createQuestion}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-red px-4 text-xs font-bold text-white shadow-primary transition hover:bg-brand-red-hover active:scale-95"
              >
                <Plus className="size-4" /> Add question
              </button>
              <Link
                href="/api/admin/questions/template"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FileDown className="size-4" /> Template
              </Link>
              <button
                type="button"
                onClick={() => {
                  setImportOpen(true);
                  setImportFile(null);
                  setImportReport(null);
                  setError("");
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <FileSpreadsheet className="size-4" /> Import Excel
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bulk import questions"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !importBusy)
            setImportOpen(false);
        }}
        className={
          importOpen
            ? "fixed inset-0 z-[80] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
            : "hidden"
        }
      >
        <div className="mx-auto my-2 max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl sm:my-8">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#fbfbfa] px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">
                <FileSpreadsheet className="size-3.5" /> Controlled bulk import
              </div>
              <h3 className="mt-1.5 text-lg font-black text-slate-950">
                Import questions from Excel
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Existing and repeated external IDs are skipped automatically.
                No existing question will be overwritten.
              </p>
            </div>
            <button
              type="button"
              disabled={importBusy}
              onClick={() => setImportOpen(false)}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              aria-label="Close bulk import"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {!importReport && (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Workbook", ".xlsx · max 25 MB"],
                    ["Batch size", "Up to 500 rows"],
                    ["Images", "JPG/PNG · max 100"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#fdfdfc] px-6 py-7 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30">
                  <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Upload className="size-5" />
                  </span>
                  <span className="mt-3 text-sm font-black text-slate-900">
                    {importFile ? importFile.name : "Choose Excel workbook"}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    {importFile
                      ? (importFile.size / 1024 / 1024).toFixed(2) +
                        " MB · ready to validate"
                      : "Use the official template for reliable validation"}
                  </span>
                  <input
                    className="hidden"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    disabled={importBusy}
                    onChange={(event) =>
                      selectImportFile(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Duplicate matching is case-insensitive using{" "}
                    <strong>external_id</strong>. The first new row is imported;
                    later repetitions and existing database records are skipped.
                  </span>
                </div>
              </>
            )}

            {importReport && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ["Total", importReport.total, "text-slate-950"],
                    ["Imported", importReport.imported, "text-emerald-700"],
                    ["Skipped", importReport.skipped, "text-amber-700"],
                    ["Failed", importReport.failed, "text-rose-700"],
                  ].map(([label, value, tone]) => (
                    <div
                      key={String(label)}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <p className={"text-2xl font-black " + tone}>{value}</p>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[64px_minmax(110px,0.7fr)_100px_minmax(180px,1.3fr)] bg-slate-50 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      <span>Row</span>
                      <span>External ID</span>
                      <span>Status</span>
                      <span>Details</span>
                    </div>
                    <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                      {importReport.results.map((result) => (
                        <div
                          key={
                            String(result.row) +
                            "-" +
                            (result.externalId ?? "row")
                          }
                          className="grid grid-cols-[64px_minmax(110px,0.7fr)_100px_minmax(180px,1.3fr)] items-center px-3 py-2.5 text-xs"
                        >
                          <span className="font-bold text-slate-500">
                            {result.row}
                          </span>
                          <span className="truncate font-bold text-slate-800">
                            {result.externalId || "—"}
                          </span>
                          <span
                            className={
                              "inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-[9px] font-black uppercase " +
                              (result.status === "imported"
                                ? "bg-emerald-50 text-emerald-700"
                                : result.status === "skipped"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700")
                            }
                          >
                            {result.status === "imported" && (
                              <CheckCircle2 className="size-3" />
                            )}
                            {result.status}
                          </span>
                          <span className="text-slate-500">
                            {result.reason ||
                              result.error ||
                              "Imported successfully"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Link
              href="/api/admin/questions/template"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <FileDown className="size-4" /> Download template
            </Link>
            <div className="flex gap-2">
              {importReport && (
                <button
                  type="button"
                  onClick={() => {
                    setImportFile(null);
                    setImportReport(null);
                  }}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Import another
                </button>
              )}
              <button
                type="button"
                disabled={!importFile || importBusy || Boolean(importReport)}
                onClick={() => void importExcel()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#18184a] px-5 text-xs font-bold text-white hover:bg-[#25255f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importBusy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {importBusy ? "Validating and importing…" : "Start import"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {(error || notice) && (
        <div
          className={`mx-5 mt-5 flex items-center justify-between rounded-xl border p-3 text-sm sm:mx-7 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
        >
          <span>{error || notice}</span>
          <button
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className="bg-[#fdfdfc] p-5 sm:p-7">
        <div className="flex w-full border-b border-slate-200">
          {[
            {
              id: "bank" as const,
              label: "Question bank",
              count: questions.length,
            },
            { id: "tests" as const, label: "Mock tests", count: tests.length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`relative px-4 pb-3 text-xs font-bold transition sm:px-6 ${tab === item.id ? "text-brand-blue" : "text-slate-400 hover:text-slate-700"}`}
            >
              {item.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${tab === item.id ? "bg-blue-50 text-brand-blue" : "bg-slate-100 text-slate-500"}`}
              >
                {item.count}
              </span>
              {tab === item.id && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-blue" />
              )}
            </button>
          ))}
        </div>
        {tab === "bank" && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {(["PHYSICS", "CHEMISTRY", "BIOLOGY"] as const).map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  setSubjectFilter(subject);
                }}
                className={`group flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition ${subjectFilter === subject ? "border-blue-200 bg-blue-50 text-brand-blue shadow-xs" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                <span>
                  <span className="block text-xs font-black">
                    {subject[0] + subject.slice(1).toLowerCase()}
                  </span>
                  <span
                    className={`mt-0.5 block text-[9px] font-bold uppercase tracking-wider ${subjectFilter === subject ? "text-brand-blue" : "text-slate-400"}`}
                  >
                    Subject workspace
                  </span>
                </span>
                <span
                  className={`grid size-8 place-items-center rounded-lg text-xs font-black ${subjectFilter === subject ? "bg-white text-indigo-700 ring-1 ring-indigo-200" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"}`}
                >
                  {subjectCounts[subject]}
                </span>
              </button>
            ))}
          </div>
        )}
        {tab === "bank" ? (
          <div className="mt-5">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={editingId ? "Edit question" : "Add question"}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setEditorOpen(false);
              }}
              className={
                editorOpen
                  ? "fixed inset-0 z-[70] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
                  : "hidden"
              }
            >
              <div className="mx-auto my-2 max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl sm:my-6">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-7">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600">
                      Assessment editor
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">
                      {editingId
                        ? "Edit question"
                        : `Add ${subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} question`}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Close question editor"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="space-y-5 bg-slate-50/50 p-5 sm:p-7">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="External ID">
                      <input
                        value={draft.externalId}
                        readOnly={Boolean(editingId)}
                        onChange={(e) =>
                          setDraft({ ...draft, externalId: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Course">
                      <input value="NEET" readOnly />
                    </Field>
                    <Field label="Subject">
                      <input
                        value={
                          subjectFilter[0] +
                          subjectFilter.slice(1).toLowerCase()
                        }
                        readOnly
                      />
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Chapter (exact)">
                      <input
                        value={draft.chapterTitle}
                        onChange={(e) =>
                          setDraft({ ...draft, chapterTitle: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Type">
                      <select
                        value={draft.type}
                        onChange={(e) =>
                          setDraft({ ...draft, type: e.target.value })
                        }
                      >
                        <option>SINGLE_CORRECT</option>
                        <option>MULTIPLE_CORRECT</option>
                        <option>NUMERICAL</option>
                      </select>
                    </Field>
                    <Field label="Language">
                      <select
                        value={draft.language}
                        onChange={(e) =>
                          setDraft({ ...draft, language: e.target.value })
                        }
                      >
                        <option>BILINGUAL</option>
                        <option>ENGLISH</option>
                        <option>TAMIL</option>
                      </select>
                    </Field>
                    <Field label="Difficulty">
                      <select
                        value={draft.difficulty}
                        onChange={(e) =>
                          setDraft({ ...draft, difficulty: e.target.value })
                        }
                      >
                        <option>EASY</option>
                        <option>MEDIUM</option>
                        <option>HARD</option>
                      </select>
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Question — English">
                      <textarea
                        rows={3}
                        value={draft.textEn}
                        onChange={(e) =>
                          setDraft({ ...draft, textEn: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="கேள்வி — தமிழ்">
                      <textarea
                        rows={3}
                        value={draft.textTa}
                        onChange={(e) =>
                          setDraft({ ...draft, textTa: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <ImageField
                    label="Question diagram"
                    url={draft.questionImageUrl}
                    onUpload={(file) =>
                      uploadImage(file, (url) =>
                        setDraft((current) => ({
                          ...current,
                          questionImageUrl: url,
                        })),
                      )
                    }
                  />
                  {draft.type === "NUMERICAL" ? (
                    <Field label="Numerical answer">
                      <input
                        value={draft.numericalAnswer}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            numericalAnswer: e.target.value,
                          })
                        }
                      />
                    </Field>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Answer options
                      </div>
                      {draft.options.map((option, index) => (
                        <div
                          key={option.label}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center"
                        >
                          <button
                            type="button"
                            onClick={() => chooseCorrect(index)}
                            className={`grid size-10 shrink-0 place-items-center rounded-full border-2 font-extrabold ${option.isCorrect ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-slate-500"}`}
                          >
                            {option.isCorrect ? (
                              <Check className="size-4" />
                            ) : (
                              option.label
                            )}
                          </button>
                          <input
                            className="flex-1"
                            placeholder={`${option.label} English`}
                            value={option.textEn}
                            onChange={(e) =>
                              patchOption(index, { textEn: e.target.value })
                            }
                          />
                          <input
                            className="flex-1"
                            placeholder={`${option.label} தமிழ்`}
                            value={option.textTa}
                            onChange={(e) =>
                              patchOption(index, { textTa: e.target.value })
                            }
                          />
                          <label
                            className="grid shrink-0 cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 px-3 py-2 text-slate-500"
                            title="Option image"
                          >
                            <ImagePlus className="size-4" />
                            <input
                              className="hidden"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                void uploadImage(e.target.files[0], (url) =>
                                  patchOption(index, { imageUrl: url }),
                                )
                              }
                            />
                          </label>
                          {option.imageUrl && (
                            <img
                              src={option.imageUrl}
                              alt={`${option.label} option`}
                              className="max-h-24 rounded-lg object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Solution — English">
                      <textarea
                        rows={3}
                        value={draft.solutionEn}
                        onChange={(e) =>
                          setDraft({ ...draft, solutionEn: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="தீர்வு — தமிழ்">
                      <textarea
                        rows={3}
                        value={draft.solutionTa}
                        onChange={(e) =>
                          setDraft({ ...draft, solutionTa: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <ImageField
                    label="Solution image"
                    url={draft.solutionImageUrl}
                    onUpload={(file) =>
                      uploadImage(file, (url) =>
                        setDraft((current) => ({
                          ...current,
                          solutionImageUrl: url,
                        })),
                      )
                    }
                  />
                  <Field label="Source / reference">
                    <input
                      value={draft.source}
                      onChange={(e) =>
                        setDraft({ ...draft, source: e.target.value })
                      }
                      placeholder="NCERT / NEET 2025 / Institute module"
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void save()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 font-extrabold text-white shadow-primary transition hover:bg-brand-red-hover active:scale-95 disabled:opacity-60"
                  >
                    {busy ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : editingId ? (
                      <Pencil className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}{" "}
                    {editingId ? "Update question" : "Add question"} (+4 / −1)
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Content library
                  </p>
                  <h3 className="mt-1 text-sm font-black text-slate-950">
                    {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()}{" "}
                    questions
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {showingExamples && (
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                      Demo preview
                    </span>
                  )}
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                    {visible.length} records
                  </span>
                </div>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 size-4 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3"
                  placeholder={`Search ${subjectFilter.toLowerCase()} questions`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {busy && !questions.length ? (
                  <div className="grid h-48 place-items-center">
                    <LoaderCircle className="animate-spin" />
                  </div>
                ) : (
                  libraryQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      demo={showingExamples}
                      selected={
                        !showingExamples && selected.includes(question.id)
                      }
                      onSelect={
                        showingExamples
                          ? undefined
                          : () =>
                              setSelected((current) =>
                                current.includes(question.id)
                                  ? current.filter((id) => id !== question.id)
                                  : [...current, question.id],
                              )
                      }
                      onEdit={() =>
                        showingExamples
                          ? applyDemoQuestion(question)
                          : editQuestion(question)
                      }
                      onDelete={
                        showingExamples
                          ? undefined
                          : () => void deleteQuestion(question)
                      }
                    />
                  ))
                )}
                {!busy && !libraryQuestions.length && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                    No {subjectFilter.toLowerCase()} questions yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <MockTests
            tests={tests}
            selected={selected}
            onCreated={load}
            onError={setError}
            onNotice={setNotice}
          />
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-slate-700">
      {label}
      <span className="contents [&>input]:rounded-lg [&>input]:border [&>input]:border-slate-300 [&>input]:px-3 [&>input]:py-2.5 [&>select]:rounded-lg [&>select]:border [&>select]:border-slate-300 [&>select]:px-3 [&>select]:py-2.5 [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:px-3 [&>textarea]:py-2.5">
        {children}
      </span>
    </label>
  );
}
function ImageField({
  label,
  url,
  onUpload,
}: {
  label: string;
  url: string;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-indigo-700">
        <Upload className="size-4" /> {label} (JPG/PNG/WebP, max 5 MB)
        <input
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
      </label>
      {url && (
        <img
          src={url}
          alt={label}
          className="mt-3 max-h-48 rounded-lg object-contain"
        />
      )}
    </div>
  );
}
function QuestionCard({
  question,
  demo = false,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  question: Question;
  demo?: boolean;
  selected: boolean;
  onSelect?: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const correctAnswer =
    question.type === "NUMERICAL"
      ? question.numericalAnswer || "Not specified"
      : question.options
          .filter((option) => option.isCorrect)
          .map(
            (option) =>
              `${option.label}. ${option.textEn || option.textTa || "Image option"}`,
          )
          .join(", ");
  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-4 transition sm:p-5 ${selected ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200 hover:shadow-md"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-indigo-700">
            {question.externalId} · {question.courseSubject.subject.name}
          </div>
          {demo && (
            <span className="mt-2 inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
              Example content
            </span>
          )}
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {question.textEn || question.textTa || "Image question"}
          </p>
          {question.textEn && question.textTa && (
            <p className="mt-1 text-sm text-slate-600">{question.textTa}</p>
          )}
        </div>
        {!demo && onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${selected ? "border-brand-blue bg-brand-blue text-white shadow-xs" : "border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-brand-blue"}`}
          >
            {selected ? "Selected" : "Select"}
          </button>
        )}
      </div>
      {question.questionImageUrl && (
        <img
          src={question.questionImageUrl}
          alt="Question diagram"
          className="my-3 max-h-48 w-full rounded-lg object-contain"
        />
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.options.map((option) => (
          <div
            key={option.label}
            className={`rounded-xl border px-3 py-2.5 text-xs ${option.isCorrect ? "border-emerald-200 bg-emerald-50 font-bold text-emerald-800" : "border-slate-100 bg-slate-50 text-slate-600"}`}
          >
            {option.label}. {option.textEn || option.textTa || "Image option"}
            {option.imageUrl && (
              <img
                src={option.imageUrl}
                alt={`Option ${option.label}`}
                className="mt-2 max-h-20 object-contain"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Correct answer
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-emerald-950">
            {correctAnswer}
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-brand-blue">
            Worked solution
          </p>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-700">
            {question.solutionEn ||
              question.solutionTa ||
              "No worked solution has been added yet."}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2 text-2xs font-bold uppercase text-slate-500">
          <span>{question.type}</span>
          <span>{question.difficulty}</span>
          <span>
            +{question.correctMarks}/−{question.negativeMarks}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-2 text-[10px] font-bold text-brand-blue transition hover:bg-blue-50"
            title={demo ? "Use as a new question template" : "Edit question"}
          >
            <Pencil className="size-4" />
            {demo ? "Use template" : "Edit"}
          </button>
          {!demo && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
              title="Delete question"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
function MockTests({
  tests,
  selected,
  onCreated,
  onError,
  onNotice,
}: {
  tests: MockTest[];
  selected: string[];
  onCreated: () => Promise<void>;
  onError: (value: string) => void;
  onNotice: (value: string) => void;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const create = async () => {
    try {
      const test = await request<MockTest>("mock-tests", {
        method: "POST",
        body: JSON.stringify({
          code,
          title,
          durationMinutes: 180,
          totalMarks: 720,
        }),
      });
      if (selected.length)
        await request(`mock-tests/${test.id}/questions`, {
          method: "POST",
          body: JSON.stringify({
            questions: selected.map((questionId) => ({ questionId })),
          }),
        });
      setCode("");
      setTitle("");
      onNotice(`Mock test created with ${selected.length} selected questions.`);
      await onCreated();
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "Mock test creation failed",
      );
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
        <h3 className="font-extrabold text-slate-950">Build NEET mock test</h3>
        <p className="mt-1 text-xs text-slate-500">
          Select questions in Question Bank, then create a 180-minute / 720-mark
          draft.
        </p>
        <div className="mt-4 space-y-3">
          <Field label="Test code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="NEET-FULL-001"
            />
          </Field>
          <Field label="Test title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="NEET Full Syllabus Mock 01"
            />
          </Field>
          <div className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-brand-blue">
            {selected.length} questions selected
          </div>
          <button
            onClick={() => void create()}
            disabled={!code || !title}
            className="w-full rounded-xl bg-brand-red px-4 py-3 font-bold text-white shadow-primary transition hover:bg-brand-red-hover active:scale-95 disabled:opacity-40"
          >
            Create draft mock test
          </button>
        </div>
      </div>
      <div className="space-y-3 lg:col-span-2">
        {tests.map((test) => (
          <div
            key={test.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-indigo-700">
                  {test.code}
                </div>
                <h4 className="mt-1 font-extrabold text-slate-950">
                  {test.title}
                </h4>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                {test.status}
              </span>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span>{test._count.questions} questions</span>
              <span>{test.durationMinutes} min</span>
              <span>{test.totalMarks} marks</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
