"use client";

interface BilingualQuestionTextProps {
  textEn?: string | null;
  textTa?: string | null;
  enClassName?: string;
  taClassName?: string;
  className?: string;
}

export function BilingualQuestionText({
  textEn,
  textTa,
  enClassName = "text-sm font-medium leading-relaxed text-slate-900 whitespace-pre-wrap",
  taClassName = "font-tamil text-xs leading-relaxed text-slate-700 whitespace-pre-wrap",
  className = "space-y-1.5",
}: BilingualQuestionTextProps) {
  if (!textEn && !textTa) return null;

  return (
    <div className={className}>
      {textEn && <p className={enClassName}>{textEn}</p>}
      {textTa && <p className={taClassName}>{textTa}</p>}
    </div>
  );
}
