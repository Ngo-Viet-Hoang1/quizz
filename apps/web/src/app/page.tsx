'use client';

import * as React from 'react';
import { createColumnHelper, SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Sparkles, Server } from 'lucide-react';
import { z } from 'zod';
import { PaginationMeta } from '@repo/shared-types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableFeatures,
} from '@/shared/components/data-table';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { isAdminRole } from '@/shared/lib/role-utils';
import { useApiForm } from '@/shared/hooks/use-api-form';
import { formatDate } from '@/shared/lib/date';

// 1. Data Type & Mock Database on Server (12 records)
export interface WorkbenchItem {
  id: string;
  title: string;
  status: 'ACTIVE' | 'REVIEW' | 'SHIPPED';
  score: number;
  author: string;
  createdAt: string;
}

const initialDatabase: WorkbenchItem[] = [
  {
    id: 'wb-001',
    title: 'Router docs & architecture',
    status: 'ACTIVE',
    score: 98,
    author: 'hoang.nv@vti.com',
    createdAt: '2026-08-16T10:30:00.000Z',
  },
  {
    id: 'wb-002',
    title: 'Query cache synchronization',
    status: 'REVIEW',
    score: 94,
    author: 'alex.dev@corp.com',
    createdAt: '2026-08-15T14:20:00.000Z',
  },
  {
    id: 'wb-003',
    title: 'Table filters & faceted search',
    status: 'SHIPPED',
    score: 91,
    author: 'sarah.ux@design.io',
    createdAt: '2026-08-14T09:15:00.000Z',
  },
  {
    id: 'wb-004',
    title: 'Virtual lists & benchmark indexing',
    status: 'ACTIVE',
    score: 88,
    author: 'hoang.nv@vti.com',
    createdAt: '2026-08-13T16:45:00.000Z',
  },
  {
    id: 'wb-005',
    title: 'Clerk Auth Webhook & RBAC',
    status: 'REVIEW',
    score: 96,
    author: 'techlead@twiliver.com',
    createdAt: '2026-08-12T11:00:00.000Z',
  },
  {
    id: 'wb-006',
    title: 'MongoDB replica index optimization',
    status: 'SHIPPED',
    score: 90,
    author: 'alex.dev@corp.com',
    createdAt: '2026-08-11T08:30:00.000Z',
  },
  {
    id: 'wb-007',
    title: 'NestJS Microservices transport',
    status: 'ACTIVE',
    score: 85,
    author: 'hoang.nv@vti.com',
    createdAt: '2026-08-10T13:15:00.000Z',
  },
  {
    id: 'wb-008',
    title: 'MinIO storage upload chunking',
    status: 'SHIPPED',
    score: 99,
    author: 'devops@infra.net',
    createdAt: '2026-08-09T17:40:00.000Z',
  },
  {
    id: 'wb-009',
    title: 'Pino structured logging trace ID',
    status: 'ACTIVE',
    score: 93,
    author: 'hoang.nv@vti.com',
    createdAt: '2026-08-08T10:05:00.000Z',
  },
  {
    id: 'wb-010',
    title: 'Turborepo caching pipeline',
    status: 'SHIPPED',
    score: 92,
    author: 'techlead@twiliver.com',
    createdAt: '2026-08-07T15:25:00.000Z',
  },
  {
    id: 'wb-011',
    title: 'Zod validation factory DTOs',
    status: 'REVIEW',
    score: 87,
    author: 'alex.dev@corp.com',
    createdAt: '2026-08-06T12:00:00.000Z',
  },
  {
    id: 'wb-012',
    title: 'Redis sliding window rate limiter',
    status: 'ACTIVE',
    score: 95,
    author: 'hoang.nv@vti.com',
    createdAt: '2026-08-05T09:50:00.000Z',
  },
  {
    id: 'wb-013',
    title: 'WebSocket live quiz state machine',
    status: 'ACTIVE',
    score: 97,
    author: 'hoang.nv@vti.com',
    createdAt: '2026-08-04T16:20:00.000Z',
  },
  {
    id: 'wb-014',
    title: 'AI question generator pipeline',
    status: 'REVIEW',
    score: 89,
    author: 'alex.dev@corp.com',
    createdAt: '2026-08-03T11:45:00.000Z',
  },
  {
    id: 'wb-015',
    title: 'Dynamic anti-cheat exam timer',
    status: 'SHIPPED',
    score: 93,
    author: 'sarah.ux@design.io',
    createdAt: '2026-08-02T14:10:00.000Z',
  },
];

// 2. Define Columns with TanStack Table v9
const columnHelper = createColumnHelper<DataTableFeatures, WorkbenchItem>();

const columns = columnHelper.columns([
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),

  columnHelper.accessor('title', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="PROJECT" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold text-foreground tracking-tight">
          {row.getValue('title')}
        </span>
        <span className="text-xs text-muted-foreground">{row.original.author}</span>
      </div>
    ),
  }),

  columnHelper.accessor('status', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="STATUS" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      if (status === 'ACTIVE') {
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono text-[11px] px-2.5 py-0.5 font-bold tracking-wider">
            ACTIVE
          </Badge>
        );
      }
      if (status === 'REVIEW') {
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-mono text-[11px] px-2.5 py-0.5 font-bold tracking-wider">
            REVIEW
          </Badge>
        );
      }
      return (
        <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 font-mono text-[11px] px-2.5 py-0.5 font-bold tracking-wider">
          SHIPPED
        </Badge>
      );
    },
  }),

  columnHelper.accessor('score', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="SCORE" />,
    cell: ({ row }) => (
      <div className="font-mono text-sm font-semibold text-foreground">{row.getValue('score')}</div>
    ),
  }),

  columnHelper.accessor('createdAt', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="CREATED" />,
    cell: ({ row }) => (
      <div className="text-xs font-mono text-muted-foreground">
        {formatDate(row.getValue('createdAt'))}
      </div>
    ),
  }),

  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48 font-mono text-xs">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(item.id);
                toast.success(`Copied ID: ${item.id}`);
              }}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info(`View details: ${item.title}`)}>
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);

// 3. Demo Form Schema
const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  score: z.number().min(0, 'Score must be 0-100').max(100, 'Score maximum is 100'),
});

type CreateItemForm = z.infer<typeof createItemSchema>;

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();
  const router = useRouter();

  // Server Database State
  const [db, setDb] = React.useState<WorkbenchItem[]>(initialDatabase);

  // Server Query Parameters
  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(5);
  const [search, setSearch] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Response Data from simulated server
  const [serverRows, setServerRows] = React.useState<WorkbenchItem[]>([]);
  const [paginationMeta, setPaginationMeta] = React.useState<PaginationMeta>({
    page: 1,
    limit: 5,
    total: initialDatabase.length,
    totalPages: Math.ceil(initialDatabase.length / 5),
  });

  React.useEffect(() => {
    if (!isLoaded || !isOrgLoaded) return;
    if (isSignedIn) {
      if (!organization) {
        router.replace('/onboarding');
      } else if (isAdminRole(membership?.role)) {
        router.replace('/dashboard');
      } else {
        router.replace('/student');
      }
    }
  }, [isLoaded, isOrgLoaded, isSignedIn, organization, membership, router]);

  // Simulated Server API call with 300ms network delay
  React.useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const timer = setTimeout(() => {
      if (isCancelled) return;

      // 1. Server-side Filtering (Search + Status)
      let filtered = [...db];
      if (search.trim()) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(query) || item.author.toLowerCase().includes(query),
        );
      }
      if (statusFilter !== 'ALL') {
        filtered = filtered.filter((item) => item.status === statusFilter);
      }

      // 2. Server-side Sorting
      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        filtered.sort((a, b) => {
          const valA = a[id as keyof WorkbenchItem];
          const valB = b[id as keyof WorkbenchItem];
          if (valA < valB) return desc ? 1 : -1;
          if (valA > valB) return desc ? -1 : 1;
          return 0;
        });
      }

      // 3. Server-side Pagination
      const total = filtered.length;
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * limit;
      const paginatedRows = filtered.slice(start, start + limit);

      setServerRows(paginatedRows);
      setPaginationMeta({
        page: safePage,
        limit,
        total,
        totalPages,
      });
      setIsLoading(false);
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [db, page, limit, search, statusFilter, sorting]);

  // useApiForm Hook Demo
  const { form, handleApiError } = useApiForm<CreateItemForm>(createItemSchema, {
    defaultValues: {
      title: '',
      score: 100,
    },
  });

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            Đang chuyển hướng đến không gian làm việc của bạn...
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values: CreateItemForm) => {
    try {
      const newItem: WorkbenchItem = {
        id: `wb-${Date.now().toString().slice(-3)}`,
        title: values.title,
        status: 'ACTIVE',
        score: values.score,
        author: 'current.user@quiz.vn',
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => [newItem, ...prev]);
      setPage(1); // Return to page 1 to see the newly created item
      form.reset();
      toast.success('Successfully created new item on server!');
    } catch (err) {
      handleApiError(err);
    }
  });

  // Bulk actions handler on server
  const handleBulkDelete = (selected: WorkbenchItem[]) => {
    const selectedIds = new Set(selected.map((item) => item.id));
    setDb((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    toast.success(`Server deleted ${selected.length} record(s) from database`);
  };

  return (
    <main className="min-h-screen bg-muted/20 p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Preview */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/90" />
                <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
              </div>
              <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
                ISSUE WORKBENCH / SERVER-SIDE DEMO
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Full simulation of NestJS Backend interaction (Server Pagination, Search, Filter &
              Sort)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1 bg-card">
              <Server className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              Server Simulation (300ms API Delay)
            </Badge>
            <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              TanStack Table v9.1
            </Badge>
          </div>
        </div>

        {/* 1. DATA TABLE WORKBENCH PREVIEW (SERVER-SIDE MODE) */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-base font-semibold">
              Server-side Data Table
            </CardTitle>
            <CardDescription className="text-xs">
              Search, tab switching, column sorting, pagination, and limit changes send requests to
              server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={serverRows}
              isLoading={isLoading}
              skeletonRowCount={limit}
              serverPagination={paginationMeta}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              pageSizeOptions={[5, 10, 15, 30, 50]}
              searchColumnId="title"
              searchPlaceholder="Search records on server..."
              searchValue={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              filterOptions={[
                { label: 'ALL', value: 'ALL' },
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'REVIEW', value: 'REVIEW' },
                { label: 'SHIPPED', value: 'SHIPPED' },
              ]}
              activeFilter={statusFilter}
              onFilterChange={(newStatus) => {
                setStatusFilter(newStatus);
                setPage(1);
              }}
              onSortChange={(newSorting) => {
                setSorting(newSorting);
              }}
              renderBulkActions={(selected) => (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-mono"
                    onClick={() => toast.info(`Exporting data for ${selected.length} record(s)...`)}
                  >
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs font-mono"
                    onClick={() => handleBulkDelete(selected)}
                  >
                    Delete Selected
                  </Button>
                </>
              )}
            />
          </CardContent>
        </Card>

        {/* 2. FORM DEMO WITH useApiForm */}
        <Card className="rounded-2xl border bg-card shadow-sm max-w-lg">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-base font-semibold">
              Quick Create Item (useApiForm Demo)
            </CardTitle>
            <CardDescription className="text-xs">
              Add new record to mock database and verify real-time table synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-foreground">Title</label>
                <Input
                  placeholder="Enter project or task title..."
                  {...form.register('title')}
                  className="rounded-xl font-mono text-sm"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive font-mono">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-foreground">
                  Score (0-100)
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  {...form.register('score', { valueAsNumber: true })}
                  className="rounded-xl font-mono text-sm"
                />
                {form.formState.errors.score && (
                  <p className="text-xs text-destructive font-mono">
                    {form.formState.errors.score.message}
                  </p>
                )}
              </div>

              <Button type="submit" size="sm" className="w-full rounded-xl gap-2 font-mono text-xs">
                <Plus className="h-4 w-4" />
                Submit & Update Table
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
