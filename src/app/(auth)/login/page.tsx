import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In - Meridian",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/workspaces");

  return <LoginForm />;
}
