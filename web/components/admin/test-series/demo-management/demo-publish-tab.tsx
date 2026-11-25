"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  History,
  LoaderCircle,
  Play,
  Rocket,
  RotateCcw,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/components/question-bank/helpers";
import type { DemoTestConfiguration } from "@/components/demo-test/demo-test.types";
import type { DemoConfigVersion } from "./demo-admin.types";

interface Props {
  config: DemoTestConfiguration;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
  onReloadConfig: () => Promise<void>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  eligiblePoolCount: number;
}

export function DemoPublishTab({
  config,
  onNotice,
  onError,
  onReloadConfig,
}: Props) {
  const [versions, setVersions] = useState<DemoConfigVersion[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<{
    attemptId: string;
    questionCount: number;
    durationMinutes: number;
  } | null>(null);

  const loadVersions = useCallback(async () => {
    try {
      const list = await request<DemoConfigVersion[]>("demo-test/versions");
      setVersions(list);
    } catch {
      // ignore initial load error
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadVersions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadVersions]);

  const handleSaveDraft = async () => {
    setBusy("draft");
    try {
      await request("demo-test/draft", {
        method: "POST",
        body: JSON.stringify(config),
      });
      onNotice("Draft saved. Live public demo remains unchanged until published.");
      await onReloadConfig();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setBusy(null);
    }
  };

  const handleValidate = async () => {
    setBusy("validate");
    try {
      const res = await request<ValidationResult>("demo-test/validate", {
        method: "POST",
        body: JSON.stringify(config),
      });
      setValidation(res);
      if (res.valid) {
        onNotice("Validation passed! Configuration is ready to publish.");
      } else {
        onError(`Validation found ${res.errors.length} issue(s).`);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setBusy(null);
    }
  };

  const handlePublish = async () => {
    setBusy("publish");
    try {
      await request("demo-test/draft", {
        method: "POST",
        body: JSON.stringify(config),
      });
      await request("demo-test/publish", {
        method: "POST",
        body: JSON.stringify({ changeSummary: changeSummary.trim() || undefined }),
      });
      setChangeSummary("");
      onNotice("Demo configuration published to production!");
      await Promise.all([onReloadConfig(), loadVersions()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to publish demo");
    } finally {
      setBusy(null);
    }
  };

  const handleUnpublish = async () => {
    setBusy("unpublish");
    try {
      await request("demo-test/unpublish", { method: "POST" });
      onNotice("Demo test unpublished from public access.");
      await onReloadConfig();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to unpublish");
    } finally {
      setBusy(null);
    }
  };

  const handlePreview = async () => {
    setBusy("preview");
    try {
      const res = await request<{
        attemptId: string;
        questionCount: number;
        durationMinutes: number;
      }>("demo-test/preview", {
        method: "POST",
        body: JSON.stringify({
          subject: config.defaultSubject,
          language: config.defaultLanguage,
          questionCount: config.defaultQuestionCount,
        }),
      });
      setPreviewInfo(res);
      onNotice(
        `Isolated preview paper generated (${res.questionCount} Qs, ${res.durationMinutes} mins) — does not affect production analytics.`,
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setBusy(null);
    }
  };

  const handleRollback = async (versionId: string, versionNumber: number) => {
    setBusy(`rollback-${versionId}`);
    try {
      await request(`demo-test/versions/${versionId}/rollback`, {
        method: "POST",
      });
      onNotice(`Rolled back and published version v${versionNumber}.`);
      await Promise.all([onReloadConfig(), loadVersions()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Rollback failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Workflow Actions */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Draft, Validate, Preview &amp; Publish
              </h4>
              <Badge
                variant="outline"
                className={
                  config.publishStatus === "PUBLISHED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {config.publishStatus ?? "PUBLISHED"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Active student attempts continue using their original version snapshot even after you publish a new version.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => void handleSaveDraft()}
              className="gap-1.5 rounded-full text-xs"
            >
              {busy === "draft" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => void handleValidate()}
              className="gap-1.5 rounded-full text-xs"
            >
              {busy === "validate" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              Validate Configuration
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => void handlePreview()}
              className="gap-1.5 rounded-full text-xs"
            >
              {busy === "preview" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Test Preview Generation
            </Button>
            {config.publishStatus === "PUBLISHED" && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => void handleUnpublish()}
                className="gap-1.5 rounded-full text-xs text-rose-700 hover:bg-rose-50"
              >
                Unpublish
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <Input
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="Optional release note (e.g. Updated Biology weightage & added 20 questions)..."
            className="h-9 flex-1 rounded-xl border-slate-300 text-xs"
          />
          <Button
            disabled={busy !== null}
            onClick={() => void handlePublish()}
            className="gap-2 rounded-full bg-brand-red text-xs font-bold text-white hover:bg-brand-red-hover"
          >
            {busy === "publish" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Rocket className="size-4" />
            )}
            Publish Demo
          </Button>
        </div>

        {previewInfo && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
            <Eye className="size-4 text-indigo-600" />
            <span>
              Preview Attempt <code className="font-mono">{previewInfo.attemptId}</code>{" "}
              generated successfully ({previewInfo.questionCount} questions,{" "}
              {previewInfo.durationMinutes} minutes).
            </span>
          </div>
        )}

        {validation && (
          <div
            className={`space-y-2 rounded-xl border p-4 text-xs ${validation.valid ? "border-emerald-200 bg-emerald-50/70" : "border-rose-200 bg-rose-50/70"}`}
          >
            <div className="flex items-center gap-2 font-bold">
              {validation.valid ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="text-emerald-900">
                    Validation Passed ({validation.eligiblePoolCount} eligible questions)
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-rose-600" />
                  <span className="text-rose-900">
                    Validation Failed ({validation.errors.length} error(s))
                  </span>
                </>
              )}
            </div>
            {validation.errors.length > 0 && (
              <ul className="list-inside list-disc space-y-1 text-rose-800">
                {validation.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {validation.warnings.length > 0 && (
              <ul className="list-inside list-disc space-y-1 text-amber-800">
                {validation.warnings.map((w, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <AlertTriangle className="inline size-3.5 shrink-0 text-amber-600" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Version History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <History className="size-4 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-900">
            Published Version History &amp; Rollback
          </h4>
        </div>

        <div className="mt-4 space-y-2">
          {versions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No published versions recorded yet. Click &ldquo;Publish Demo&rdquo; to create v1.
            </p>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      v{v.versionNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        v.status === "PUBLISHED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-500"
                      }
                    >
                      {v.status}
                    </Badge>
                    <span className="text-xs text-slate-600">
                      {v.changeSummary || "Configuration snapshot"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-3xs text-slate-400">
                    {new Date(v.createdAt).toLocaleString()}
                  </p>
                </div>
                {v.status !== "PUBLISHED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => void handleRollback(v.id, v.versionNumber)}
                    className="gap-1.5 rounded-full text-xs"
                  >
                    <RotateCcw className="size-3.5" /> Rollback to v{v.versionNumber}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
