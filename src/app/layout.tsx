import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { NotificationProvider } from "@/providers/notification-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Idol Meta Fan Made Edition",
  description: "Platform turnamen profesional untuk game Idol Meta. Male Division, Female Division, dan Liga IDM.",
  keywords: ["Idol Meta", "Tournament", "Esports", "Gaming", "Competition"],
  authors: [{ name: "Idol Meta Team" }],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Idol Meta Fan Made Edition",
    description: "Platform turnamen profesional untuk game Idol Meta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Idol Meta Fan Made Edition",
    description: "Platform turnamen profesional untuk game Idol Meta",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dc2626" },
    { media: "(prefers-color-scheme: dark)", color: "#dc2626" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Critical inline styles to prevent flash of unstyled content */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html { background-color: #020617 !important; }
              html.dark { background-color: #020617 !important; }
              body { 
                background-color: #020617 !important; 
                min-height: 100vh;
                margin: 0;
              }
              /* Hide content until hydrated to prevent hydration mismatch flash */
              body::before {
                content: '';
                position: fixed;
                inset: 0;
                background: linear-gradient(135deg, #020617 0%, #450a0a 50%, #020617 100%);
                z-index: 9999;
                opacity: 1;
                transition: opacity 0.3s ease;
              }
              body.hydrated::before {
                opacity: 0;
                pointer-events: none;
              }
            `,
          }}
        />
        {/* Script to mark body as hydrated immediately after React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Immediately set dark class
                document.documentElement.classList.add('dark');
                // Mark hydrated after a small delay to allow React to render
                requestAnimationFrame(function() {
                  document.body.classList.add('hydrated');
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-slate-950`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <NotificationProvider>
              {children}
              <Toaster />
            </NotificationProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
