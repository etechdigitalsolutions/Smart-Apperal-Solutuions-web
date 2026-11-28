import { redirect } from "next/navigation";
import AuthPanel from "@/components/auth/AuthPanel";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = firstParam(params.code);
  if (code) {
    const next = new URLSearchParams({
      code,
      next: "/reset-password",
    });
    redirect(`/auth/callback?${next.toString()}`);
  }

  return <AuthPanel mode="reset" />;
}
