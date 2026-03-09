"use server";

import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { ForgotPasswordSchema } from "../validators/auth-schema";

const GENERIC_MESSAGE = "If an account exists with that email, we've sent a reset link.";

export async function forgotPassword(
  _prevState: { success: boolean; message?: string; error?: string },
  formData: FormData,
) {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, password: true },
  });

  // Anti-enumeration: always return the same message
  if (!user || !user.password) {
    return { success: true as const, message: GENERIC_MESSAGE };
  }

  const { raw, hash } = generateResetToken();

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${raw}`;

  await sendPasswordResetEmail(parsed.data.email, resetUrl);

  return { success: true as const, message: GENERIC_MESSAGE };
}
