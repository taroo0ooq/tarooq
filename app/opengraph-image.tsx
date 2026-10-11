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
          background: "#07080d",
          color: "#f4f1ea",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, color: "#9db4ff" }}>
            TARO OQ · SYSTEMS
          </div>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#e8ff47",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, lineHeight: 0.95, fontWeight: 700 }}>
          <span>Keep the secret</span>
          <span style={{ color: "#e8ff47" }}>on the device.</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#b4b8c7" }}>
          Zero-knowledge vaults · native clients · green gates
        </div>
      </div>
    ),
    size,
  );
}
