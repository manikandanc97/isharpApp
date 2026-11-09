"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileQuestion,
  HelpCircle,
  Image as ImageIcon,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDifficultyTheme, getSubjectTheme } from "./student-helpers";
import type { LanguageMode, StudentPortalData } from "./student-types";

interface StudentDppTabProps {
  data: StudentPortalData;
  globalLanguage: LanguageMode;
  initialSubjectFilter?: string;
}

export function StudentDppTab({
  data,
  globalLanguage,
  initialSubjectFilter,
}: StudentDppTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubjectFilter ?? "ALL"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Local interactive states for student engagement
  const [practicedMap, setPracticedMap] = useState<Record<string, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [cardLangMap, setCardLangMap] = useState<Record<string, "en" | "ta" | "bilingual">>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Collect available subjects across courses
  const allSubjects = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();
    for (const course of data.courses) {
      for (const sub of course.subjects) {
        if (!seen.has(sub.name)) {
          seen.add(sub.name);
          list.push({ id: sub.id, name: sub.name });
        }
      }
    }
    return list;
  }, [data.courses]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return data.recentQuestions.filter((q) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesEn = q.textEn?.toLowerCase().includes(query) ?? false;
        const matchesTa = q.textTa?.toLowerCase().includes(query) ?? false;
        const matchesId = q.externalId.toLowerCase().includes(query);
        const matchesSub = q.subject.name.toLowerCase().includes(query);
        const matchesChap = q.chapter?.title.toLowerCase().includes(query) ?? false;
        if (!matchesEn && !matchesTa && !matchesId && !matchesSub && !matchesChap) {
          return false;
        }
      }

      // Subject Filter
      if (selectedSubject !== "ALL" && q.subject.name !== selectedSubject) {
        return false;
      }

      // Difficulty Filter
      if (selectedDifficulty !== "ALL" && q.difficulty !== selectedDifficulty) {
        return false;
      }

      // Type Filter
      if (selectedType !== "ALL" && q.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [data.recentQuestions, searchQuery, selectedSubject, selectedDifficulty, selectedType]);

  const practicedCount = Object.values(practicedMap).filter(Boolean).length;

  const togglePracticed = (id: string) => {
    setPracticedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSolution = (id: string) => {
    setExpandedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSubject("ALL");
    setSelectedDifficulty("ALL");
    setSelectedType("ALL");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedSubject !== "ALL" ||
    selectedDifficulty !== "ALL" ||
    selectedType !== "ALL";

  return (
    <div className="space-y-6">
      {/* Control Panel: Header & Filters */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-brand-red/10 px-2 py-0.5 text-xs font-bold text-brand-red">
                DPP BANK
              </span>
              <span className="text-xs text-slate-500">
                Daily Practice Problems & Exercises
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Practice Question Bank
            </h2>
          </div>

          {/* Practice Session Counter */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs">
              <span className="text-slate-400">SESSION SOLVED</span>
              <p className="font-bold text-emerald-600">
                {practicedCount} / {data.recentQuestions.length} Done
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, question ID (e.g. #Q-001) or chapter..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Subject Select */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-medium text-slate-500">Subject:</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-brand-red focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Subjects</option>
                  {allSubjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Select */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-medium text-slate-500">Difficulty:</span>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                  {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`rounded-lg px-2.5 py-1 text-3xs font-bold transition ${
                        selectedDifficulty === diff
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {diff === "ALL" ? "All" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Type Select */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                <span className="font-medium text-slate-500">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="SINGLE_CORRECT">Single Correct</option>
                  <option value="MULTIPLE_CORRECT">Multiple Correct</option>
                  <option value="NUMERICAL">Numerical</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <RotateCcw className="mr-1 size-3" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>
          Showing {filteredQuestions.length} of {data.recentQuestions.length} Questions
        </span>
        <span className="text-3xs uppercase tracking-wider text-slate-400">
          NEET / JEE Pattern
        </span>
      </div>

      {/* Questions List */}
      {filteredQuestions.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredQuestions.map((question) => {
            const subjectTheme = getSubjectTheme(question.subject.name);
            const diffTheme = getDifficultyTheme(question.difficulty);
            const isPracticed = !!practicedMap[question.id];
            const isBookmarked = !!bookmarkedMap[question.id];
            const isSolutionOpen = !!expandedSolutions[question.id];

            // Card language preference overrides or falls back to globalLanguage
            const activeCardLang = cardLangMap[question.id] || globalLanguage;
            const primaryText =
              activeCardLang === "ta"
                ? question.textTa
                : activeCardLang === "en"
                  ? question.textEn
                  : question.textEn ?? question.textTa;
            const secondaryText = activeCardLang === "bilingual" ? question.textTa : null;

            return (
              <article
                key={question.id}
                className={`flex flex-col justify-between rounded-3xl border transition-all duration-200 p-5 shadow-2xs ${
                  isPracticed
                    ? "border-emerald-200/90 bg-emerald-50/15"
                    : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-card"
                }`}
              >
                <div>
                  {/* Card Header Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${subjectTheme.badgeBg}`}
                      >
                        {question.subject.name}
                      </span>
                      <span
                        className={`rounded-lg border px-2 py-0.5 text-3xs font-semibold uppercase ${diffTheme.badge}`}
                      >
                        {diffTheme.label}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-3xs font-medium text-slate-600">
                        {question.type.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleCopyId(question.externalId)}
                        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-3xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Copy Question Code"
                      >
                        <span>{question.externalId}</span>
                        {copiedId === question.externalId ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(question.id)}
                        className={`rounded-full p-1 transition ${
                          isBookmarked
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                        title="Bookmark for revision"
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="size-4 fill-amber-400" />
                        ) : (
                          <Bookmark className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Context Breadcrumb */}
                  <div className="mt-2.5 text-3xs text-slate-400 font-medium">
                    <span>{question.course.title}</span>
                    {question.chapter && (
                      <span> • <strong className="text-slate-600">{question.chapter.title}</strong></span>
                    )}
                  </div>

                  {/* Question Content */}
                  <div className="mt-3.5 space-y-2">
                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-900">
                      {primaryText ?? "Question text is not available in the selected language."}
                    </p>

                    {secondaryText && secondaryText !== primaryText && (
                      <p className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-600">
                        {secondaryText}
                      </p>
                    )}

                    {/* Question Image if present */}
                    {question.questionImageUrl && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                        <div className="flex items-center gap-1.5 text-3xs text-slate-500 mb-1">
                          <ImageIcon className="size-3" />
                          <span>Question Diagram</span>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={question.questionImageUrl}
                          alt={`Diagram for ${question.externalId}`}
                          className="max-h-60 w-auto rounded-lg object-contain mx-auto"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Toolbar: Language Switcher & Practice Toggles */}
                <div className="mt-5 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Per-card language selector */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-3xs">
                      {(["bilingual", "en", "ta"] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setCardLangMap((prev) => ({ ...prev, [question.id]: l }))}
                          className={`rounded px-1.5 py-0.5 font-bold uppercase transition ${
                            activeCardLang === l
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-400 hover:text-slate-700"
                          }`}
                        >
                          {l === "bilingual" ? "EN+தமிழ்" : l}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleSolution(question.id)}
                        className="h-8 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <HelpCircle className="mr-1 size-3.5 text-indigo-600" />
                        <span>Guide</span>
                        {isSolutionOpen ? (
                          <ChevronUp className="ml-1 size-3" />
                        ) : (
                          <ChevronDown className="ml-1 size-3" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => togglePracticed(question.id)}
                        className={`h-8 rounded-full text-xs font-semibold transition ${
                          isPracticed
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <CheckCircle2 className={`mr-1 size-3.5 ${isPracticed ? "text-white" : "text-slate-400"}`} />
                        <span>{isPracticed ? "Practiced" : "Mark Done"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Solution / Formula Notes */}
                  {isSolutionOpen && (
                    <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950">
                      <div className="flex items-center gap-1.5 font-semibold text-brand-blue mb-1">
                        <Sparkles className="size-3.5" />
                        <span>Concept & Formula Hint</span>
                      </div>
                      <p className="leading-relaxed text-indigo-900 text-3xs sm:text-xs">
                        Review the core concept in {question.chapter?.title ?? question.subject.name}. Identify given parameters, write down the formula, check SI unit consistency, and eliminate improbable options first.
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileQuestion className="mx-auto size-10 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            No questions match your current filters
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, selected subject, or difficulty level to see more practice problems.
          </p>
          <Button
            onClick={resetFilters}
            className="mt-4 rounded-full bg-brand-red text-xs font-semibold text-white hover:bg-brand-red-hover"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
