import type { Metadata } from "next";
import AnalyticsScripts from "@/components/analytics/AnalyticsScripts";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const siteName = "Korea Guide Match";
const siteTitle = `${siteName} - Premium Korea Travel Guide Matching`;
const siteDescription =
  "Connect with trusted local Korean guides for personalized tours and seamless bookings.";
const ogImage = `${siteUrl}/hero-korea.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: `${siteName} preview image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50">
        <AnalyticsScripts />
        {children}
      </body>
    </html>
  );
}
