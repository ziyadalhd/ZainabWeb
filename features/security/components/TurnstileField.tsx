"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; language: string; theme: "light"; size: "flexible" }) => string;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function getTurnstileRenderOptions(key: string) {
  return { sitekey: key, language: "ar", theme: "light" as const, size: "flexible" as const };
}

export function TurnstileField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useId();
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || !window.turnstile || containerRef.current.childElementCount > 0) return;
    window.turnstile.render(containerRef.current, getTurnstileRenderOptions(siteKey));
  }, [scriptReady]);

  if (!siteKey) return null;

  return (
    <div className="turnstile-field" aria-live="polite">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={containerRef} id={widgetId} aria-label="تأكيد أنكِ شخص حقيقي" />
    </div>
  );
}
