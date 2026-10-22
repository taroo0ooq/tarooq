"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { turnstileSiteKey } from "@/lib/turnstile-public";

type TurnstileWidgetId = string;

type TurnstileRenderOptions = {
  sitekey: string;
  theme: "light" | "dark";
  language?: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId;
  remove: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const turnstileScript = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function widgetTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function TurnstileField({
  resetKey,
  language,
  onToken,
}: {
  resetKey: number;
  language?: string;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const renderRef = useRef<() => void>(() => {});

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    let widgetId: TurnstileWidgetId | null = null;
    let stopped = false;

    function render() {
      if (stopped || widgetId || !node || !window.turnstile) return;
      widgetId = window.turnstile.render(node, {
        sitekey: turnstileSiteKey(),
        theme: widgetTheme(),
        language,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => onTokenRef.current(""),
      });
    }

    renderRef.current = render;
    render();

    const observer = new MutationObserver(() => {
      if (!widgetId || !window.turnstile || !node) return;
      window.turnstile.remove(widgetId);
      widgetId = null;
      onTokenRef.current("");
      render();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      stopped = true;
      renderRef.current = () => {};
      observer.disconnect();
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [language, resetKey]);

  return (
    <div className="turnstile">
      <Script src={turnstileScript} strategy="afterInteractive" async defer onReady={() => renderRef.current()} />
      <div ref={container} />
    </div>
  );
}
