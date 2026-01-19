import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://mi70.digirepub.com'),
  title: "米70 - 高端美食摄影工坊",
  description: "将普通食物照片转化为米其林级艺术大片",
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
    title: '米70 (MI70) - AI Fine Dining Art',
    description: 'Transform your food photos into Michelin-star masterpieces with AI.',
    images: ['/og-image.jpg'],
  },
  appleWebApp: {
    title: '米70',
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
    <html lang="en" suppressHydrationWarning>
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
