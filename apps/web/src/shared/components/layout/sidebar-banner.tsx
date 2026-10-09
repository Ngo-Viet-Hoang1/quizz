'use client';

import { useCurrentSubscription } from '@/features/subscriptions';
import { cn } from '@/shared/lib/utils';
import { useUIStore } from '@/shared/stores/ui-store';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { PLAN_CONFIG, SubscriptionPlan } from '@repo/shared-types';
import { AlertTriangle, ArrowRight, LucideIcon, Sparkles, Zap } from 'lucide-react';

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
    theme: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500/30',
    bar: 'bg-amber-500',
    text: 'text-amber-800 dark:text-amber-200',
    btn: 'bg-white dark:bg-amber-950/50 border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600',
    cta: 'Quota Low – Upgrade',
    Icon: AlertTriangle,
  },
  critical: {
    theme: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500/30',
    bar: 'bg-rose-500',
    text: 'text-rose-800 dark:text-rose-200',
    btn: 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700 hover:border-rose-700 shadow-sm',
    cta: 'Quota Depleted – Refill',
    Icon: Zap,
  },
};

interface SidebarBannerProps {
  onItemClick?: () => void;
  usedQuota?: number;
  totalQuota?: number;
}

export function SidebarBanner({
  onItemClick,
  usedQuota: propUsedQuota,
  totalQuota: propTotalQuota,
}: SidebarBannerProps) {
  const openPricingModal = useUIStore((s) => s.openPricingModal);
  const { data: subData } = useCurrentSubscription();

  const usedQuota = subData?.aiQuotaUsed ?? propUsedQuota ?? 0;
  const defaultFreeQuota = PLAN_CONFIG[SubscriptionPlan.FREE].aiQuotaMonthly;
  const totalQuota = subData?.aiQuotaMonthly ?? propTotalQuota ?? defaultFreeQuota;
  const plan = subData?.plan ?? SubscriptionPlan.FREE;
  const isPaid = plan === SubscriptionPlan.PRO || plan === SubscriptionPlan.ENTERPRISE;
  const planLabel = PLAN_CONFIG[plan]?.name.replace(' Plan', '') ?? 'Free';

  const remaining = Math.max(0, totalQuota - usedQuota);
  const percent = Math.min(100, Math.round((usedQuota / totalQuota) * 100));

  const status: QuotaStatus = remaining === 0 ? 'critical' : percent > 80 ? 'warning' : 'normal';
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.Icon;

  const handleOpenPricing = () => {
    onItemClick?.();
    openPricingModal();
  };

  return (
    <div className="p-3 group-data-[collapsed=true]/sidebar:p-2">
      {/* Collapsed State: Icon with Tooltip */}
      <div className="hidden group-data-[collapsed=true]/sidebar:flex justify-center">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={handleOpenPricing}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95',
                  cfg.theme,
                )}
                aria-label={`Subscription Quota: ${usedQuota}/${totalQuota}`}
              >
                <Icon className={cn('size-4', cfg.bar.replace('bg-', 'text-'))} />
              </button>
            }
          />
          <TooltipContent side="right" align="center" className="flex flex-col gap-1 py-1.5 px-2.5">
            <span className="font-semibold text-xs">
              {isPaid ? `${planLabel} Subscription` : 'Free Quota'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {usedQuota}/{totalQuota} used ({percent}%)
            </span>
            <span className="text-[10px] text-primary font-medium mt-0.5">Click to view plans</span>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Expanded State: Interactive Quota Card */}
      <div
        className={cn(
          'group-data-[collapsed=true]/sidebar:hidden rounded-xl border p-3 transition-all duration-200 space-y-2.5',
          cfg.theme,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className={cn('size-4 shrink-0', cfg.bar.replace('bg-', 'text-'))} />
            <span className={cn('text-xs font-bold truncate', cfg.text)}>
              {isPaid ? `${planLabel} Plan & Quota` : 'AI Generation Quota'}
            </span>
          </div>
          {isPaid && (
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider',
                plan === 'enterprise'
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  : 'bg-primary/15 text-primary border border-primary/20',
              )}
            >
              {plan.toUpperCase()}
            </span>
          )}
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-1">
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

        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenPricing}
          className={cn(
            'w-full h-7 text-xs justify-between font-semibold transition-all duration-200 cursor-pointer shadow-2xs',
            cfg.btn,
          )}
        >
          <span>{isPaid ? 'Manage / Renew' : cfg.cta}</span>
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
