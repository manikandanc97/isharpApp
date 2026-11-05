/* eslint-disable @next/next/no-img-element */
"use client";

import { Check, ImagePlus } from "lucide-react";
import type { Draft } from "./types";

export function QuestionOptionsEditor({
  options,
  chooseCorrect,
  patchOption,
  uploadImage,
}: {
  options: Draft["options"];
  chooseCorrect: (index: number) => void;
  patchOption: (index: number, patch: Partial<Draft["options"][number]>) => void;
  uploadImage: (file: File, apply: (url: string) => void) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      <div className="type-label uppercase text-slate-500">
        Answer options
      </div>
      {options.map((option, index) => (
        <div
          key={option.label}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center"
        >
          <button
            type="button"
            onClick={() => chooseCorrect(index)}
            className={`grid size-10 shrink-0 place-items-center rounded-full border-2 font-semibold ${
              option.isCorrect
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 text-slate-500"
            }`}
          >
            {option.isCorrect ? <Check className="size-4" /> : option.label}
          </button>
          <input
            className="flex-1"
            placeholder={`${option.label} English`}
            value={option.textEn}
            onChange={(e) => patchOption(index, { textEn: e.target.value })}
          />
          <input
            className="flex-1"
            placeholder={`${option.label} தமிழ்`}
            value={option.textTa}
            onChange={(e) => patchOption(index, { textTa: e.target.value })}
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
  );
}

