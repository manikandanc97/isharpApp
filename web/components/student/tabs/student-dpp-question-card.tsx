import {
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDisplayQuestionId } from "@/lib/question-format";
import { getDifficultyTheme, getSubjectTheme } from "../student-helpers";
import type { LanguageMode, StudentPortalData } from "../student-types";

export type CardLanguage = "en" | "ta" | "bilingual";

export interface StudentDppQuestionCardProps {
  question: StudentPortalData["recentQuestions"][number];
  globalLanguage: LanguageMode;
  isPracticed: boolean;
  isBookmarked: boolean;
  isSolutionOpen: boolean;
  cardLang?: CardLanguage;
  isCopied: boolean;
  onTogglePracticed: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onToggleSolution: (id: string) => void;
  onCardLangChange: (id: string, lang: CardLanguage) => void;
  onCopyId: (id: string) => void;
}

const CARD_LANGUAGES: CardLanguage[] = ["bilingual", "en", "ta"];

export function StudentDppQuestionCard({
  question,
  globalLanguage,
  isPracticed,
  isBookmarked,
  isSolutionOpen,
  cardLang,
  isCopied,
  onTogglePracticed,
  onToggleBookmark,
  onToggleSolution,
  onCardLangChange,
  onCopyId,
}: StudentDppQuestionCardProps) {
  const subjectTheme = getSubjectTheme(question.subject.name);
  const diffTheme = getDifficultyTheme(question.difficulty);

  const activeCardLang = cardLang || globalLanguage;
  const primaryText =
    activeCardLang === "ta"
      ? question.textTa
      : activeCardLang === "en"
        ? question.textEn
        : question.textTa ?? question.textEn;
  const secondaryText = activeCardLang === "bilingual" ? question.textEn : null;

  return (
    <article
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
              onClick={() => onCopyId(question.externalId)}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-3xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              title="Copy Question Code"
            >
              <span>{formatDisplayQuestionId(question.externalId)}</span>
              {isCopied ? (
                <Check className="size-3 text-emerald-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onToggleBookmark(question.id)}
              className={`rounded-full p-1 transition cursor-pointer ${
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
            {CARD_LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onCardLangChange(question.id, l)}
                className={`rounded px-1.5 py-0.5 font-bold uppercase transition cursor-pointer ${
                  activeCardLang === l
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {l === "bilingual" ? "தமிழ்+EN" : l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleSolution(question.id)}
              className="h-8 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
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
              onClick={() => onTogglePracticed(question.id)}
              className={`h-8 rounded-full text-xs font-semibold transition cursor-pointer ${
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
}
