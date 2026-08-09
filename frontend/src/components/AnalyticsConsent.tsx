"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const CONSENT_KEY = "listacrosseu-analytics-consent";
const CONSENT_EVENT = "listacrosseu:analytics-consent-changed";

type ConsentChoice = "accepted" | "rejected";

export function resetAnalyticsConsent() {
  window.localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function isPrivatePath(pathname: string) {
  return ["/dashboard", "/admin", "/premium-preview", "/login", "/signup", "/verify"].some(
    (segment) => pathname === segment || pathname.startsWith(`${segment}/`) || pathname.includes(`${segment}/`),
  );
}

export default function AnalyticsConsent({
  gaMeasurementId,
  clarityProjectId,
}: {
  gaMeasurementId?: string;
  clarityProjectId?: string;
}) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const analyticsConfigured = Boolean(gaMeasurementId || clarityProjectId);
  const privatePath = useMemo(() => isPrivatePath(pathname || "/"), [pathname]);

  useEffect(() => {
    if (!analyticsConfigured || privatePath) return;

    const readChoice = () => {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      setChoice(stored === "accepted" || stored === "rejected" ? stored : null);
    };

    readChoice();
    window.addEventListener(CONSENT_EVENT, readChoice);
    return () => window.removeEventListener(CONSENT_EVENT, readChoice);
  }, [analyticsConfigured, privatePath]);

  useEffect(() => {
    if (choice !== "accepted" || privatePath || !gaMeasurementId) return;
    const pagePath = `${window.location.pathname}${window.location.search}`;
    window.gtag?.("config", gaMeasurementId, { page_path: pagePath });
  }, [choice, gaMeasurementId, pathname, privatePath]);

  if (!analyticsConfigured || privatePath) return null;

  const accept = () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setChoice("accepted");
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  const reject = () => {
    window.localStorage.setItem(CONSENT_KEY, "rejected");
    setChoice("rejected");
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  return (
    <>
      {choice === "accepted" && gaMeasurementId && (
        <>
          <Script
            id="listacrosseu-ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`}
            strategy="afterInteractive"
          />
          <Script id="listacrosseu-ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; window.gtag = window.gtag || function(){window.dataLayer.push(arguments);}; window.gtag('js', new Date()); window.gtag('config', ${JSON.stringify(gaMeasurementId)}, {page_path: window.location.pathname + window.location.search});`}
          </Script>
        </>
      )}

      {choice === "accepted" && clarityProjectId && (
        <Script id="listacrosseu-clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(clarityProjectId)});`}
        </Script>
      )}

      {choice === null && (
        <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-xl" aria-label="Analytics preferences">
          <p>We use optional analytics to understand how ListAcrossEU is used and improve the directory.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={accept} className="rounded-md bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Accept analytics</button>
            <button type="button" onClick={reject} className="rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Reject analytics</button>
          </div>
        </aside>
      )}
    </>
  );
}
