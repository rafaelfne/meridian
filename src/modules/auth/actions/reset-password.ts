"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { hashToken } from "@/lib/tokens";
import { ResetPasswordSchema } from "../validators/auth-schema";

export async function resetPassword(
  _prevState: { success: boolean; error?: string },
  formData: FormData,
) {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError =
      errors.password?.[0] ??
      errors.confirmPassword?.[0] ??
      errors.token?.[0] ??
      "Invalid input";
    return { success: false as const, error: firstError };
  }

  const tokenHash = hashToken(parsed.data.token);

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true },
  });

  if (!resetToken) {
    return {
      success: false as const,
      error: "This reset link is invalid or has expired.",
    };
  }

  const hashedPassword = await hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true as const };
}
