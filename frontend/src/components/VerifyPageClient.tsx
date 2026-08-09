"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import { PUBLIC_API_BASE_URL } from "@/lib/env.public";

type VerifyState = "idle" | "loading" | "success" | "error";

export default function VerifyPageClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerifyState>("idle");
  const [message, setMessage] = useState<string>("");
  const [resendMessage, setResendMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t.messages.verify.missingToken);
      return;
    }

    let cancelled = false;
    setStatus("loading");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    fetch(`${PUBLIC_API_BASE_URL}/api/verify?token=${encodeURIComponent(token)}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || t.messages.verify.failed);
        }
        return data;
      })
      .then(async () => {
        if (cancelled) return;
        setStatus("success");
        setMessage(t.messages.verify.success);
        const authResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/auth/`, { credentials: "include" }).catch(() => null);
        if (authResponse?.ok && !cancelled) router.replace(`/${lang}/dashboard`);
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(error?.name === "AbortError" ? "The verification request timed out. Please try again." : error?.message || t.messages.verify.failed);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token, lang, retryCount, router]);

  const handleRetry = () => {
    setResendMessage("");
    setStatus("idle");
    setRetryCount((count) => count + 1);
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{t.messages.verify.title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {t.messages.verify.subtitle}
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {status === "loading" && t.messages.verify.loading}
        {status === "success" && message}
        {status === "error" && message}
      </div>

      {status === "success" && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Continue to your business dashboard</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href={`/${lang}/signup?next=/${lang}/dashboard`} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white">Create account</Link>
            <Link href={`/${lang}/login?next=/${lang}/dashboard`} className="rounded-md border border-blue-700 px-4 py-2 font-semibold text-blue-800">Sign in</Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Retry verification
          </button>
          <Link href={`/${lang}/login?next=/${lang}/dashboard`} className="ml-3 inline-flex items-center rounded-md border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
            Sign in to continue
          </Link>
          {resendMessage && (
            <p className="text-sm text-emerald-600">{resendMessage}</p>
          )}
        </div>
      )}

      <div className="mt-6">
        <Link href={`/${lang}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
          {t.buttons.returnHome}
        </Link>
      </div>
    </div>
  );
}


