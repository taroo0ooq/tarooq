"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { showChatWidget } from "@/lib/chat-ui";
import type { Locale } from "@/lib/locale";

const ChatWidget = dynamic(() => import("@/components/ChatWidget").then((mod) => mod.ChatWidget), {
  ssr: false,
  loading: () => null,
});

export function ChatWidgetLoader({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "/";
  const visible = showChatWidget(pathname);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const id = idle(() => setReady(true));
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 1);
    return () => window.clearTimeout(id);
  }, [visible]);

  if (!visible || !ready) return null;
  return <ChatWidget locale={locale} />;
}
