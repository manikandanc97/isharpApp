"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EditorMode } from "../test-editor.types";

interface TestEditorFooterProps {
  mode: Exclude<EditorMode, "empty">;
  saving: boolean;
  isDirty: boolean;
  activationErrors: string[];
  onCancelCreate: () => void;
  onClose?: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function TestEditorFooter({
  mode,
  saving,
  isDirty,
  activationErrors,
  onCancelCreate,
  onClose,
  onDiscard,
  onSave,
}: TestEditorFooterProps) {
  return (
    <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
      {activationErrors.length > 0 && (
        <div className="mb-2 text-[11px] font-medium text-amber-700">
          {activationErrors[0]}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        {mode === "create" ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelCreate}
              disabled={saving}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || activationErrors.length > 0}
              onClick={onSave}
              className="h-8 gap-1.5 rounded-xl bg-brand-blue px-3.5 text-xs font-semibold text-white hover:bg-brand-blue/90"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Create Test
            </Button>
          </>
        ) : (
          <>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saving}
                className="h-8 rounded-xl text-xs"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isDirty || saving}
              onClick={onDiscard}
              className="h-8 rounded-xl text-xs"
            >
              Discard Changes
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!isDirty || saving || activationErrors.length > 0}
              onClick={onSave}
              className="h-8 gap-1.5 rounded-xl bg-brand-blue px-3.5 text-xs font-semibold text-white hover:bg-brand-blue/90"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save Changes
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
