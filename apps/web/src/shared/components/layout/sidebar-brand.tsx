'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export function SidebarBrand() {
  return (
    <div className="flex h-14 w-full items-center border-t border-sidebar-border px-3.5 group-data-[collapsed=true]/sidebar:px-2 group-data-[collapsed=true]/sidebar:justify-center bg-sidebar">
      {/* Collapsed State: Icon with Tooltip */}
      <div className="hidden group-data-[collapsed=true]/sidebar:flex">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/dashboard"
                className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs hover:opacity-90 transition-opacity"
              >
                <Zap className="size-4 fill-current" />
              </Link>
            }
          />
          <TooltipContent side="right" className="flex items-center gap-1.5">
            <span className="font-semibold">HKT Quizz LMS</span>
            <span className="text-[10px] text-muted-foreground font-mono">v1.0.0</span>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Expanded State: Full Branding & Version Badge */}
      <div className="flex w-full items-center justify-between group-data-[collapsed=true]/sidebar:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs group-hover:scale-105 transition-transform">
            <Zap className="size-3.5 fill-current" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              HKT Quizz LMS
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Enterprise Edition
            </span>
          </div>
        </Link>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
          v1.0.0
        </Badge>
      </div>
    </div>
  );
}
