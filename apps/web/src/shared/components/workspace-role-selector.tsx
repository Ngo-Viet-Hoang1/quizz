'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useOrganization, useOrganizationList } from '@clerk/nextjs';
import {
  Building2,
  CheckCircle2,
  GraduationCap,
  Plus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { isAdminRole, getRoleLabel } from '@/shared/lib/role-utils';

export function WorkspaceRoleSelector() {
  const router = useRouter();
  const { openCreateOrganization } = useClerk();
  const { organization: activeOrg } = useOrganization();
  const {
    userMemberships,
    setActive,
    isLoaded: isListLoaded,
  } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  const [activeTab, setActiveTab] = React.useState<'ALL' | 'ADMIN' | 'STUDENT'>('ALL');
  const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null);

  if (!isListLoaded) {
    return (
      <div className="w-full max-w-xl space-y-4">
        <div className="h-28 rounded-2xl bg-muted/60 animate-pulse border shadow-2xs" />
        <div className="h-28 rounded-2xl bg-muted/60 animate-pulse border shadow-2xs" />
      </div>
    );
  }

  const orgList = userMemberships.data ?? [];

  // Filter organizations based on tab
  const filteredOrgs = orgList.filter((mem) => {
    if (activeTab === 'ADMIN') return isAdminRole(mem.role);
    if (activeTab === 'STUDENT') return !isAdminRole(mem.role);
    return true;
  });

  const handleSelectPortal = async (
    orgId: string,
    orgName: string,
    role: string,
    targetPortal: 'ADMIN' | 'STUDENT',
  ) => {
    try {
      setIsSubmitting(`${orgId}-${targetPortal}`);

      // Check role authorization if target is ADMIN
      const hasAdminRights = isAdminRole(role);

      if (targetPortal === 'ADMIN' && !hasAdminRights) {
        toast.warning(
          `Bạn là Student trong "${orgName}". Hệ thống đang chuyển đến Student Portal.`,
        );
      }

      // Switch active organization in Clerk if different
      if (setActive && orgId !== activeOrg?.id) {
        await setActive({ organization: orgId });
      }

      const destination = targetPortal === 'ADMIN' && hasAdminRights ? '/dashboard' : '/student';

      toast.success(`Đã chọn tổ chức "${orgName}" với vai trò ${getRoleLabel(role)}`);
      router.push(destination);
    } catch (err) {
      toast.error('Có lỗi xảy ra khi chuyển không gian làm việc.');
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          <Sparkles className="size-3.5" />
          <span>PHÂN QUYỀN HỆ THỐNG</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Chọn Tổ chức & Cổng làm việc
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Quyền hạn (Admin / Teacher hoặc Student) sẽ được tự động áp dụng chính xác theo tổ chức
          bạn chọn.
        </p>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center justify-center gap-1.5 p-1 bg-muted/70 rounded-2xl border max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'ALL'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Tất cả ({orgList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ADMIN')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'ADMIN'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="size-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Admin / Teacher</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('STUDENT')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'STUDENT'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Student</span>
        </button>
      </div>

      {/* Empty State */}
      {filteredOrgs.length === 0 ? (
        <Card className="rounded-3xl border border-dashed p-8 text-center bg-muted/20">
          <Building2 className="size-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-extrabold text-base text-foreground">Không tìm thấy tổ chức</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-sm mx-auto">
            {orgList.length === 0
              ? 'Bạn chưa tham gia tổ chức nào. Tạo tổ chức đầu tiên để bắt đầu sử dụng!'
              : 'Không có tổ chức nào phù hợp với bộ lọc được chọn.'}
          </p>
          <Button
            onClick={() => openCreateOrganization?.()}
            className="rounded-2xl gap-2 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          >
            <Plus className="size-4" />
            <span>Tạo tổ chức mới</span>
          </Button>
        </Card>
      ) : (
        /* Workspace List */
        <div className="space-y-4">
          {filteredOrgs.map((mem) => {
            const org = mem.organization;
            const role = mem.role;
            const hasAdminRights = isAdminRole(role);
            const isActive = org.id === activeOrg?.id;
            const initial = org.name?.[0]?.toUpperCase() || 'O';

            return (
              <Card
                key={org.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isActive
                    ? 'border-indigo-500/60 ring-2 ring-indigo-500/20 bg-card shadow-md'
                    : 'border-border/60 hover:border-primary/40 bg-card/70'
                }`}
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Org Info & Role Badge */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <Avatar className="size-11 rounded-2xl border shadow-xs shrink-0">
                      {org.imageUrl && <AvatarImage src={org.imageUrl} alt={org.name} />}
                      <AvatarFallback className="rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm">
                        {initial}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base text-foreground truncate">
                          {org.name}
                        </h3>
                        {isActive && (
                          <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            <span>Đang chọn</span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {hasAdminRights ? (
                          <Badge
                            variant="outline"
                            className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[11px] gap-1 font-bold"
                          >
                            <ShieldCheck className="size-3 text-indigo-600" />
                            Admin / Teacher
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] gap-1 font-bold"
                          >
                            <GraduationCap className="size-3 text-emerald-600" />
                            Student
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Portal Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
                    {hasAdminRights ? (
                      <Button
                        size="sm"
                        disabled={isSubmitting === `${org.id}-ADMIN`}
                        onClick={() => handleSelectPortal(org.id, org.name, role, 'ADMIN')}
                        className="rounded-xl font-bold text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      >
                        <ShieldCheck className="size-3.5" />
                        <span>Vào Admin / Teacher</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isSubmitting === `${org.id}-STUDENT`}
                        onClick={() => handleSelectPortal(org.id, org.name, role, 'STUDENT')}
                        className="rounded-xl font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <GraduationCap className="size-3.5" />
                        <span>Vào Student</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p className="font-medium">Cần quản lý hoặc tạo thêm lớp học/tổ chức mới?</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openCreateOrganization?.()}
          className="rounded-xl font-bold text-xs gap-1.5 border-dashed"
        >
          <Plus className="size-3.5" />
          <span>Tạo tổ chức mới</span>
        </Button>
      </div>
    </div>
  );
}
