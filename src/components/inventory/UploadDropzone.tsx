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
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const initialState: UploadInventoryResult = { success: false };

export function UploadDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonPreview, setJsonPreview] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [result, dispatch, isPending] = useActionState(
    uploadInventoryAction,
    initialState,
  );

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setValidationErrors([]);
      setFile(null);
      setJsonPreview("");

      if (rejections.length > 0) {
        const errors = rejections.flatMap((r) =>
          r.errors.map((e) => {
            if (e.code === "file-too-large")
              return "File size exceeds 5MB limit";
            if (e.code === "file-invalid-type")
              return "Only .json files are accepted";
            return e.message;
          }),
        );
        setValidationErrors(errors);
        return;
      }

      const dropped = accepted[0];
      if (!dropped) return;

      dropped.text().then((text) => {
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          setValidationErrors(["Invalid JSON file"]);
          return;
        }

        const validation = InventoryUploadSchema.safeParse(json);
        if (!validation.success) {
          setValidationErrors(
            validation.error.issues.map(
              (issue) => `${issue.path.join(".")}: ${issue.message}`,
            ),
          );
          return;
        }

        setFile(dropped);
        setJsonPreview(JSON.stringify(json, null, 2));
      });
    },
    [],
  );

  const [, startTransition] = useTransition();

  const handleSubmit = useCallback(() => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(() => dispatch(formData));
  }, [file, dispatch, startTransition]);

  const isDisabled = isPending || result.success;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled: isDisabled,
  });

  const hasClientErrors = validationErrors.length > 0;
  const hasServerErrors =
    !result.success && result.errors != null && result.errors.length > 0;

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
        ) : file ? (
          <>
            <FileJson className="size-10" />
            <p className="font-medium">{file.name}</p>
            <p className="text-xs">
              {(file.size / 1024).toFixed(1)} KB — Ready to upload
            </p>
          </>
        ) : (
          <>
            <Upload className="size-10" />
            <p className="font-medium">
              Drag &amp; drop a JSON inventory file here, or click to browse
            </p>
            <p className="text-xs">Only .json files up to 5 MB</p>
          </>
        )}
      </div>

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

      {jsonPreview && !result.success && (
        <div>
          <button
            type="button"
            className={styles.previewToggle}
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((o) => !o)}
          >
            {previewOpen ? "▼ Hide" : "▶ Show"} JSON Preview
          </button>
          {previewOpen && <pre className={styles.preview}>{jsonPreview}</pre>}
        </div>
      )}

      {file && !result.success && (
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "Uploading…" : "Upload Inventory"}
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
            href="/graph"
            className="mt-2 inline-block underline font-medium"
          >
            View dependency graph →
          </Link>
        </div>
      )}
    </div>
  );
}
