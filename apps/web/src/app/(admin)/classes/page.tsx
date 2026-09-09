import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/shared/lib/server-api-client';
import { classKeys } from '@/features/classes/api';
import { ClassesListView } from '@/features/classes/components';
import { ClassItem, DEFAULT_CLASS_PARAMS } from '@/features/classes';

export const metadata = {
  title: 'Classes & Groups | AIQuizz Admin',
  description: 'Manage classrooms, student enrollments, and quiz assignments',
};

export default async function ClassesPage() {
  const queryClient = new QueryClient();
  const { orgId } = await auth();

  if (orgId) {
    try {
      await queryClient.prefetchQuery({
        queryKey: classKeys.list(DEFAULT_CLASS_PARAMS),
        queryFn: () =>
          serverApiClient.get<ClassItem[]>('/classes', {
            params: DEFAULT_CLASS_PARAMS,
          }),
      });
    } catch (error) {
      console.warn('[ClassesPage] Server prefetch skipped:', error);
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClassesListView />
    </HydrationBoundary>
  );
}
