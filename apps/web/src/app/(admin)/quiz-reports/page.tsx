import { QuizReportsTable } from '@/features/quiz-reports';

export const metadata = {
  title: 'Quiz Reports | AIQuizz',
  description: 'Manage and resolve student question discrepancy reports',
};

export default function QuizReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Quiz Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and resolve student question discrepancy reports.
          </p>
        </div>
      </div>

      {/* Shared DataTable */}
      <QuizReportsTable />
    </div>
  );
}
