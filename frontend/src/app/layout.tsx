import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CometCursor } from "@/components/ui/CometCursor";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ScanlineOverlay, AudioProvider, VignetteOverlay, TransitionWrapper, ThemeToggle } from "@/components/ui";
import { Navbar } from "@/components/ui/Navbar";

const fontInter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const fontDisplay = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haizo Workspace | Enterprise Platform",
  description: "An intelligent project lifecycle platform unifying lead estimation, risk simulation, real-time client delivery portals, and advanced team analytics.",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body
        className={`${fontInter.variable} ${fontDisplay.variable} ${fontMono.variable} antialiased font-sans`}
      >
        <AudioProvider>
          <AmbientBackground />
          <ScanlineOverlay />
          <VignetteOverlay />
          <Navbar />
          <TransitionWrapper>{children}</TransitionWrapper>
          <CometCursor />
          <ThemeToggle />
        </AudioProvider>
      </body>
    </html>
  );
}
