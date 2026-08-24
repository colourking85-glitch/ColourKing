import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Colourking',
  description: 'Vakkundige lakschadeverstelling — Amsterdam',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="dark">
      <body>{children}</body>
    </html>
  );
}
