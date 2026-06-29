import { redirect } from "next/navigation";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  redirect(`/register/verify${query}`);
}
