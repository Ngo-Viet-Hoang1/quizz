'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionPlan } from '@repo/shared-types';
import { Button } from '@/shared/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import type { CheckoutResponse } from '../api/subscriptions.api';
import {
  useCreateCheckout,
  useCurrentSubscription,
  useResetDevSubscription,
  useSimulatePayment,
} from '../hooks/use-subscription';
import { PlanCard } from './plan-card';
import { formatSubscriptionDate, PLANS } from './pricing.constants';

interface PricingTiersViewProps {
  onCheckoutCreated: (checkout: CheckoutResponse) => void;
}

export function PricingTiersView({ onCheckoutCreated }: PricingTiersViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Self-managed hooks (cached automatically by TanStack Query)
  const { data: subData, refetch } = useCurrentSubscription();
  const createCheckoutMutation = useCreateCheckout();
  const resetDevMutation = useResetDevSubscription();
  const simulatePaymentMutation = useSimulatePayment();

  const currentPlan = subData?.plan ?? SubscriptionPlan.FREE;
  const currentPlanOrder = PLANS.find((p) => p.code === currentPlan)?.order ?? 0;
  const isDevMode =
    process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO_PAYMENT === 'true';

  const handleStartCheckout = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    if (plan === SubscriptionPlan.FREE) {
      toast.info('You are already on the Free Plan');
      return;
    }

    createCheckoutMutation.mutate(plan, {
      onSuccess: (checkoutData) => {
        onCheckoutCreated(checkoutData);
      },
    });
  };

  const handleResetToFree = () => {
    resetDevMutation.mutate(undefined, {
      onSuccess: async () => {
        await refetch();
      },
    });
  };

  const handleDirectSimulateUpgrade = (plan: SubscriptionPlan) => {
    simulatePaymentMutation.mutate(plan, {
      onSuccess: async () => {
        await refetch();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DialogHeader className="text-center sm:text-center space-y-1">
        <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
          Subscription Plans
        </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
          Select a plan to manage your organization AI generation quota.
        </DialogDescription>
      </DialogHeader>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            isCurrent={currentPlan === plan.code}
            currentPlanOrder={currentPlanOrder}
            expirationDate={
              currentPlan === plan.code ? formatSubscriptionDate(subData?.currentPeriodEnd) : null
            }
            isPending={createCheckoutMutation.isPending && selectedPlan === plan.code}
            onSelect={handleStartCheckout}
          />
        ))}
      </div>

      {/* Dev Sandbox Controls */}
      {isDevMode && (
        <div className="rounded-lg border bg-muted/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground font-medium">
            Demo Sandbox ({subData?.aiQuotaUsed ?? 0}/{subData?.aiQuotaMonthly ?? 100} credits)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={resetDevMutation.isPending}
              onClick={handleResetToFree}
              className="text-xs h-8 cursor-pointer"
            >
              Reset to Free
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={simulatePaymentMutation.isPending}
              onClick={() => handleDirectSimulateUpgrade(SubscriptionPlan.PRO)}
              className="text-xs h-8 cursor-pointer"
            >
              Simulate Pro (+30d)
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={simulatePaymentMutation.isPending}
              onClick={() => handleDirectSimulateUpgrade(SubscriptionPlan.ENTERPRISE)}
              className="text-xs h-8 cursor-pointer"
            >
              Simulate Enterprise
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
