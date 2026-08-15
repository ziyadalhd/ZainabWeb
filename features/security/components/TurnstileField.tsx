"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; language: string; theme: "light" }) => string;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function TurnstileField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useId();
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || !window.turnstile || containerRef.current.childElementCount > 0) return;
    window.turnstile.render(containerRef.current, { sitekey: siteKey, language: "ar", theme: "light" });
  }, [scriptReady]);

  if (!siteKey) return null;

  return (
    <div className="grid gap-2" aria-live="polite">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={containerRef} id={widgetId} aria-label="التحقق الأمني" />
      <p className="text-xs muted-copy">يُستخدم تحقق أمني لحماية النماذج من الإرسال الآلي.</p>
    </div>
  );
}
