"use client";

import { useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { LightField } from "./admin-helpers";
import { Stack } from "@/components/layout/layout-primitives";

export interface CourseCreateFormProps {
  onCreate: (data: {
    code: string;
    title: string;
    description: string;
  }) => Promise<void>;
  onSuccess: () => void;
}

export function CourseCreateForm({ onCreate, onSuccess }: CourseCreateFormProps) {
  const [form, setForm] = useState({ code: "", title: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onCreate(form);
      setForm({ code: "", title: "", description: "" });
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border-b border-slate-200 bg-[#fbfbfa] p-(--layout-card-padding)"
    >
      <Stack>
      <div className="flex items-start justify-between gap-4">
        <Stack gap="xs">
          <h3 className="type-card-title text-slate-950">
            Create curriculum record
          </h3>
          <p className="text-xs text-slate-500">
            Add the course identity first. Subjects and chapters can be
            managed after creation.
          </p>
        </Stack>
        <span className="hidden rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 sm:inline-flex">
          Required fields marked *
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <LightField
          className="lg:col-span-2"
          label="Course code *"
          value={form.code}
          onChange={(value) => setForm({ ...form, code: value })}
          placeholder="NEET-01"
        />
        <LightField
          className="lg:col-span-4"
          label="Course title *"
          value={form.title}
          onChange={(value) => setForm({ ...form, title: value })}
          placeholder="NEET Coaching Programme"
        />
        <LightField
          className="lg:col-span-4"
          label="Description"
          value={form.description}
          onChange={(value) => setForm({ ...form, description: value })}
          placeholder="Programme scope and learner outcome"
        />
        <div className="flex items-end lg:col-span-2">
          <button
            disabled={saving || !form.code.trim() || !form.title.trim()}
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-red font-semibold text-white shadow-primary transition hover:bg-brand-red-hover disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            <span>Create</span>
          </button>
        </div>
      </div>
      </Stack>
    </form>
  );
}

