'use client';

import { ArrowRight, Gamepad2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function DashboardHero() {
  const router = useRouter();
  const [pin, setPin] = useState('');

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\D/g, '');
    if (!cleanPin) {
      toast.error('Please enter a valid Game PIN.');
      return;
    }
    if (cleanPin.length < 6) {
      toast.error('Game PIN must be 6 digits.');
      return;
    }
    router.push(`/room/play?pin=${cleanPin}`);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-10 shadow-lg border border-slate-800">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 -mt-12 size-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-12 size-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 tracking-wide uppercase">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          Student Learning Portal
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          Welcome back! 👋 <br />
          <span className="text-sky-300 font-bold">Ready to practice and excel in your exams?</span>
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto font-normal">
          Explore organization classes, practice quizzes, or enter a live room PIN to compete with
          your classmates!
        </p>

        {/* Live Game PIN Join Widget */}
        <div className="pt-2 max-w-md mx-auto">
          <form
            onSubmit={handleJoinRoom}
            className="flex flex-col sm:flex-row items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-white/15 shadow-inner"
          >
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Gamepad2 className="size-5 text-sky-400" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit Game PIN..."
                className="w-full pl-10 pr-3 py-2.5 bg-transparent text-white placeholder-slate-400 text-sm font-semibold tracking-wider focus:outline-none focus:ring-0"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Join Room
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
