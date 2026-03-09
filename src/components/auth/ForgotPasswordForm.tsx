"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { forgotPassword } from "@/modules/auth/actions/forgot-password";
import styles from "./ForgotPasswordForm.module.css";

const initial = { success: false as const, error: "" };

export function ForgotPasswordForm() {
  const [result, action, pending] = useActionState(forgotPassword, initial);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.logo}>
        <Image src="/icon.png" alt="Meridian" width={40} height={40} />
      </Link>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.success ? (
            <>
              <p className={styles.success}>{result.message}</p>
              <Link href="/login" className={styles.backLink}>
                Back to sign in
              </Link>
            </>
          ) : (
            <form action={action} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="forgot-email">Email</label>
                <Input
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
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
                {pending ? "Sending\u2026" : "Send Reset Link"}
              </Button>
              <Link href="/login" className={styles.backLink}>
                Back to sign in
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
