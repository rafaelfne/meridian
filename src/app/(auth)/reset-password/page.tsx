import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password - Meridian",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/workspaces");

  const { token } = await searchParams;
  if (!token) redirect("/forgot-password");

  return <ResetPasswordForm token={token} />;
}
