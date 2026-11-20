"use client";

import { useEffect, useState } from "react";
import { Award, Calendar, Check, Clock, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TestSeries, TestSeriesCategory, TestSeriesStatus } from "./types";

interface TestSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TestSeriesCategory[];
  initialData?: TestSeries | null;
  onSave: (data: Partial<TestSeries>) => Promise<void>;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function TestSeriesDialog({
  open,
  onOpenChange,
  categories,
  initialData,
  onSave,
  onNotice,
  onError,
}: TestSeriesDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [coverImage, setCoverImage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("720");
  const [durationMinutes, setDurationMinutes] = useState("180");
  const [status, setStatus] = useState<TestSeriesStatus>("DRAFT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setCategoryId(initialData.categoryId || (categories[0]?.id || ""));
      setAcademicYear(initialData.academicYear || "2026-2027");
      setCoverImage(initialData.coverImage || "");
      setStartDate(initialData.startDate ? initialData.startDate.substring(0, 10) : "");
      setEndDate(initialData.endDate ? initialData.endDate.substring(0, 10) : "");
      setTotalMarks(String(initialData.totalMarks || 720));
      setDurationMinutes(String(initialData.durationMinutes || 180));
      setStatus(initialData.status || "DRAFT");
    } else {
      setName("");
      setDescription("");
      setCategoryId(categories[0]?.id || "");
      setAcademicYear("2026-2027");
      setCoverImage("");
      setStartDate("");
      setEndDate("");
      setTotalMarks("720");
      setDurationMinutes("180");
      setStatus("DRAFT");
    }
  }, [initialData, categories, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onError("Please enter a Test Series Name");
      return;
    }
    if (!categoryId) {
      onError("Please select a Category");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        categoryId,
        academicYear,
        coverImage: coverImage.trim() || null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        totalMarks: Number(totalMarks) || 720,
        durationMinutes: Number(durationMinutes) || 180,
        status,
      });
      onNotice(initialData ? "Test series updated successfully" : "Test series created successfully");
      onOpenChange(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save test series");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-rose-50 text-brand-red">
              <Layers className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? "Edit Test Series" : "Create New Test Series"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Define high-yield test packages across Class 11, Class 12, or Repeater streams.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Test Series Name *</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. NEET 2026 Class 11 Comprehensive Test Series"
                className="text-xs font-medium"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Category *</Label>
                <Select value={categoryId} onValueChange={(val) => { if (val) setCategoryId(val); }}>
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue placeholder="Select Category">
                      {selectedCategory ? `${selectedCategory.name}${selectedCategory.isActive ? "" : " (Inactive)"}` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} label={`${c.name}${c.isActive ? "" : " (Inactive)"}`} className="text-xs">
                        {c.name} {!c.isActive && "(Inactive)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Academic Year</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026-2027"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Description</Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide an overview of syllabus coverage, milestone goals, and test frequency..."
                className="text-xs resize-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Duration (Mins)</Label>
                <Input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Total Marks</Label>
                <Input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Status</Label>
                <Select value={status} onValueChange={(val) => { if (val) setStatus(val as TestSeriesStatus); }}>
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue placeholder="Select Status">
                      {status === "PUBLISHED" ? "Published (Available to students)" : status === "ARCHIVED" ? "Archived (Read-only historical)" : "Draft (Hidden from students)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT" label="Draft (Hidden from students)" className="text-xs">Draft (Hidden from students)</SelectItem>
                    <SelectItem value="PUBLISHED" label="Published (Available to students)" className="text-xs">Published (Available to students)</SelectItem>
                    <SelectItem value="ARCHIVED" label="Archived (Read-only historical)" className="text-xs">Archived (Read-only historical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Cover Image URL (Optional)</Label>
                <Input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="/experience/neet-hero.jpg"
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 size-3.5" />
              )}
              {initialData ? "Save Changes" : "Create Test Series"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
