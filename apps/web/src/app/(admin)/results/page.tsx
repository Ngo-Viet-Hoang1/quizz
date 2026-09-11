import { ResultsView } from '@/features/results';

export const metadata = {
  title: 'Results & Gradebook | Quiz Platform',
  description:
    'Manage class examination results, inspect student scorecards, and audit submission integrity.',
};

export default function ResultsPage() {
  return <ResultsView />;
}
