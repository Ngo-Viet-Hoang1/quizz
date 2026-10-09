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
  Search,
  School,
  Loader2,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { isAdminRole, getRoleLabel } from '@/shared/lib/role-utils';
import {
  PublicOrganization,
  useOrganizationsApi,
} from '@/features/organizations/api/organizations.api';

const PAGE_SIZE = 3;

export function WorkspaceRoleSelector() {
  const router = useRouter();
  const { openCreateOrganization } = useClerk();
  const { organization: activeOrg } = useOrganization();
  const orgsApi = useOrganizationsApi();

  const {
    userMemberships,
    setActive,
    isLoaded: isListLoaded,
  } = useOrganizationList({
    userMemberships: {
      infinite: true,
      pageSize: PAGE_SIZE,
    },
  });

  const [activeTab, setActiveTab] = React.useState<'MY_ORGS' | 'EXPLORE'>('MY_ORGS');
  const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null);

  const [visibleMemberCount, setVisibleMemberCount] = React.useState(PAGE_SIZE);
  const [visiblePublicCount, setVisiblePublicCount] = React.useState(PAGE_SIZE);

  const [publicOrgs, setPublicOrgs] = React.useState<PublicOrganization[]>([]);
  const [publicPage, setPublicPage] = React.useState(1);
  const [hasMorePublic, setHasMorePublic] = React.useState(false);
  const [isLoadingPublic, setIsLoadingPublic] = React.useState(false);
  const [isLoadingMorePublic, setIsLoadingMorePublic] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [joiningOrgId, setJoiningOrgId] = React.useState<string | null>(null);

  const scrollContainerMembersRef = React.useRef<HTMLDivElement | null>(null);
  const loadMoreMembershipsRef = React.useRef<HTMLDivElement | null>(null);

  const scrollContainerPublicRef = React.useRef<HTMLDivElement | null>(null);
  const loadMorePublicRef = React.useRef<HTMLDivElement | null>(null);

  const orgList = userMemberships.data ?? [];
  const hasNoOrgs = isListLoaded && orgList.length === 0;

  const displayedMemberships = orgList.slice(0, visibleMemberCount);
  const displayedPublicOrgs = publicOrgs.slice(0, visiblePublicCount);

  React.useEffect(() => {
    if (isListLoaded && orgList.length === 0) {
      setActiveTab('EXPLORE');
    }
  }, [isListLoaded, orgList.length]);

  React.useEffect(() => {
    if (activeTab === 'EXPLORE' || hasNoOrgs) {
      let isMounted = true;
      setIsLoadingPublic(true);
      setPublicPage(1);
      setVisiblePublicCount(PAGE_SIZE);

      const delayDebounce = setTimeout(() => {
        orgsApi
          .getPublicOrganizations(searchQuery, 1, PAGE_SIZE)
          .then((res) => {
            if (isMounted) {
              setPublicOrgs(res.data || []);
              setHasMorePublic(res.hasMore);
            }
          })
          .catch(() => {
            if (isMounted) {
              setPublicOrgs([]);
              setHasMorePublic(false);
            }
          })
          .finally(() => {
            if (isMounted) {
              setIsLoadingPublic(false);
            }
          });
      }, 250);

      return () => {
        isMounted = false;
        clearTimeout(delayDebounce);
      };
    }
  }, [activeTab, searchQuery, hasNoOrgs]);

  const handleLoadMorePublic = React.useCallback(async () => {
    if (visiblePublicCount < publicOrgs.length) {
      setVisiblePublicCount((prev) => prev + PAGE_SIZE);
      return;
    }

    if (isLoadingMorePublic || !hasMorePublic) return;

    try {
      setIsLoadingMorePublic(true);
      const nextPage = publicPage + 1;
      const res = await orgsApi.getPublicOrganizations(searchQuery, nextPage, PAGE_SIZE);

      setPublicOrgs((prev) => {
        const existingIds = new Set(prev.map((o) => o._id));
        const newItems = (res.data || []).filter((o) => !existingIds.has(o._id));
        return [...prev, ...newItems];
      });
      setPublicPage(nextPage);
      setVisiblePublicCount((prev) => prev + PAGE_SIZE);
      setHasMorePublic(res.hasMore);
    } catch {
      toast.error('Failed to load more schools.');
    } finally {
      setIsLoadingMorePublic(false);
    }
  }, [
    hasMorePublic,
    isLoadingMorePublic,
    publicOrgs.length,
    publicPage,
    searchQuery,
    visiblePublicCount,
    orgsApi,
  ]);

  const handleLoadMoreMemberships = React.useCallback(() => {
    if (visibleMemberCount < orgList.length) {
      setVisibleMemberCount((prev) => prev + PAGE_SIZE);
    } else if (userMemberships.hasNextPage && !userMemberships.isFetching) {
      userMemberships.fetchNext();
      setVisibleMemberCount((prev) => prev + PAGE_SIZE);
    }
  }, [orgList.length, userMemberships, visibleMemberCount]);

  React.useEffect(() => {
    if (activeTab !== 'MY_ORGS') return;

    const container = scrollContainerMembersRef.current;
    const sentinel = loadMoreMembershipsRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMoreMemberships();
        }
      },
      { root: container, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, handleLoadMoreMemberships, displayedMemberships.length]);

  React.useEffect(() => {
    if (activeTab !== 'EXPLORE' && !hasNoOrgs) return;

    const container = scrollContainerPublicRef.current;
    const sentinel = loadMorePublicRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMorePublic();
        }
      },
      { root: container, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, handleLoadMorePublic, hasNoOrgs, displayedPublicOrgs.length]);

  if (!isListLoaded) {
    return (
      <div className="w-full max-w-xl space-y-4">
        <div className="h-24 rounded-2xl bg-muted/60 animate-pulse border shadow-2xs" />
        <div className="h-24 rounded-2xl bg-muted/60 animate-pulse border shadow-2xs" />
        <div className="h-24 rounded-2xl bg-muted/60 animate-pulse border shadow-2xs" />
      </div>
    );
  }

  const handleSelectPortal = async (
    orgId: string,
    orgName: string,
    role: string,
    targetPortal: 'ADMIN' | 'STUDENT',
  ) => {
    try {
      setIsSubmitting(`${orgId}-${targetPortal}`);

      const hasAdminRights = isAdminRole(role);

      if (targetPortal === 'ADMIN' && !hasAdminRights) {
        toast.warning(`You are a Student in "${orgName}". Redirecting to Student Portal.`);
      }

      if (setActive && orgId !== activeOrg?.id) {
        await setActive({ organization: orgId });
      }

      const destination = targetPortal === 'ADMIN' && hasAdminRights ? '/dashboard' : '/student';

      toast.success(`Selected organization "${orgName}" as ${getRoleLabel(role)}`);
      router.push(destination);
    } catch {
      toast.error('Failed to switch workspace.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleJoinSchool = async (org: PublicOrganization) => {
    try {
      setJoiningOrgId(org._id);
      const res = await orgsApi.joinAsStudent(org._id);

      if (res.success) {
        toast.success(`Joined "${org.name}" successfully!`);

        if (userMemberships.revalidate) {
          await userMemberships.revalidate();
        }

        if (setActive) {
          await setActive({ organization: org._id });
        }

        router.push('/student');
      }
    } catch {
      toast.error(`Failed to join "${org.name}". Please try again.`);
    } finally {
      setJoiningOrgId(null);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6 animate-in fade-in-50 duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          <Sparkles className="size-3.5" />
          <span>WORKSPACE ACCESS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {hasNoOrgs ? 'Select School & Organization' : 'Select Organization & Portal'}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          {hasNoOrgs
            ? 'Find your school below to join as a Student and start taking quizzes.'
            : 'Access permissions (Admin / Teacher or Student) will be automatically applied based on your selected organization.'}
        </p>
      </div>

      {!hasNoOrgs && (
        <div className="flex items-center justify-center gap-1.5 p-1 bg-muted/70 rounded-2xl border max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('MY_ORGS')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'MY_ORGS'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Organizations ({orgList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EXPLORE')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'EXPLORE'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass className="size-3.5 text-primary" />
            <span>Explore</span>
          </button>
        </div>
      )}

      {activeTab === 'EXPLORE' || hasNoOrgs ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schools or organizations by name..."
              className="pl-10 h-11 rounded-2xl bg-card border-border/80 shadow-2xs font-medium text-sm"
            />
          </div>

          {isLoadingPublic ? (
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-muted/60 animate-pulse border shadow-2xs" />
              <div className="h-24 rounded-2xl bg-muted/60 animate-pulse border shadow-2xs" />
              <div className="h-24 rounded-2xl bg-muted/60 animate-pulse border shadow-2xs" />
            </div>
          ) : displayedPublicOrgs.length === 0 ? (
            <Card className="rounded-3xl border border-dashed p-8 text-center bg-muted/20">
              <School className="size-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-extrabold text-base text-foreground">
                {searchQuery ? 'No matching schools found' : 'No organizations available'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-sm mx-auto">
                {searchQuery
                  ? 'Please check your search keyword or create a new organization.'
                  : 'Create the first organization if you are a Teacher or Administrator.'}
              </p>
              <Button
                onClick={() => openCreateOrganization?.()}
                className="rounded-2xl gap-2 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              >
                <Plus className="size-4" />
                <span>Create New Organization</span>
              </Button>
            </Card>
          ) : (
            <div
              ref={scrollContainerPublicRef}
              className="max-h-[350px] overflow-y-auto space-y-3 pr-1.5 scroll-smooth"
            >
              {displayedPublicOrgs.map((org) => {
                const isAlreadyMember = orgList.some((m) => m.organization.id === org._id);
                const initial = org.name?.[0]?.toUpperCase() || 'S';
                const isJoining = joiningOrgId === org._id;

                return (
                  <Card
                    key={org._id}
                    className="rounded-2xl border border-border/70 hover:border-primary/50 bg-card p-4 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-10 rounded-xl border shadow-xs shrink-0">
                          {org.logoUrl && <AvatarImage src={org.logoUrl} alt={org.name} />}
                          <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-extrabold text-xs">
                            {initial}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h3 className="font-extrabold text-sm text-foreground truncate">
                            {org.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="bg-muted/60 text-muted-foreground border-border/80 text-[10px] font-semibold"
                            >
                              School
                            </Badge>
                            {isAlreadyMember && (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                <span>Joined</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isAlreadyMember ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              const mem = orgList.find((m) => m.organization.id === org._id);
                              if (mem) {
                                handleSelectPortal(org._id, org.name, mem.role, 'STUDENT');
                              }
                            }}
                            className="rounded-xl font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            <GraduationCap className="size-3.5" />
                            <span>Enter Student Portal</span>
                            <ArrowRight className="size-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isJoining}
                            onClick={() => handleJoinSchool(org)}
                            className="rounded-xl font-bold text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                          >
                            {isJoining ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Joining...</span>
                              </>
                            ) : (
                              <>
                                <GraduationCap className="size-3.5" />
                                <span>Join</span>
                                <ArrowRight className="size-3.5" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

              <div ref={loadMorePublicRef} className="py-2 text-center">
                {isLoadingMorePublic && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>Loading more...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : displayedMemberships.length === 0 ? (
        <Card className="rounded-3xl border border-dashed p-8 text-center bg-muted/20">
          <Building2 className="size-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-extrabold text-base text-foreground">
            You have not joined any organization yet
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-sm mx-auto">
            Switch to the Explore tab to find your school or create a new organization.
          </p>
          <Button
            onClick={() => openCreateOrganization?.()}
            className="rounded-2xl gap-2 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          >
            <Plus className="size-4" />
            <span>Create Organization</span>
          </Button>
        </Card>
      ) : (
        <div
          ref={scrollContainerMembersRef}
          className="max-h-[350px] overflow-y-auto space-y-3 pr-1.5 scroll-smooth"
        >
          {displayedMemberships.map((mem) => {
            const org = mem.organization;
            const role = mem.role;
            const hasAdminRights = isAdminRole(role);
            const isActive = org.id === activeOrg?.id;
            const initial = org.name?.[0]?.toUpperCase() || 'O';

            return (
              <Card
                key={org.id}
                className={`rounded-2xl border transition-all overflow-hidden p-4 ${
                  isActive
                    ? 'border-indigo-500/60 ring-2 ring-indigo-500/20 bg-card shadow-md'
                    : 'border-border/60 hover:border-primary/40 bg-card/70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <Avatar className="size-10 rounded-xl border shadow-xs shrink-0">
                      {org.imageUrl && <AvatarImage src={org.imageUrl} alt={org.name} />}
                      <AvatarFallback className="rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                        {initial}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-foreground truncate">
                          {org.name}
                        </h3>
                        {isActive && (
                          <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            <span>Active</span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {hasAdminRights ? (
                          <Badge
                            variant="outline"
                            className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[10px] gap-1 font-bold"
                          >
                            <ShieldCheck className="size-3 text-indigo-600" />
                            Admin / Teacher
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] gap-1 font-bold"
                          >
                            <GraduationCap className="size-3 text-emerald-600" />
                            Student
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
                    {hasAdminRights ? (
                      <Button
                        size="sm"
                        disabled={isSubmitting === `${org.id}-ADMIN`}
                        onClick={() => handleSelectPortal(org.id, org.name, role, 'ADMIN')}
                        className="rounded-xl font-bold text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      >
                        <ShieldCheck className="size-3.5" />
                        <span>Admin / Teacher Portal</span>
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
                        <span>Student Portal</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          <div ref={loadMoreMembershipsRef} className="py-2 text-center">
            {userMemberships.isFetching && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p className="font-medium">
          Are you an Instructor or Administrator looking to create a school?
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openCreateOrganization?.()}
          className="rounded-xl font-bold text-xs gap-1.5 border-dashed"
        >
          <Plus className="size-3.5" />
          <span>Create New Organization</span>
        </Button>
      </div>
    </div>
  );
}
