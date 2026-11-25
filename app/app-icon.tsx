import { ImageResponse } from "next/og";

export function createAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          borderRadius: `${Math.round(size * 0.22)}px`,
          color: "white",
          fontSize: `${Math.round(size * 0.42)}px`,
          fontWeight: 800,
          letterSpacing: "-0.08em",
        }}
      >
        BET
      </div>
    ),
    { width: size, height: size }
  );
}
