import type { Metadata, Viewport } from "next";

import { publicEnv } from "@/lib/env/public";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  title: "ShipChat",
  description:
    "ShipChat keeps operations, product, and engineering aligned in one shared messaging workspace.",
  applicationName: "ShipChat",
  keywords: [
    "ShipChat",
    "team messaging",
    "operations chat",
    "logistics communication",
  ],
  openGraph: {
    title: "ShipChat",
    description:
      "Real-time team messaging for operations, product, and engineering.",
    siteName: "ShipChat",
    type: "website",
    url: publicEnv.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: "summary",
    title: "ShipChat",
    description:
      "Real-time team messaging for operations, product, and engineering.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2ea48c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
