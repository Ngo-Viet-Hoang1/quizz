import { Metadata } from 'next';
import { AnalyticsView } from '@/features/results';

export const metadata: Metadata = {
  title: 'Analytics & Insights | QuizAI',
  description: 'Exam analytics, score distributions, and learning gap detection.',
};

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
