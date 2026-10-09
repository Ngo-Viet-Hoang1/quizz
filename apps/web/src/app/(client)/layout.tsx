import React from 'react';

export const metadata = {
  title: 'Quiz Live Room',
  description: 'Interactive real-time quiz live room for host and students',
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {children}
    </div>
  );
}
