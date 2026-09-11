import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans-body",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Control de puntos",
  description: "Avisos de llegada y registro de cruces para recorridos de busetas",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Puntos",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#4ba8e0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
