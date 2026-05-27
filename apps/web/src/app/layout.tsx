import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kairo — Faith Streaming",
    template: "%s | Kairo",
  },
  description:
    "The modern streaming platform where faith, family, and transformative stories come together.",
  keywords: ["faith", "streaming", "christian", "family", "kids", "church", "worship"],
  authors: [{ name: "Kairo" }],
  creator: "Kairo",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Kairo",
    title: "Kairo — Faith Streaming",
    description: "Faith, family, and transformative stories.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kairo — Faith Streaming",
    description: "Faith, family, and transformative stories.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
        <body className="bg-kairo-dark text-white antialiased font-sans">
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#111118",
                border: "1px solid #1E1E2A",
                color: "#fff",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
