'use client';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { CheckCircle2 } from 'lucide-react';
import type { CheckoutResponse } from '../api/subscriptions.api';
import { useCurrentSubscription } from '../hooks/use-subscription';
import { formatSubscriptionDate } from './pricing.constants';

interface PaymentSuccessViewProps {
  checkoutData: CheckoutResponse;
  onClose: () => void;
}

export function PaymentSuccessView({ checkoutData, onClose }: PaymentSuccessViewProps) {
  const { data: subData } = useCurrentSubscription();

  return (
    <div className="py-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
      <div className="size-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-8" />
      </div>

      <div className="space-y-1.5">
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold px-2.5"
        >
          Payment Received 🎉
        </Badge>
        <h2 className="text-xl font-bold">{checkoutData.plan.toUpperCase()} Plan Activated</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Your plan has been updated and your monthly AI generation quota is active immediately.
        </p>
      </div>

      <div className="p-3.5 rounded-lg bg-muted/40 border max-w-xs mx-auto text-left text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan:</span>
          <span className="font-bold uppercase text-primary">{checkoutData.plan}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expires:</span>
          <span className="font-semibold">
            {formatSubscriptionDate(subData?.currentPeriodEnd) ?? 'Active'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Monthly AI Quota:</span>
          <span className="font-semibold text-emerald-600">
            {subData?.aiQuotaMonthly ?? 1000} credits
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount Paid:</span>
          <span className="font-semibold">{checkoutData.amount.toLocaleString('vi-VN')} VND</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className="font-semibold text-emerald-600">Active</span>
        </div>
      </div>

      <Button className="px-6 font-semibold text-xs cursor-pointer" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
