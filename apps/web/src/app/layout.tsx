import { QueryProvider } from '@/shared/lib/query-provider';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Quiz Platform',
  description: 'Enterprise AI Quiz Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ClerkProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
