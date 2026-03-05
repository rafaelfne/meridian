"use client";

import { useActionState, useState, useCallback, useTransition } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { InventoryUploadSchema } from "@/modules/inventory/validators/inventory-upload";
import {
  uploadInventoryAction,
  type UploadInventoryResult,
} from "@/modules/inventory/actions/upload";
import styles from "./UploadDropzone.module.css";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

const initialState: UploadInventoryResult = { success: false };

export function UploadDropzone({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [result, dispatch, isPending] = useActionState(
    uploadInventoryAction,
    initialState,
  );

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      const errors: string[] = [];

      for (const r of rejections) {
        for (const e of r.errors) {
          if (e.code === "file-too-large")
            errors.push(`${r.file.name}: File size exceeds 5MB limit`);
          else if (e.code === "file-invalid-type")
            errors.push(`${r.file.name}: Only .json files are accepted`);
          else errors.push(`${r.file.name}: ${e.message}`);
        }
      }

      // Validate each accepted file asynchronously
      const validFiles: File[] = [];

      const validationPromises = accepted.map(async (dropped) => {
        const text = await dropped.text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          errors.push(`${dropped.name}: Invalid JSON file`);
          return;
        }

        const validation = InventoryUploadSchema.safeParse(json);
        if (!validation.success) {
          for (const issue of validation.error.issues) {
            errors.push(
              `${dropped.name}: ${issue.path.join(".")}: ${issue.message}`,
            );
          }
          return;
        }

        validFiles.push(dropped);
      });

      void Promise.all(validationPromises).then(() => {
        setValidationErrors(errors.length > 0 ? errors : []);

        if (validFiles.length > 0) {
          setFiles((prev) => {
            const existingNames = new Set(prev.map((f) => f.name));
            const newFiles = validFiles.filter(
              (f) => !existingNames.has(f.name),
            );
            return [...prev, ...newFiles];
          });
        }
      });
    },
    [],
  );

  const removeFile = useCallback((name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }, []);

  const [, startTransition] = useTransition();

  const handleSubmit = useCallback(() => {
    if (files.length === 0) return;
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    formData.append("workspaceId", workspaceId);
    startTransition(() => dispatch(formData));
  }, [files, dispatch, startTransition, workspaceId]);

  const isDisabled = isPending || result.success;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    maxSize: MAX_FILE_SIZE,
    disabled: isDisabled,
    multiple: true,
  });

  const hasClientErrors = validationErrors.length > 0;
  const hasServerErrors =
    !result.success && result.errors != null && result.errors.length > 0;

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={clsx(
          styles.dropzone,
          isDragActive && styles.active,
          (hasClientErrors || hasServerErrors) && styles.error,
          isDisabled && styles.disabled,
        )}
      >
        <input {...getInputProps()} />
        {isPending ? (
          <>
            <Loader2 className="size-10 animate-spin" />
            <p className="font-medium">Uploading…</p>
          </>
        ) : (
          <>
            <Upload className="size-10" />
            <p className="font-medium">
              Drag &amp; drop JSON inventory files here, or click to browse
            </p>
            <p className="text-xs">Only .json files up to 5 MB each</p>
          </>
        )}
      </div>

      {files.length > 0 && !result.success && (
        <div className={styles.fileList}>
          {files.map((f) => (
            <div key={f.name} className={styles.fileItem}>
              <FileJson className="size-4 shrink-0" />
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>
                {(f.size / 1024).toFixed(1)} KB
              </span>
              {!isPending && (
                <button
                  type="button"
                  className={styles.fileRemove}
                  onClick={() => removeFile(f.name)}
                  title="Remove file"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          <div className={styles.fileSummary}>
            {files.length} file{files.length !== 1 ? "s" : ""} —{" "}
            {(totalSize / 1024).toFixed(1)} KB total
          </div>
        </div>
      )}

      {hasClientErrors && (
        <div
          className={clsx(styles.statusMessage, styles.errorMessage)}
          role="alert"
        >
          <div className="flex items-center gap-2 mb-1 font-medium">
            <AlertCircle className="size-4" />
            Validation Error
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {hasServerErrors && !hasClientErrors && (
        <div
          className={clsx(styles.statusMessage, styles.errorMessage)}
          role="alert"
        >
          <div className="flex items-center gap-2 mb-1 font-medium">
            <AlertCircle className="size-4" />
            Upload Error
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {result.errors?.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {files.length > 0 && !result.success && (
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending
            ? "Uploading…"
            : `Upload ${files.length} file${files.length !== 1 ? "s" : ""}`}
        </Button>
      )}

      {result.success && (
        <div className={clsx(styles.statusMessage, styles.successMessage)}>
          <div className="flex items-center gap-2 mb-1 font-medium">
            <CheckCircle className="size-4" />
            Upload Successful
          </div>
          <p>
            Processed {result.systemsProcessed} system
            {result.systemsProcessed !== 1 ? "s" : ""} successfully.
          </p>
          {result.errors && result.errors.length > 0 && (
            <p className="mt-1 text-xs opacity-80">
              {result.errors.length} warning(s) during processing.
            </p>
          )}
          <Link
            href={`/w/${workspaceSlug}/graph`}
            className="mt-2 inline-block underline font-medium"
          >
            View dependency graph →
          </Link>
        </div>
      )}
    </div>
  );
}
