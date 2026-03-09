"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import styles from "./PasswordInput.module.css";

export function PasswordInput({
  id,
  name,
  autoComplete,
  required,
  minLength,
  value,
  onChange,
}: {
  id: string;
  name: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.passwordWrapper}>
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className={styles.eyeButton}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className={styles.eyeIcon} />
        ) : (
          <Eye className={styles.eyeIcon} />
        )}
      </button>
    </div>
  );
}
