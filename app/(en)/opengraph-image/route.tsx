import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const runtime = "nodejs";

const size = { width: 1200, height: 630 };

export async function GET() {
  const photo = await readFile(join(process.cwd(), "public", "personal-image.jpg"));
  const src = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0B1626",
          color: "#F3EEE4",
          padding: "72px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#C8A96A", marginBottom: 28 }}>TAREQ AL-GHAZZI</div>
          <div style={{ display: "flex", width: 72, height: 1, background: "#C8A96A", marginBottom: 28 }} />
          <div style={{ display: "flex", fontSize: 52, fontWeight: 400, lineHeight: 1.12, color: "#F3EEE4" }}>
            I build cloud platforms that actually survive reality.
          </div>
        </div>
        <img src={src} alt="" width={340} height={342} style={{ borderRadius: 4, objectFit: "cover", border: "1px solid #C8A96A" }} />
      </div>
    ),
    size,
  );
  image.headers.set("Cache-Control", "public, max-age=86400");
  return image;
}
