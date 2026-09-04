import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://jetsquirrel.github.io"),
  title: "GPUI Kit Canvas",
  description:
    "Sketch gpui-kit desktop windows in the browser and turn them into vibe-coding prompts. / gpui-kit のデスクトップ画面をブラウザで組み立てて、そのままプロンプトに。",
  openGraph: {
    title: "GPUI Kit Canvas",
    description: "Design gpui-kit desktop windows, link them, preview them, and copy a prompt for your AI coding tool.",
    images: [`${BASE}/og.png`],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: [`${BASE}/og.png`] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        {/* The default typeface is the system UI font, which is what gpui-kit's
            `.SystemUIFont` resolves to. The other faces are fetched only when
            the author picks them; see lib/theme.ts. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>{children}</body>
    </html>
  );
}
