"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let u = t;
  for (let i = 0; i < 8; i += 1) {
    const inv = 1 - u;
    const x = 3 * inv * inv * u * x1 + 3 * inv * u * u * x2 + u * u * u;
    const dx = 3 * inv * inv * x1 + 6 * inv * u * (x2 - x1) + 3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u = Math.min(1, Math.max(0, u - (x - t) / dx));
  }
  const inv = 1 - u;
  return 3 * inv * inv * u * y1 + 3 * inv * u * u * y2 + u * u * u;
}

const easeIn = (t: number) => cubicBezier(t, 0.42, 0, 1, 1);
const easeOut = (t: number) => cubicBezier(t, 0, 0, 0.58, 1);

export function ScrollReveal() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewHeight = window.innerHeight;

      document.querySelectorAll<HTMLElement>("[data-scene]").forEach((scene) => {
        const reveal = scene.querySelector<HTMLElement>("[data-reveal]");
        if (!reveal) return;
        const rect = scene.getBoundingClientRect();
        const cover = (viewHeight - rect.top) / (Math.max(rect.height, 1) + viewHeight);
        if (scene.dataset.scene === "x") {
          const turned = easeIn(clamp((cover - 0.02) / 0.2));
          const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
          const dir = (scene.dataset.dir === "1" ? 1 : -1) * rtl;
          reveal.style.opacity = turned.toFixed(3);
          reveal.style.translate = `${((1 - turned) * dir * 100).toFixed(2)}% 0`;
          return;
        }
        const turned = easeOut(clamp((cover - 0.35) / 0.15));
        reveal.style.opacity = turned.toFixed(3);
        reveal.style.translate = `0 ${((1 - turned) * 50).toFixed(2)}%`;
      });
    };

    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    const kick = window.requestAnimationFrame(update);
    const late = window.setTimeout(update, 120);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    window.addEventListener("hashchange", request);
    window.addEventListener("load", request);
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(kick);
      window.clearTimeout(late);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("hashchange", request);
      window.removeEventListener("load", request);
    };
  }, [pathname]);

  return null;
}
