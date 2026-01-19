import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { ToastProvider } from "@/components/ui/Toast";
import { GlobalJobPoller } from "@/components/GlobalJobPoller";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://mi70.digirepub.com'),
  title: "米70 (MI70) | 智绘米其林级别美食大片",
  description: "发现食物的艺术之美。MI70 采用最前沿 AI 技术，让您的每一合普通美食照片瞬间进化为米其林级摄影杰作。",
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon.png',
    },
  },
  openGraph: {
    title: '米70 (MI70) - 智绘美食艺术新巅峰',
    description: '每一张照片，都是一份米其林邀约。点击开启 AI 美食艺术重绘之旅。',
    images: ['/og-image.jpg'],
  },
  appleWebApp: {
    title: '米70 智绘',
    statusBarStyle: 'black-translucent',
    startupImage: ['/apple-touch-icon.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        {/* Preload critical small logo */}
        <link rel="preload" href="/assets/styles/logo_mi70_small.webp" as="image" type="image/webp" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`} style={{ backgroundColor: '#000000', color: '#ffffff' }} suppressHydrationWarning>
        <NextTopLoader
          color="#D4AF37"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #D4AF37,0 0 5px #D4AF37"
        />
        <ToastProvider>
          <Providers>
            {children}
            <GlobalJobPoller />
          </Providers>
        </ToastProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('[SW] Registered:', reg.scope))
                    .catch(err => console.log('[SW] Registration failed:', err));
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
