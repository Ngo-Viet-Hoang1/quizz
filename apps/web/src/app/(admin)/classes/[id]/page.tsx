import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { classKeys } from '@/features/classes/api';
import { ClassDetailView } from '@/features/classes/components';
import { ClassItem } from '@/features/classes';
import { serverApiClient } from '@/shared/lib/server-api-client';

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id } = await params;

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: classKeys.detail(id),
      queryFn: () => serverApiClient.get<ClassItem>(`/classes/${id}`),
    });
  } catch (error) {
    console.warn('[ClassDetailPage] Server prefetch skipped:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClassDetailView classId={id} />
    </HydrationBoundary>
  );
}
