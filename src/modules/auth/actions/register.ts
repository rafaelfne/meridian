"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { SignUpSchema } from "../validators/auth-schema";

export async function register(
  _prevState: { success: boolean; error?: Record<string, string[]> },
  formData: FormData,
) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = SignUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return {
      success: false as const,
      error: { email: ["An account with this email already exists. Try signing in instead."] },
    };
  }

  const hashedPassword = await hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
    },
  });

  return { success: true as const };
}
