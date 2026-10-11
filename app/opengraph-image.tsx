import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#071018",
          color: "#f4f1ea",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 3, color: "#e4b15a" }}>
          TAREQ AL-GHAZZI · RIYADH
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 0.98 }}>
          <span>Cloud is a</span>
          <span style={{ color: "#e4b15a" }}>regional capability.</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#b7c0d0" }}>
          Head of Cloud Services, MENA · Azure · FinOps · AI
        </div>
      </div>
    ),
    size,
  );
}
