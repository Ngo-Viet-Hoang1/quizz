import type { Metadata } from 'next';
import { QueryProvider } from '@/shared/lib/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quiz App',
  description: 'Enterprise Monorepo Next.js + NestJS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
