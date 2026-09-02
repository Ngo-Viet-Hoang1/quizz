'use client';

import { SubscriptionPlan } from '@repo/shared-types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { Check } from 'lucide-react';
import type { PlanItem } from './pricing.constants';

interface PlanCardProps {
  plan: PlanItem;
  isCurrent: boolean;
  currentPlanOrder: number;
  expirationDate: string | null;
  isPending: boolean;
  onSelect: (planCode: SubscriptionPlan) => void;
}

function getPlanButtonState(
  isCurrent: boolean,
  planCode: SubscriptionPlan,
  planOrder: number,
  currentPlanOrder: number,
  isPending: boolean,
) {
  if (isCurrent) {
    if (planCode === SubscriptionPlan.FREE) {
      return { label: 'Current Plan', disabled: true, variant: 'secondary' as const };
    }
    return {
      label: isPending ? 'Processing...' : 'Renew (+30 Days)',
      disabled: isPending,
      variant: 'outline' as const,
    };
  }

  if (planOrder < currentPlanOrder) {
    return {
      label: 'Included in Current Plan',
      disabled: true,
      variant: 'ghost' as const,
    };
  }

  return {
    label: isPending ? 'Processing...' : `Upgrade to ${planCode.toUpperCase()}`,
    disabled: isPending,
    variant: 'default' as const,
  };
}

export function PlanCard({
  plan,
  isCurrent,
  currentPlanOrder,
  expirationDate,
  isPending,
  onSelect,
}: PlanCardProps) {
  const btn = getPlanButtonState(isCurrent, plan.code, plan.order, currentPlanOrder, isPending);

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-4 sm:p-5 transition-colors',
        isCurrent ? 'border-primary bg-primary/3' : 'border-border bg-card',
      )}
    >
      {isCurrent && (
        <Badge className="absolute -top-2.5 right-3 text-[10px] px-2 py-0.5">Current Plan</Badge>
      )}

      {/* Plan Header */}
      <div>
        <h3 className="font-bold text-base">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="my-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight">{plan.price}</span>
        <span className="text-xs text-muted-foreground">{plan.period}</span>
      </div>

      {/* Quota */}
      <div className="mb-3 rounded-md bg-muted/70 px-2.5 py-1.5 text-xs font-medium">
        {plan.quota}
      </div>

      {/* Expiration Date if Active */}
      {expirationDate && (
        <div className="mb-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-700 dark:text-emerald-300">
          Renews: <strong>{expirationDate}</strong>
        </div>
      )}

      {/* Features List */}
      <div className="flex-1 space-y-2 mb-4">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <Button
        variant={btn.variant}
        disabled={btn.disabled}
        className="w-full text-xs font-semibold cursor-pointer"
        onClick={() => onSelect(plan.code)}
      >
        {btn.label}
      </Button>
    </div>
  );
}
