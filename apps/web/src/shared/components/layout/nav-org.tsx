'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useOrganization, useOrganizationList } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { Building2, Check, ChevronsUpDown, Plus, Settings } from 'lucide-react';

export function NavOrg() {
  const router = useRouter();
  const { openOrganizationProfile, openCreateOrganization } = useClerk();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const {
    userMemberships,
    setActive,
    isLoaded: isListLoaded,
  } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  if (!isOrgLoaded || !isListLoaded) {
    return (
      <div className="flex h-16 w-full min-w-0 items-center justify-center border-b border-sidebar-border px-2">
        <div className="h-10 w-full rounded-lg bg-muted/60 animate-pulse border shadow-2xs" />
      </div>
    );
  }

  const handleSelectOrg = async (orgId: string) => {
    if (orgId === organization?.id) return;
    if (setActive) {
      await setActive({ organization: orgId });
      router.push('/dashboard');
    }
  };

  const initial = organization?.name?.[0]?.toUpperCase() || 'O';
  const orgList = userMemberships.data ?? [];

  return (
    <div className="flex h-16 w-full min-w-0 items-center justify-center border-b border-sidebar-border px-2">
      <DropdownMenu>
        {/* Tooltip wraps Trigger so when collapsed it shows Org Name on hover */}
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      'flex h-10 w-full min-w-0 items-center gap-2.5 rounded-lg border border-sidebar-border/60 bg-sidebar p-2 text-left shadow-2xs transition-colors hover:bg-sidebar-accent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                      'group-data-[collapsed=true]/sidebar:size-9 group-data-[collapsed=true]/sidebar:p-0 group-data-[collapsed=true]/sidebar:justify-center',
                    )}
                  >
                    {/* Organization Avatar */}
                    <Avatar className="size-6 shrink-0 rounded-md border">
                      {organization?.imageUrl && (
                        <AvatarImage src={organization.imageUrl} alt={organization.name} />
                      )}
                      <AvatarFallback className="rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                        {initial}
                      </AvatarFallback>
                    </Avatar>

                    {/* Organization Info: auto hidden when collapsed via CSS */}
                    <div className="flex-1 min-w-0 overflow-hidden group-data-[collapsed=true]/sidebar:hidden">
                      <div className="truncate text-xs font-semibold text-sidebar-foreground">
                        {organization?.name || 'Select Organization'}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">Workspace</div>
                    </div>

                    {/* Chevron: auto hidden when collapsed */}
                    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground group-data-[collapsed=true]/sidebar:hidden" />
                  </button>
                }
              />
            }
          />
          <TooltipContent side="right" align="center">
            <span>{organization?.name || 'Select Organization'}</span>
          </TooltipContent>
        </Tooltip>

        {/* Dropdown Menu Content: works in both expanded & collapsed states */}
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="w-60 rounded-xl border p-1 shadow-lg"
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Organizations
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {orgList.map((mem) => {
            const isSelected = mem.organization.id === organization?.id;
            const itemInitial = mem.organization.name?.[0]?.toUpperCase() || 'O';

            return (
              <DropdownMenuItem
                key={mem.organization.id}
                onClick={() => handleSelectOrg(mem.organization.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer transition-colors',
                  isSelected && 'bg-accent font-semibold text-accent-foreground',
                )}
              >
                <Avatar className="size-5 shrink-0 rounded-md border">
                  {mem.organization.imageUrl && (
                    <AvatarImage src={mem.organization.imageUrl} alt={mem.organization.name} />
                  )}
                  <AvatarFallback className="rounded-md bg-muted text-[10px] font-bold">
                    {itemInitial}
                  </AvatarFallback>
                </Avatar>

                <span className="flex-1 truncate">{mem.organization.name}</span>

                {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
              </DropdownMenuItem>
            );
          })}

          {orgList.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Building2 className="size-4" />
              <span>No organizations found</span>
            </div>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => openOrganizationProfile?.()}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer"
          >
            <Settings className="size-4 text-muted-foreground" />
            <span>Manage organization</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => openCreateOrganization?.()}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer"
          >
            <Plus className="size-4 text-muted-foreground" />
            <span>Create organization</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
