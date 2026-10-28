import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

async function brandFonts() {
  const dir = path.join(process.cwd(), "src/lib/fonts");
  const [fraunces, hanken, hankenBold] = await Promise.all([
    readFile(path.join(dir, "Fraunces-SemiBold.ttf")),
    readFile(path.join(dir, "HankenGrotesk-Medium.ttf")),
    readFile(path.join(dir, "HankenGrotesk-SemiBold.ttf")),
  ]);
  return [
    { name: "Fraunces", data: fraunces, weight: 600 as const, style: "normal" as const },
    { name: "Hanken", data: hanken, weight: 500 as const, style: "normal" as const },
    { name: "Hanken", data: hankenBold, weight: 600 as const, style: "normal" as const },
  ];
}

export async function appleIconImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a2e1a",
        }}
      >
        <div
          style={{
            fontFamily: "Fraunces",
            fontSize: 78,
            color: "#f7f5f0",
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          GL
        </div>
        <div
          style={{
            width: 64,
            height: 7,
            borderRadius: 4,
            background: "#e8c547",
            marginTop: 10,
          }}
        />
      </div>
    ),
    {
      width: 180,
      height: 180,
      fonts: await brandFonts(),
    },
  );
}

export async function shareImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1a2e1a",
          color: "#f7f5f0",
          padding: "68px 76px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "#e8c547",
              marginRight: 16,
            }}
          />
          <div
            style={{
              fontFamily: "Hanken",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 4,
              color: "#e8c547",
            }}
          >
            BIRMINGHAM SHOWROOM
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: 86,
              lineHeight: 1.02,
              letterSpacing: -2,
            }}
          >
            Green Lane Furniture
          </div>
          <div
            style={{
              fontFamily: "Hanken",
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: 6,
              color: "#d5e2d2",
              marginTop: 22,
            }}
          >
            BY {site.logoByline}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "Hanken",
            fontSize: 28,
            fontWeight: 500,
            color: "#ebe6dc",
          }}
        >
          <div>Sofas, beds and home furniture</div>
          <div>Free UK delivery</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: await brandFonts(),
    },
  );
}
