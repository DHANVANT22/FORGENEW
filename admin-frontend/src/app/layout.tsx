import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import './globals.css';
import { SidebarNav } from '@/components/ui/SidebarNav';
import { VortexCursor } from '@/components/ui/VortexCursor';
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ScanlineOverlay, CommandPalette, AudioProvider, RadialMenu, FlightPathBreadcrumb, TelemetryStrip, VignetteOverlay, TransitionWrapper, CommandPaletteHint, ThemeToggle, CometCursor } from '@/components/ui';

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
  title: 'Haizo Workspace | Ops Console',
  description: 'Internal Next.js dashboard for PMs to manage leads and orchestrate delivery.',
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
      <body className={`${fontInter.variable} ${fontDisplay.variable} ${fontMono.variable} antialiased flex h-screen bg-background text-foreground font-sans`}>
        <AudioProvider>
          <AmbientBackground />
          <ScanlineOverlay />
          <VignetteOverlay />
          
          <SidebarNav />
          
          {/* Main Content */}
          <main className="flex-1 flex flex-col h-full overflow-hidden z-10 relative">
            <header className="h-16 border-b border-border bg-surface flex items-center px-6 justify-between shrink-0">
              <FlightPathBreadcrumb />
            </header>
            <div className="flex-1 overflow-y-auto">
              <TransitionWrapper>{children}</TransitionWrapper>
            </div>
            <TelemetryStrip />
          </main>
          
          <CommandPaletteHint />
          <CommandPalette />
          <RadialMenu />
          <CometCursor />
          <ThemeToggle />
        </AudioProvider>
      </body>
    </html>
  );
}
