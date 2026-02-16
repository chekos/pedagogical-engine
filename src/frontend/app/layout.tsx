import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "../components/theme-provider";
import { SkipLink } from "../components/ui/skip-link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pedagogical Engine",
    template: "%s | Pedagogical Engine",
  },
  description: "AI-powered teaching partner for educators — plan lessons, assess students, reason about skills",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do NOT set maximumScale or userScalable=no — WCAG 1.4.4 requires 200% zoom
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface-0 text-text-primary antialiased">
        <ThemeProvider>
          <SkipLink />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
