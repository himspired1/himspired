import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font";
import "./globals.css";
import { Toaster } from "sonner";
import { LoadingProvider } from "@/context/LoadingContext";
import AppShell from "@/components/AppShell";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Himspired - Where Thrift Meets Luxury",
    template: "%s | Himspired",
  },
  description:
    "Discover premium fashion at accessible prices. Himspired offers curated thrift, luxury, vintage, and modern clothing for men and women. Quality fashion that doesn't break the bank.",
  keywords: [
    "thrift fashion",
    "luxury clothing",
    "vintage fashion",
    "premium fashion",
    "affordable luxury",
    "fashion store",
    "clothing",
    "style",
    "fashion",
  ],
  authors: [{ name: "Himspired" }],
  creator: "Himspired",
  publisher: "Himspired",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://himspired.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://himspired.vercel.app",
    title: "Himspired - Where Thrift Meets Luxury",
    description:
      "Discover premium thrifted fashion at accessible prices. Quality, luxury and vintage thrifts for men and women",
    siteName: "Himspired",
    images: [
      {
        url: "/images/logos/logo-white.png",
        width: 1200,
        height: 630,
        alt: "Himspired - Premium Fashion Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Himspired - Where Thrift Meets Luxury",
    description:
      "Discover premium fashion at accessible prices. Quality thrift, luxury, vintage, and modern clothing.",
    images: ["/images/logos/logo-white.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <head>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Himspired",
              url: "https://himspired.vercel.app",
              logo: "https://himspired.vercel.app/images/logos/logo-white.png",
              description:
                "Where thrift meets luxury - Premium fashion at accessible prices",
              sameAs: [
                "https://www.instagram.com/himspired.ng",
                "https://www.tiktok.com/@himspired.ng",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                email: "thehimspiredshop@gmail.com",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "NG",
              },
            }),
          }}
        />
      </head>
      <body className={`antialiased min-h-screen flex flex-col`}>
        <ReduxProvider>
          <LoadingProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="bottom-left" richColors expand={false} />
          </LoadingProvider>
        </ReduxProvider>
        <Analytics />
      </body>
    </html>
  );
}
