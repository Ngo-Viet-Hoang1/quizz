'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { OrganizationSwitcher, useOrganization } from '@clerk/nextjs';
import { Building2 } from 'lucide-react';

export function NavOrg() {
  const { organization } = useOrganization();

  return (
    <div className="flex h-16 w-full items-center border-b border-sidebar-border px-3 group-data-[collapsed=true]/sidebar:px-2 group-data-[collapsed=true]/sidebar:justify-center">
      {/* Collapsed State: Icon/Avatar with Tooltip */}
      <div className="hidden group-data-[collapsed=true]/sidebar:flex">
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex size-9 items-center justify-center rounded-lg border bg-background text-primary shadow-2xs hover:bg-accent cursor-pointer">
                {organization?.imageUrl ? (
                  <Avatar size="sm" className="size-7 rounded-md">
                    <AvatarImage src={organization.imageUrl} alt={organization.name} />
                    <AvatarFallback className="text-[11px] font-bold">
                      {organization.name?.[0]?.toUpperCase() || 'O'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Building2 className="size-4" />
                )}
              </div>
            }
          />
          <TooltipContent side="right">
            <span>{organization?.name || 'Select Organization'}</span>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Expanded State: Full Clerk OrganizationSwitcher */}
      <div className="flex w-full group-data-[collapsed=true]/sidebar:hidden">
        <OrganizationSwitcher
          hidePersonal={false}
          afterSelectOrganizationUrl="/dashboard"
          afterSelectPersonalUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'w-full',
              organizationSwitcherTrigger:
                'w-full justify-between h-10 rounded-lg border bg-background px-2.5 shadow-2xs hover:bg-accent transition-colors',
            },
          }}
        />
      </div>
    </div>
  );
}
