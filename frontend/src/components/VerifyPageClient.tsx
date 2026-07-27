"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import { PUBLIC_API_BASE_URL } from "@/lib/env.public";

type VerifyState = "idle" | "loading" | "success" | "error";

export default function VerifyPageClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerifyState>("idle");
  const [message, setMessage] = useState<string>("");
  const [resendMessage, setResendMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t.messages.verify.missingToken);
      return;
    }

    let cancelled = false;
    setStatus("loading");

    fetch(`${PUBLIC_API_BASE_URL}/api/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || t.messages.verify.failed);
        }
        return data;
      })
      .then(() => {
        if (cancelled) return;
        setStatus("success");
        setMessage(t.messages.verify.success);
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(error?.message || t.messages.verify.failed);
      });

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const handleResend = () => {
    setResendMessage(t.messages.verify.resendRequested);
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

      {status === "error" && (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t.buttons.resendVerification}
          </button>
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


