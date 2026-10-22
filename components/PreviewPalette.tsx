import Script from "next/script";
import { PaletteSwitcher } from "@/components/PaletteSwitcher";
import { paletteInitScript } from "@/lib/palette";

/** Preview deployments only. Production builds omit the switcher and the boot script. */
export function PreviewPalette() {
  if (process.env.VERCEL_ENV === "production") return null;
  return (
    <>
      <Script id="palette-init" strategy="beforeInteractive">
        {paletteInitScript}
      </Script>
      <PaletteSwitcher />
    </>
  );
}
