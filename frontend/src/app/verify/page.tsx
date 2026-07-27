import { redirect } from "next/navigation";

export default function VerifyRedirectPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ? encodeURIComponent(searchParams.token) : "";
  const target = token ? `/en/verify?token=${token}` : `/en/verify`;
  redirect(target);
}
