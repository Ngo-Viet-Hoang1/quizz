'use client';

import {
  useAllClasses,
  useEnrolledClasses,
  useJoinClass,
} from '@/features/student-portal/api/student.api';
import { ClassCard } from '@/features/student-portal/components/common/class-card';
import { SimplePagination } from '@/features/student-portal/components/common/simple-pagination';
import type { IClass } from '@/features/student-portal/types';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Search, Users2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StudentClassesPage() {
  const [activeTab, setActiveTab] = useState<'ENROLLED' | 'BROWSE'>('ENROLLED');

  const [enrolledPage, setEnrolledPage] = useState(1);
  const { data: enrolledResponse, isLoading: isEnrolledLoading } = useEnrolledClasses({
    page: enrolledPage,
    limit: 6,
  });
  const enrolledClasses: IClass[] = enrolledResponse?.data ?? [];
  const enrolledTotalPages = enrolledResponse?.meta?.totalPages ?? 1;

  const [browsePage, setBrowsePage] = useState(1);
  const [browseSearch, setBrowseSearch] = useState('');
  const { data: allResponse, isLoading: isAllLoading } = useAllClasses({
    page: browsePage,
    limit: 6,
    search: browseSearch || undefined,
  });
  const allClasses: IClass[] = allResponse?.data ?? [];
  const browseTotalPages = allResponse?.meta?.totalPages ?? 1;

  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);
  const joinMutation = useJoinClass();
  const handleJoin = (classId: string) => {
    setJoiningClassId(classId);
    joinMutation.mutate(classId, {
      onSuccess: () => {
        toast.success('Yêu cầu tham gia đã được gửi! Đang chờ giáo viên duyệt.');
        setJoiningClassId(null);
      },
      onError: (err) => {
        toast.error(err.message || 'Không thể gửi yêu cầu tham gia.');
        setJoiningClassId(null);
      },
    });
  };

  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-44 rounded-2xl bg-muted/40 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Class Management
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Browse organization classes and participate in courses
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {(['ENROLLED', 'BROWSE'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl font-semibold text-xs ${
              activeTab === tab
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ENROLLED' ? 'My Enrolled Classes' : 'All Organization Classes'}
          </Button>
        ))}
      </div>

      {/* ═══ TAB: My Enrolled Classes ═══ */}
      {activeTab === 'ENROLLED' && (
        <div className="space-y-6">
          {isEnrolledLoading ? (
            <SkeletonGrid />
          ) : enrolledClasses.length === 0 ? (
            <Card className="rounded-2xl border border-dashed p-10 text-center bg-muted/20">
              <Users2 className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="text-base font-bold text-foreground">No enrolled classes yet</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-sm mx-auto">
                Explore classes in your organization and join to start viewing assignments &amp;
                quiz exams.
              </p>
              <div className="flex items-center justify-center">
                <Button
                  onClick={() => setActiveTab('BROWSE')}
                  className="rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
                >
                  Browse Organization Classes
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrolledClasses.map((cls) => (
                <ClassCard
                  key={cls._id}
                  cls={{ ...cls, membershipStatus: 'active' }}
                  enrolledClasses={enrolledClasses}
                />
              ))}
            </div>
          )}

          <SimplePagination
            page={enrolledPage}
            totalPages={enrolledTotalPages}
            onPageChange={setEnrolledPage}
          />
        </div>
      )}

      {/* ═══ TAB: Browse All Organization Classes ═══ */}
      {activeTab === 'BROWSE' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={browseSearch}
              onChange={(e) => {
                setBrowseSearch(e.target.value);
                setBrowsePage(1);
              }}
              placeholder="Search classes by name..."
              className="pl-10 h-10 rounded-xl bg-card border-border/80 shadow-2xs font-medium text-xs sm:text-sm"
            />
          </div>

          {isAllLoading ? (
            <SkeletonGrid />
          ) : allClasses.length === 0 ? (
            <Card className="rounded-2xl border border-dashed p-8 text-center bg-muted/20">
              <Users2 className="size-10 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-bold text-sm text-foreground">
                {browseSearch
                  ? 'No classes match your search'
                  : 'No classes available in this organization yet'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {browseSearch
                  ? 'Try different keywords to find classes.'
                  : 'Instructors have not created any classes in this organization yet.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allClasses.map((cls) => (
                <ClassCard
                  key={cls._id}
                  cls={cls}
                  enrolledClasses={enrolledClasses}
                  onJoin={handleJoin}
                  isJoining={joiningClassId === cls._id}
                />
              ))}
            </div>
          )}

          <SimplePagination
            page={browsePage}
            totalPages={browseTotalPages}
            onPageChange={setBrowsePage}
          />
        </div>
      )}
    </div>
  );
}
