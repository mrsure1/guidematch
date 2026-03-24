import type { Metadata } from "next";
import { headers } from "next/headers";
import AnalyticsScripts from "@/components/analytics/AnalyticsScripts";
import { Footer } from "@/components/layout/Footer";
import { ChannelTalk } from "@/components/support/ChannelTalk";
import { GlobalChatbotDock } from "@/components/support/GlobalChatbotDock";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import "./globals.css";

const siteUrl = "https://tourguide2-five.vercel.app";
const ogImage = `${siteUrl}/hero-korea.png`;

export const metadata: Metadata = {
  title: "GuideMatch - Find your perfect guide in Korea",
  description: "Experience Korea with local experts who share your language and interests.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = await getDictionary(locale);
  const headerStore = await headers();
  const internalPath = headerStore.get("x-guidematch-path") ?? "";
  const hideGlobalChrome =
    internalPath === "/embed/chatbot" || internalPath.startsWith("/embed/chatbot/");

  return (
    <html lang={locale}>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50">
        <LocaleProvider locale={locale} messages={messages}>
          <AnalyticsScripts />
          {children}
          {!hideGlobalChrome ? <Footer /> : null}
          {!hideGlobalChrome ? <ChannelTalk /> : null}
          {!hideGlobalChrome ? <GlobalChatbotDock /> : null}
        </LocaleProvider>
      </body>
    </html>
  );
}
