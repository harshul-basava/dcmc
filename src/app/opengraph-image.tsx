import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { conference } from "@/content/site";

export const alt =
  "AI Governance DC Mini-Conference, October 23–25, 2026, in Washington, DC";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const [newsreader, capitol] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/newsreader-medium.ttf")),
    readFile(join(process.cwd(), "src/assets/capitol-social.jpg"), "base64"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f1ec",
          color: "#2f2923",
        }}
      >
        <div
          style={{
            width: 700,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "68px 58px 58px 70px",
          }}
        >
          <div
            style={{
              width: 72,
              height: 6,
              display: "flex",
              background: "#933333",
              marginBottom: 34,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Newsreader",
              fontSize: 76,
              fontWeight: 500,
              lineHeight: 0.89,
              letterSpacing: "-0.035em",
              color: "#142a5d",
            }}
          >
            <span>AI Governance</span>
            <span>DC</span>
            <span>Mini-Conference</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              marginTop: "auto",
            }}
          >
            <div
              style={{
                width: 3,
                display: "flex",
                background: "#c76461",
                marginRight: 18,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 25,
                  fontWeight: 700,
                  letterSpacing: "0.045em",
                  color: "#2f2923",
                }}
              >
                {conference.dates.toUpperCase()}
              </span>
              <span style={{ fontSize: 24, color: "#776c5f" }}>
                {conference.location}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            width: 500,
            height: "100%",
            display: "flex",
            padding: "38px 38px 38px 0",
          }}
        >
          <img
            src={`data:image/jpeg;base64,${capitol}`}
            alt=""
            width="462"
            height="554"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 39%",
              borderRadius: 2,
              boxShadow: "0 18px 42px rgba(20, 42, 93, 0.18)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Newsreader",
          data: newsreader,
          style: "normal",
          weight: 500,
        },
      ],
    },
  );
}
