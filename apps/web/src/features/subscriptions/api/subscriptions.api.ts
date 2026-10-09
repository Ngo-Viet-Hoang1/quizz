import { useApiClient } from '@/shared/lib/api-client';
import { SubscriptionPlan, SubscriptionStatus } from '@repo/shared-types';
import * as React from 'react';

export interface SubscriptionDetail {
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  aiQuotaMonthly: number;
  aiQuotaUsed: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

export interface CheckoutResponse {
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  transferCode: string;
  bankId: string;
  accountNumber: string;
  accountName: string;
  qrUrl: string;
}

export function useSubscriptionsApi() {
  const client = useApiClient();

  return React.useMemo(
    () => ({
      getCurrentSubscription: (): Promise<SubscriptionDetail> =>
        client.get<SubscriptionDetail>('/subscriptions/current'),

      createCheckout: (plan: SubscriptionPlan): Promise<CheckoutResponse> =>
        client.post<CheckoutResponse>('/subscriptions/checkout', { plan }),

      simulatePayment: (plan: SubscriptionPlan): Promise<{ success: boolean; message: string }> =>
        client.post<{ success: boolean; message: string }>('/subscriptions/simulate-payment', {
          plan,
        }),

      resetDevSubscription: (): Promise<SubscriptionDetail> =>
        client.post<SubscriptionDetail>('/subscriptions/reset-dev', {}),
    }),
    [client],
  );
}
