import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password - Meridian",
};

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/workspaces");

  return <ForgotPasswordForm />;
}
