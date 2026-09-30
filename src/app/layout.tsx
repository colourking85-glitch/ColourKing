import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Colourking',
  description: 'Autospuitbedrijf Colour King — Rotterdam',
  manifest: '/manifest.json',
  themeColor: '#dc2626',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CK Inspect',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className={`${inter.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
