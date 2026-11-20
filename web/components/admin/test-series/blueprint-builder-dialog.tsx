"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Check,
  FileQuestion,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IndividualTest, TestBlueprintItem } from "./types";

interface BlueprintBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: IndividualTest;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

const DEFAULT_NEET_BLUEPRINT: TestBlueprintItem[] = [
  {
    subjectCode: "PHY",
    subjectName: "Physics",
    sectionName: "Section A",
    totalQuestions: 45,
    mandatoryCount: 45,
    correctMarks: 4,
    negativeMarks: 1,
    orderIndex: 1,
  },
  {
    subjectCode: "CHE",
    subjectName: "Chemistry",
    sectionName: "Section A",
    totalQuestions: 45,
    mandatoryCount: 45,
    correctMarks: 4,
    negativeMarks: 1,
    orderIndex: 2,
  },
  {
    subjectCode: "BIO",
    subjectName: "Biology",
    sectionName: "Section A",
    totalQuestions: 90,
    mandatoryCount: 90,
    correctMarks: 4,
    negativeMarks: 1,
    orderIndex: 3,
  },
];

export function BlueprintBuilderDialog({
  open,
  onOpenChange,
  test,
  onNotice,
  onError,
}: BlueprintBuilderDialogProps) {
  const [blueprints, setBlueprints] = useState<TestBlueprintItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function loadTestDetails() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/test-series/${test.testSeriesId}/tests/${test.id}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.blueprints && data.blueprints.length > 0) {
            setBlueprints(data.blueprints);
            return;
          }
        }
        // If no blueprints, default to standard NEET blueprint
        setBlueprints(DEFAULT_NEET_BLUEPRINT);
      } catch {
        setBlueprints(DEFAULT_NEET_BLUEPRINT);
      } finally {
        setLoading(false);
      }
    }
    void loadTestDetails();
  }, [open, test]);

  const handleApplyPreset = (preset: "NEET_180" | "NEET_200") => {
    if (preset === "NEET_180") {
      setBlueprints(DEFAULT_NEET_BLUEPRINT);
    } else {
      setBlueprints([
        {
          subjectCode: "PHY",
          subjectName: "Physics",
          sectionName: "Section A",
          totalQuestions: 35,
          mandatoryCount: 35,
          correctMarks: 4,
          negativeMarks: 1,
          orderIndex: 1,
        },
        {
          subjectCode: "PHY",
          subjectName: "Physics",
          sectionName: "Section B",
          totalQuestions: 15,
          mandatoryCount: 10,
          correctMarks: 4,
          negativeMarks: 1,
          orderIndex: 2,
        },
        {
          subjectCode: "CHE",
          subjectName: "Chemistry",
          sectionName: "Section A",
          totalQuestions: 35,
          mandatoryCount: 35,
          correctMarks: 4,
          negativeMarks: 1,
          orderIndex: 3,
        },
        {
          subjectCode: "CHE",
          subjectName: "Chemistry",
          sectionName: "Section B",
          totalQuestions: 15,
          mandatoryCount: 10,
          correctMarks: 4,
          negativeMarks: 1,
          orderIndex: 4,
        },
        {
          subjectCode: "BIO",
          subjectName: "Biology",
          sectionName: "Section A",
          totalQuestions: 70,
          mandatoryCount: 70,
          correctMarks: 4,
          negativeMarks: 1,
          orderIndex: 5,
        },
        {
          subjectCode: "BIO",
          subjectName: "Biology",
          sectionName: "Section B",
          totalQuestions: 30,
          mandatoryCount: 20,
          correctMarks: 4,
          negativeMarks: 1,
          orderIndex: 6,
        },
      ]);
    }
    onNotice("Applied blueprint preset configuration");
  };

  const handleAddRow = () => {
    setBlueprints((prev) => [
      ...prev,
      {
        subjectCode: "PHY",
        subjectName: "Physics",
        sectionName: `Section ${String.fromCharCode(65 + (prev.length % 4))}`,
        totalQuestions: 45,
        mandatoryCount: 45,
        correctMarks: 4,
        negativeMarks: 1,
        orderIndex: prev.length + 1,
      },
    ]);
  };

  const handleUpdateRow = (index: number, updates: Partial<TestBlueprintItem>) => {
    setBlueprints((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleDeleteRow = (index: number) => {
    setBlueprints((prev) => prev.filter((_, i) => i !== index));
  };

  // Live calculations
  const totalPaperQuestions = blueprints.reduce((sum, b) => sum + (Number(b.totalQuestions) || 0), 0);
  const totalAttemptQuestions = blueprints.reduce((sum, b) => sum + (Number(b.mandatoryCount) || 0), 0);
  const totalMaxMarks = blueprints.reduce(
    (sum, b) => sum + (Number(b.mandatoryCount) || 0) * (Number(b.correctMarks) || 4),
    0
  );

  const handleSave = async () => {
    if (blueprints.length === 0) {
      onError("Please configure at least one subject section in the blueprint");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/admin/test-series/${test.testSeriesId}/tests/${test.id}/blueprint`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blueprints: blueprints.map((b, i) => ({
              subjectCode: b.subjectCode.toUpperCase(),
              subjectName: b.subjectName,
              chapterId: b.chapterId || undefined,
              sectionName: b.sectionName || `Section ${i + 1}`,
              totalQuestions: Number(b.totalQuestions) || 45,
              mandatoryCount: Number(b.mandatoryCount) || Number(b.totalQuestions) || 45,
              correctMarks: Number(b.correctMarks) || 4,
              negativeMarks: Number(b.negativeMarks) || 1,
              orderIndex: i + 1,
            })),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save blueprint");
      }

      onNotice("Paper blueprint configuration saved successfully");
      onOpenChange(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save blueprint");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-700">
                <Layers className="size-4.5" />
              </span>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Question Paper Blueprint & Quota Engine
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Test: <span className="font-semibold text-slate-700">{test.name || test.title}</span> ({test.code})
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyPreset("NEET_180")}
                className="text-2xs font-semibold rounded-lg"
              >
                NEET 180 Qs (Phy 45, Chem 45, Bio 90)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyPreset("NEET_200")}
                className="text-2xs font-semibold rounded-lg"
              >
                NEET 200 Qs (Sec A+B)
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Live Calculation Banner */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 px-6 py-3 border-b border-slate-200/80 text-center">
          <div>
            <span className="text-3xs uppercase font-bold text-slate-500">Total Paper Questions</span>
            <p className="text-sm sm:text-base font-bold text-slate-900">{totalPaperQuestions} Qs</p>
          </div>
          <div>
            <span className="text-3xs uppercase font-bold text-slate-500">Attempt Quota</span>
            <p className="text-sm sm:text-base font-bold text-purple-700">{totalAttemptQuestions} Qs to Attempt</p>
          </div>
          <div>
            <span className="text-3xs uppercase font-bold text-slate-500">Maximum Marks</span>
            <p className="text-sm sm:text-base font-bold text-emerald-700">{totalMaxMarks} Marks</p>
          </div>
        </div>

        {/* Blueprint Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <RefreshCw className="size-4 animate-spin" />
              <span className="text-xs">Loading blueprint settings...</span>
            </div>
          ) : blueprints.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-slate-500">No blueprint items defined.</p>
              <Button size="sm" onClick={() => handleApplyPreset("NEET_180")}>
                Apply Default NEET Blueprint (180 Qs)
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {blueprints.map((b, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-3xs uppercase font-semibold text-slate-500">Subject</Label>
                    <Select
                      value={b.subjectCode || "PHY"}
                      onValueChange={(code) => {
                        if (!code) return;
                        const nameMap: Record<string, string> = {
                          PHY: "Physics",
                          CHE: "Chemistry",
                          BIO: "Biology",
                          GEN: "General",
                        };
                        handleUpdateRow(index, { subjectCode: code, subjectName: nameMap[code] || code });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold">
                        <SelectValue placeholder="Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHY" className="text-xs font-semibold">Physics (PHY)</SelectItem>
                        <SelectItem value="CHE" className="text-xs font-semibold">Chemistry (CHE)</SelectItem>
                        <SelectItem value="BIO" className="text-xs font-semibold">Biology (BIO)</SelectItem>
                        <SelectItem value="GEN" className="text-xs font-semibold">General / Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-3xs uppercase font-semibold text-slate-500">Section Name</Label>
                    <Input
                      value={b.sectionName || ""}
                      onChange={(e) => handleUpdateRow(index, { sectionName: e.target.value })}
                      placeholder="e.g. Section A"
                      className="h-8 text-xs font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-3xs uppercase font-semibold text-slate-500">Total Qs</Label>
                    <Input
                      type="number"
                      min={1}
                      value={b.totalQuestions}
                      onChange={(e) =>
                        handleUpdateRow(index, {
                          totalQuestions: Number(e.target.value) || 0,
                          // keep mandatory capped by total
                          mandatoryCount: Math.min(
                            Number(b.mandatoryCount) || 0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="h-8 text-xs font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-3xs uppercase font-semibold text-slate-500">To Attempt</Label>
                    <Input
                      type="number"
                      min={1}
                      max={b.totalQuestions}
                      value={b.mandatoryCount}
                      onChange={(e) => handleUpdateRow(index, { mandatoryCount: Number(e.target.value) || 0 })}
                      className="h-8 text-xs font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1">
                    <Label className="text-3xs uppercase font-semibold text-slate-500">+Marks</Label>
                    <Input
                      type="number"
                      value={b.correctMarks ?? 4}
                      onChange={(e) => handleUpdateRow(index, { correctMarks: Number(e.target.value) || 4 })}
                      className="h-8 text-xs font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRow(index)}
                      className="size-8 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="w-full rounded-xl border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-400"
              >
                <Plus className="mr-1.5 size-3.5" /> Add Section Quota
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving || blueprints.length === 0}
            onClick={() => void handleSave()}
            className="bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 size-3.5" />
            )}
            {isSaving ? "Saving Blueprint..." : "Save Blueprint Quota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
