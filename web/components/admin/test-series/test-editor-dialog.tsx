"use client";

import { useEffect, useState } from "react";
import { Check, Clock, FileQuestion, HelpCircle, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { IndividualTest, IndividualTestStatus, TestType } from "./types";

interface TestEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesName: string;
  initialData?: IndividualTest | null;
  onSave: (data: Partial<IndividualTest>) => Promise<void>;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function TestEditorDialog({
  open,
  onOpenChange,
  seriesName,
  initialData,
  onSave,
  onNotice,
  onError,
}: TestEditorDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [instructionsTa, setInstructionsTa] = useState("");
  const [testType, setTestType] = useState<TestType>("FULL_SYLLABUS");
  const [testDate, setTestDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("13:00");
  const [durationMinutes, setDurationMinutes] = useState("180");
  const [totalQuestions, setTotalQuestions] = useState("180");
  const [totalMarks, setTotalMarks] = useState("720");
  const [passingMarks, setPassingMarks] = useState("350");
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(true);
  const [showResultsImmediately, setShowResultsImmediately] = useState(false);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(true);
  const [status, setStatus] = useState<IndividualTestStatus>("DRAFT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || initialData.title || "");
      setCode(initialData.code || "");
      setDescription(initialData.description || "");
      setInstructions(initialData.instructions || "");
      setInstructionsTa(initialData.instructionsTa || "");
      setTestType(initialData.testType || "FULL_SYLLABUS");
      setTestDate(initialData.testDate || (initialData.scheduledAt ? initialData.scheduledAt.split("T")[0] : ""));
      setStartTime(initialData.startTime || "10:00");
      setEndTime(initialData.endTime || "13:00");
      setDurationMinutes(String(initialData.durationMinutes || 180));
      setTotalQuestions(String(initialData.totalQuestions || 180));
      setTotalMarks(String(initialData.totalMarks || 720));
      setPassingMarks(initialData.passingMarks ? String(initialData.passingMarks) : "");
      setNegativeMarking(initialData.negativeMarking !== false);
      setMaxAttempts(String(initialData.maxAttempts || 1));
      setRandomizeQuestions(initialData.randomizeQuestions !== false);
      setRandomizeOptions(initialData.randomizeOptions !== false);
      setShowResultsImmediately(Boolean(initialData.showResultsImmediately));
      setIsOfflineAvailable(initialData.isOfflineAvailable !== false);
      setStatus(initialData.status || "DRAFT");
    } else {
      setName("");
      setCode(`NEET-${Date.now().toString().slice(-4)}`);
      setDescription("");
      setInstructions("+4 Marks for each correct attempt. -1 Mark deducted for each incorrect answer.");
      setInstructionsTa("சரியான பதிலுக்கு +4 மதிப்பெண்கள், தவறான பதிலுக்கு -1 கழித்தல்.");
      setTestType("FULL_SYLLABUS");
      setTestDate("");
      setStartTime("10:00");
      setEndTime("13:00");
      setDurationMinutes("180");
      setTotalQuestions("180");
      setTotalMarks("720");
      setPassingMarks("350");
      setNegativeMarking(true);
      setMaxAttempts("1");
      setRandomizeQuestions(true);
      setRandomizeOptions(true);
      setShowResultsImmediately(false);
      setIsOfflineAvailable(true);
      setStatus("DRAFT");
    }
  }, [initialData, open]);

  const handleTestTypeChange = (newType: TestType) => {
    setTestType(newType);
    if (!initialData) {
      if (newType === "FULL_SYLLABUS" || newType === "GRAND_TEST") {
        setDurationMinutes("180");
        setTotalQuestions("180");
        setTotalMarks("720");
        setPassingMarks("350");
      } else if (newType === "SUBJECT_WISE") {
        setDurationMinutes("60");
        setTotalQuestions("45");
        setTotalMarks("180");
        setPassingMarks("90");
      } else if (newType === "CHAPTER_WISE") {
        setDurationMinutes("45");
        setTotalQuestions("30");
        setTotalMarks("120");
        setPassingMarks("60");
      } else if (newType === "UNIT_TEST" || newType === "PART_TEST") {
        setDurationMinutes("90");
        setTotalQuestions("60");
        setTotalMarks("240");
        setPassingMarks("120");
      } else {
        setDurationMinutes("90");
        setTotalQuestions("60");
        setTotalMarks("240");
        setPassingMarks("120");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onError("Please enter a Test Name");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        instructionsTa: instructionsTa.trim() || null,
        testType,
        testDate: testDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        durationMinutes: Number(durationMinutes) || 180,
        totalQuestions: Number(totalQuestions) || 180,
        totalMarks: Number(totalMarks) || 720,
        passingMarks: passingMarks ? Number(passingMarks) : null,
        negativeMarking,
        maxAttempts: Number(maxAttempts) || 1,
        randomizeQuestions,
        randomizeOptions,
        showResultsImmediately,
        isOfflineAvailable,
        status,
      });
      onNotice(initialData ? "Test updated successfully" : "New test added to series");
      onOpenChange(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save test");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-brand-blue">
              <FileQuestion className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? "Edit Assessment Paper" : "Add Test to Series"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Series: <span className="font-semibold text-slate-700">{seriesName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Test Name *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Test 01 – Physics Chapter 1"
                  className="text-xs font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Test Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="NEET-11-PHY-01"
                  className="font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Assessment Type *</Label>
                <Select value={testType} onValueChange={(val) => handleTestTypeChange(val as TestType)}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Select Assessment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHAPTER_WISE">1. Chapter-wise Test (30 Qs / 120 M)</SelectItem>
                    <SelectItem value="SUBJECT_WISE">2. Subject-wise Test (45 Qs / 180 M)</SelectItem>
                    <SelectItem value="UNIT_TEST">3. Unit Test (60 Qs / 240 M)</SelectItem>
                    <SelectItem value="PART_TEST">4. Part Test (60 Qs / 240 M)</SelectItem>
                    <SelectItem value="REVISION_TEST">5. Revision Test (60 Qs / 240 M)</SelectItem>
                    <SelectItem value="FULL_SYLLABUS">6. Full Syllabus Mock Test (180 Qs / 720 M)</SelectItem>
                    <SelectItem value="GRAND_TEST">7. Grand Test / All India Mock (180 Qs / 720 M)</SelectItem>
                    <SelectItem value="CUSTOM_TEST">8. Custom Test (Configurable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as IndividualTestStatus)}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft (Hidden from students)</SelectItem>
                    <SelectItem value="PUBLISHED">Published (Available to students)</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled (Future timetable)</SelectItem>
                    <SelectItem value="COMPLETED">Completed (Archived test)</SelectItem>
                    <SelectItem value="ARCHIVED">Archived (Read-only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timetable & Schedule */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Test Date</Label>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Assessment Scoring & Configuration Matrix */}
            <div className="grid gap-3 sm:grid-cols-4">
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
                <Label className="text-xs font-semibold text-slate-700">Total Questions</Label>
                <Input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
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
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Passing Marks</Label>
                <Input
                  type="number"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value)}
                  placeholder="Optional"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Maximum Attempts</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="negMarking"
                  checked={negativeMarking}
                  onCheckedChange={(checked) => setNegativeMarking(Boolean(checked))}
                />
                <label htmlFor="negMarking" className="cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  Enable Negative Marking (-1 per incorrect MCQ)
                </label>
              </div>
            </div>

            {/* Randomization & Delivery Toggles */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-2.5">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                Integrity & Examination Delivery Options
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={randomizeQuestions}
                    onCheckedChange={(c) => setRandomizeQuestions(Boolean(c))}
                  />
                  <span>Server-side Question Randomization</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={randomizeOptions}
                    onCheckedChange={(c) => setRandomizeOptions(Boolean(c))}
                  />
                  <span>Option Shuffling (A/B/C/D)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showResultsImmediately}
                    onCheckedChange={(c) => setShowResultsImmediately(Boolean(c))}
                  />
                  <span>Show Results & Solutions Immediately</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={isOfflineAvailable}
                    onCheckedChange={(c) => setIsOfflineAvailable(Boolean(c))}
                  />
                  <span>Enable for Offline OMR / Print</span>
                </label>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Candidate Instructions (English)</Label>
              <Textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. +4 marks for correct, -1 for wrong. No penalty for unanswered."
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Candidate Instructions (தமிழ்)</Label>
              <Textarea
                rows={2}
                value={instructionsTa}
                onChange={(e) => setInstructionsTa(e.target.value)}
                placeholder="தேர்வு விதிகள்: சரியான பதிலுக்கு +4, தவறான பதிலுக்கு -1."
                className="text-xs resize-none"
              />
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
              {initialData ? "Save Test Details" : "Add Test to Series"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
