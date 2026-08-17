export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center p-4 sm:p-6 md:p-8 bg-background selection:bg-primary/20">
      {/* Ambient background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-40%] left-[50%] translate-x-[50%] h-125 w-125 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      </div>
      <div className="w-full max-w-md flex justify-center">{children}</div>
    </main>
  );
}
