"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { resetPassword } from "@/modules/auth/actions/reset-password";
import styles from "./ResetPasswordForm.module.css";

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[a-z]/.test(v), label: "One lowercase letter" },
  { test: (v: string) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v: string) => /[0-9]/.test(v), label: "One number" },
] as const;

const initial = { success: false as const, error: "" };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [result, action, pending] = useActionState(resetPassword, initial);

  useEffect(() => {
    if (result.success) {
      router.push("/login?reset=success");
    }
  }, [result.success, router]);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.logo}>
        <Image src="/icon.png" alt="Meridian" width={40} height={40} />
      </Link>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className={styles.form}>
            <input type="hidden" name="token" value={token} />
            <div className={styles.field}>
              <label htmlFor="reset-password">New Password</label>
              <PasswordInput
                id="reset-password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password.length > 0 && (
                <ul className={styles.rules}>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <li
                        key={rule.label}
                        className={passed ? styles.rulePassed : styles.ruleFailed}
                      >
                        {passed ? (
                          <Check className={styles.ruleIcon} />
                        ) : (
                          <X className={styles.ruleIcon} />
                        )}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="reset-confirm-password">Confirm Password</label>
              <PasswordInput
                id="reset-confirm-password"
                name="confirmPassword"
                required
                autoComplete="new-password"
              />
            </div>
            {result.error && (
              <p className={styles.error}>{result.error}</p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className={styles.submitButton}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Resetting\u2026" : "Reset Password"}
            </Button>
            <Link href="/login" className={styles.backLink}>
              Back to sign in
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
