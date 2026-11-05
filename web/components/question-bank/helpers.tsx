"use client";

import { Upload } from "lucide-react";
import type { Question } from "./types";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export function shuffleQuestions(items: Question[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildBalancedAutoSelection(questions: Question[], requested: number) {
  const target = Math.min(Math.max(requested, 1), 200, questions.length);
  const subjectPlan = [
    { code: "PHYSICS", count: Math.floor(target * 0.25) },
    { code: "CHEMISTRY", count: Math.floor(target * 0.25) },
    { code: "BIOLOGY", count: target - Math.floor(target * 0.25) * 2 },
  ];
  const picked: Question[] = [];
  const pickedIds = new Set<string>();

  subjectPlan.forEach(({ code, count }) => {
    shuffleQuestions(
      questions.filter((question) => question.courseSubject.subject.code === code),
    )
      .slice(0, count)
      .forEach((question) => {
        picked.push(question);
        pickedIds.add(question.id);
      });
  });

  if (picked.length < target) {
    shuffleQuestions(
      questions.filter((question) => !pickedIds.has(question.id)),
    )
      .slice(0, target - picked.length)
      .forEach((question) => picked.push(question));
  }

  return picked.map((question) => question.id);
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
      {label}
      <span className="contents [&>input]:rounded-lg [&>input]:border [&>input]:border-slate-300 [&>input]:px-3 [&>input]:py-2.5 [&>select]:rounded-lg [&>select]:border [&>select]:border-slate-300 [&>select]:px-3 [&>select]:py-2.5 [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:px-3 [&>textarea]:py-2.5">
        {children}
      </span>
    </label>
  );
}

export function ImageField({
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
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-indigo-700">
        <Upload className="size-4" /> {label} (JPG/PNG/WebP, max 5 MB)
        <input
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
      </label>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          className="mt-3 max-h-48 rounded-lg object-contain"
        />
      )}
    </div>
  );
}

