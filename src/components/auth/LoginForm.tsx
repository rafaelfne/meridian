"use client";

import { useActionState, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Check, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { register } from "@/modules/auth/actions/register";
import { loginWithCredentials } from "@/modules/auth/actions/login";
import styles from "./LoginForm.module.css";

const registerInitial = { success: false as const, error: {} as Record<string, string[]> };
const loginInitial = { success: false as const, error: "" };

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[a-z]/.test(v), label: "One lowercase letter" },
  { test: (v: string) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v: string) => /[0-9]/.test(v), label: "One number" },
] as const;

export function LoginForm() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [activeTab, setActiveTab] = useState("signin");
  const [password, setPassword] = useState("");

  const [registerResult, registerAction, registerPending] = useActionState(
    register,
    registerInitial,
  );
  const [loginResult, loginAction, loginPending] = useActionState(
    loginWithCredentials,
    loginInitial,
  );

  useEffect(() => {
    if (registerResult.success) {
      // Use microtask to defer state update and avoid cascading renders
      queueMicrotask(() => {
        setActiveTab("signin");
      });
    }
  }, [registerResult.success]);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.logo}>
        <Image src="/icon.png" alt="Meridian" width={40} height={40} />
      </Link>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Welcome to Meridian</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetSuccess && (
            <p className={styles.success}>
              Password reset successfully. Sign in with your new password.
            </p>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form action={loginAction} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="signin-email">Email</label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="signin-password">Password</label>
                  <PasswordInput
                    id="signin-password"
                    name="password"
                    required
                    autoComplete="current-password"
                  />
                  <Link href="/forgot-password" className={styles.forgotLink}>
                    Forgot password?
                  </Link>
                </div>
                {loginResult.error && (
                  <p className={styles.error}>{loginResult.error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loginPending}
                  className={styles.submitButton}
                >
                  {loginPending && <Loader2 className="size-4 animate-spin" />}
                  {loginPending ? "Signing in\u2026" : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form action={registerAction} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="signup-name">Name</label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="signup-email">Email</label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="signup-password">Password</label>
                  <PasswordInput
                    id="signup-password"
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
                  <label htmlFor="signup-confirm-password">Confirm Password</label>
                  <PasswordInput
                    id="signup-confirm-password"
                    name="confirmPassword"
                    required
                    autoComplete="new-password"
                  />
                </div>
                {!registerResult.success &&
                  registerResult.error &&
                  Object.entries(registerResult.error).map(([field, messages]) =>
                    messages?.map((msg, i) => (
                      <p key={`${field}-${i}`} className={styles.error}>
                        {msg}
                      </p>
                    )),
                  )}
                {registerResult.success && (
                  <p className={styles.success}>
                    Account created! You can now sign in.
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={registerPending}
                  className={styles.submitButton}
                >
                  {registerPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {registerPending ? "Creating account\u2026" : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <button
            type="button"
            className={styles.githubButton}
            onClick={() => signIn("github", { callbackUrl: "/workspaces" })}
          >
            <svg
              className={styles.githubIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
