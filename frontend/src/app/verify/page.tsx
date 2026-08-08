import { redirect } from "next/navigation";

export default async function VerifyRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token
    ? encodeURIComponent(resolvedSearchParams.token)
    : "";
  const target = token ? `/en/verify?token=${token}` : `/en/verify`;
  redirect(target);
}
