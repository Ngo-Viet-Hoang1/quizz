'use client';

export function DashboardHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-10 shadow-lg border border-slate-800">
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 tracking-wide uppercase">
          Student Learning Portal
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          Welcome back! 👋 <br />
          <span className="text-sky-300 font-bold">Ready to practice and excel in your exams?</span>
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto font-normal">
          Explore organization classes and practice examination quizzes to improve your skills.
        </p>
      </div>
    </div>
  );
}
