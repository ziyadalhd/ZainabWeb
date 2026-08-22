"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        language: string;
        theme: "light";
        size: "flexible";
        appearance: "interaction-only";
        retry: "auto";
        "refresh-expired": "auto";
        "refresh-timeout": "auto";
        callback?: () => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => string;
    };
  }
}

const buildTimeSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function getTurnstileRenderOptions(key: string) {
  return {
    sitekey: key,
    language: "ar",
    theme: "light" as const,
    size: "flexible" as const,
    appearance: "interaction-only" as const,
    retry: "auto" as const,
    "refresh-expired": "auto" as const,
    "refresh-timeout": "auto" as const,
  };
}

export function TurnstileField({
  className,
  onVerifiedChange,
  onConfigurationFailedChange,
}: {
  className?: string;
  onVerifiedChange?: (verified: boolean) => void;
  onConfigurationFailedChange?: (failed: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useId();
  const [scriptReady, setScriptReady] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(buildTimeSiteKey ?? null);
  const [enforcementEnabled, setEnforcementEnabled] = useState<boolean | null>(buildTimeSiteKey ? true : null);
  const [configurationFailed, setConfigurationFailed] = useState(false);

  useEffect(() => {
    if (siteKey) {
      onConfigurationFailedChange?.(false);
      return;
    }

    let active = true;
    fetch("/api/turnstile-config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Turnstile configuration is unavailable.");
        return response.json() as Promise<{ enabled?: unknown; siteKey?: unknown }>;
      })
      .then((payload) => {
        if (!active) return;
        if (payload.enabled !== true) {
          setEnforcementEnabled(false);
          setSiteKey(null);
          setConfigurationFailed(false);
          onConfigurationFailedChange?.(false);
          onVerifiedChange?.(true);
          return;
        }
        if (typeof payload.siteKey !== "string" || payload.siteKey.length === 0) {
          setEnforcementEnabled(true);
          setConfigurationFailed(true);
          onConfigurationFailedChange?.(true);
          onVerifiedChange?.(false);
          return;
        }
        setEnforcementEnabled(true);
        setSiteKey(payload.siteKey);
      })
      .catch(() => {
        if (active) {
          setConfigurationFailed(true);
          onConfigurationFailedChange?.(true);
          onVerifiedChange?.(false);
        }
      });

    return () => {
      active = false;
    };
  }, [onConfigurationFailedChange, onVerifiedChange, siteKey]);

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || !window.turnstile || containerRef.current.childElementCount > 0) return;
    window.turnstile.render(containerRef.current, {
      ...getTurnstileRenderOptions(siteKey),
      callback: () => onVerifiedChange?.(true),
      "expired-callback": () => onVerifiedChange?.(false),
      "error-callback": () => onVerifiedChange?.(false),
    });
  }, [onVerifiedChange, scriptReady, siteKey]);

  if (enforcementEnabled === false) return null;

  return (
    <div className={`turnstile-field${className ? ` ${className}` : ""}`} aria-live="polite">
      {siteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
          <div ref={containerRef} id={widgetId} aria-label="تأكيد أنكِ شخص حقيقي" />
        </>
      ) : configurationFailed ? (
        <p role="alert" className="notice-error text-sm">تعذر تحميل التحقق. حدّثي الصفحة ثم حاولي مرة أخرى.</p>
      ) : (
        <p className="text-sm muted-copy">جارٍ تجهيز التحقق…</p>
      )}
    </div>
  );
}
