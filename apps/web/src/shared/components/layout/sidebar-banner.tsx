'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { AlertTriangle, ArrowRight, LucideIcon, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

type QuotaStatus = 'normal' | 'warning' | 'critical';

const STATUS_CONFIG: Record<
  QuotaStatus,
  {
    theme: string;
    bar: string;
    text: string;
    btn: string;
    cta: string;
    Icon: LucideIcon;
  }
> = {
  normal: {
    theme: 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500/25',
    bar: 'bg-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-200',
    btn: 'bg-white dark:bg-emerald-950/50 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600',
    cta: 'Upgrade to Pro',
    Icon: Sparkles,
  },
  warning: {
    theme: 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-500/25',
    bar: 'bg-amber-500',
    text: 'text-amber-800 dark:text-amber-200',
    btn: 'bg-white dark:bg-amber-950/50 border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600',
    cta: 'Upgrade to Pro',
    Icon: AlertTriangle,
  },
  critical: {
    theme: 'bg-red-50/70 dark:bg-red-950/25 border-red-500/25',
    bar: 'bg-red-500',
    text: 'text-red-800 dark:text-red-200',
    btn: 'bg-white dark:bg-red-950/50 border-red-500/30 text-red-800 dark:text-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 animate-pulse',
    cta: 'Refill AI Quota',
    Icon: AlertTriangle,
  },
};

interface SidebarBannerProps {
  onItemClick?: () => void;
  usedQuota?: number;
  totalQuota?: number;
}

export function SidebarBanner({
  onItemClick,
  usedQuota = 85,
  totalQuota = 100,
}: SidebarBannerProps) {
  const remaining = Math.max(0, totalQuota - usedQuota);
  const percent = Math.min(100, Math.round((usedQuota / totalQuota) * 100));

  const status: QuotaStatus = remaining === 0 ? 'critical' : percent > 80 ? 'warning' : 'normal';
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.Icon;

  return (
    <div className="p-3 group-data-[collapsed=true]/sidebar:p-2">
      {/* Collapsed State: Icon with Tooltip */}
      <div className="hidden group-data-[collapsed=true]/sidebar:flex justify-center">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/settings/billing"
                onClick={onItemClick}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg border transition-colors',
                  cfg.theme,
                  cfg.text,
                )}
              >
                <Icon className="size-4" />
                <span className="sr-only">AI Quota: {remaining} left</span>
              </Link>
            }
          />
          <TooltipContent side="right">
            <span>
              {status === 'critical'
                ? 'AI Quota Exceeded! (0 left)'
                : `AI Quota: ${usedQuota}/${totalQuota} (${remaining} left)`}
            </span>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Expanded State: Full Quota Card */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border p-3.5 shadow-2xs space-y-3 group-data-[collapsed=true]/sidebar:hidden',
          cfg.theme,
        )}
      >
        {/* Decorative background watermark */}
        <Zap className="absolute -right-2 -bottom-2 size-16 text-foreground/5 rotate-12 pointer-events-none" />

        <div className="flex items-center justify-between">
          <div
            className={cn('flex items-center gap-1.5 font-bold text-xs tracking-tight', cfg.text)}
          >
            <Icon className="size-3.5 shrink-0" />
            <span>Monthly AI Quota</span>
          </div>
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-background/60',
              cfg.text,
              cfg.theme,
            )}
          >
            {remaining} left
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn('h-full transition-all duration-300', cfg.bar)}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div
            className={cn(
              'flex items-center justify-between text-[10px] font-semibold opacity-80',
              cfg.text,
            )}
          >
            <span>
              Used: {usedQuota}/{totalQuota}
            </span>
            <span>{percent}%</span>
          </div>
        </div>

        <Link href="/settings/billing" onClick={onItemClick} className="block">
          <Button
            size="sm"
            variant="outline"
            className={cn(
              'w-full h-7 text-xs justify-between font-semibold transition-all duration-200 cursor-pointer shadow-2xs',
              cfg.btn,
            )}
          >
            <span>{cfg.cta}</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
