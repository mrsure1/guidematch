import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Vercel에서 웹 번들이 잡히지 않도록 Node 런타임용 패키지 해석 */
  serverExternalPackages: ["@google/genai"],
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/favicon.png", permanent: true }];
  },
  /** API 라우트에서 fs로 읽는 파일을 서버리스 번들에 포함 */
  outputFileTracingIncludes: {
    "/api/chatbot/chat": [
      "./ChatBot/faq_data.csv",
      "./ChatBot/faq_data_english.csv",
      "./lib/chatbot/site-corpus.json",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
