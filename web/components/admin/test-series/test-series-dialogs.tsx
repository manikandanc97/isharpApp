"use client";

import { Suspense, lazy, type RefObject } from "react";
import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EditorMode, LiveTestEditorHandle } from "./live-test-editor";
import type {
  CategoryTestItem,
  ExamPatternConfigResponse,
  TestSeriesCategory,
} from "./types";

const LiveTestEditor = lazy(() =>
  import("./live-test-editor").then((m) => ({ default: m.LiveTestEditor })),
);

const TestPreviewDialog = dynamic(
  () => import("./test-preview-dialog").then((m) => m.TestPreviewDialog),
  { ssr: false },
);

interface TestSeriesDialogsProps {
  editorRef: RefObject<LiveTestEditorHandle | null>;
  editorMode: EditorMode;
  selectedTest: CategoryTestItem | null;
  categories: TestSeriesCategory[];
  selectedCategoryId: string | null;
  examConfig: ExamPatternConfigResponse | null;
  previewTestId: string | null;
  pendingAction: (() => void) | null;
  onDirtyChange: (dirty: boolean) => void;
  onCloseEditor: () => void;
  onGuardUnsaved: (action: () => void) => void;
  onCreateTestClick: () => void;
  onSaved: (message: string) => Promise<void>;
  onError: (msg: string) => void;
  onClosePreview: () => void;
  onClearPendingAction: () => void;
}

export function TestSeriesDialogs({
  editorRef,
  editorMode,
  selectedTest,
  categories,
  selectedCategoryId,
  examConfig,
  previewTestId,
  pendingAction,
  onDirtyChange,
  onCloseEditor,
  onGuardUnsaved,
  onCreateTestClick,
  onSaved,
  onError,
  onClosePreview,
  onClearPendingAction,
}: TestSeriesDialogsProps) {
  return (
    <>
      <Dialog
        open={editorMode !== "empty"}
        onOpenChange={(open) => {
          if (!open) onGuardUnsaved(onCloseEditor);
        }}
      >
        <DialogContent className="flex h-[min(85vh,720px)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogTitle className="sr-only">
            {editorMode === "create" ? "Create Test" : "Edit Test"}
          </DialogTitle>
          {editorMode !== "empty" && (
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center p-8 text-xs text-slate-500">
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Loading test editor...
                </div>
              }
            >
              <LiveTestEditor
                ref={editorRef}
                inDialog
                mode={editorMode}
                selectedTest={selectedTest}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                examConfig={examConfig}
                onDirtyChange={onDirtyChange}
                onCancelCreate={onCloseEditor}
                onClose={() => onGuardUnsaved(onCloseEditor)}
                onCreateTestClick={onCreateTestClick}
                onSaved={async (_savedId, _wasCreate, message) => {
                  await onSaved(message);
                }}
                onError={onError}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>

      {Boolean(previewTestId) && (
        <TestPreviewDialog testId={previewTestId} onClose={onClosePreview} />
      )}

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && onClearPendingAction()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in the test editor. Would you like to
              save them before continuing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClearPendingAction}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                const action = pendingAction;
                editorRef.current?.discard();
                onDirtyChange(false);
                onClearPendingAction();
                action?.();
              }}
            >
              Discard Changes
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const ok = await editorRef.current?.save();
                if (ok) {
                  const action = pendingAction;
                  onClearPendingAction();
                  action?.();
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
