import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const photo = await readFile(join(process.cwd(), "public", "personal-image.jpg"));
  const src = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#F8F7FC",
          color: "#0B1F3A",
          padding: "72px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
          <div style={{ display: "flex", fontSize: 28, marginBottom: 24 }}>Tareq Al-Ghazzi</div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>
            I build cloud platforms that actually survive reality.
          </div>
        </div>
        <img
          src={src}
          alt=""
          width={340}
          height={342}
          style={{ borderRadius: 40, objectFit: "cover" }}
        />
      </div>
    ),
    size,
  );
}
