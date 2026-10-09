'use client';

import { useAuth } from '@clerk/nextjs';
import { SubscriptionPlan } from '@repo/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckoutResponse,
  SubscriptionDetail,
  useSubscriptionsApi,
} from '../api/subscriptions.api';

export const subscriptionQueryKeys = {
  all: ['subscriptions'] as const,
  current: (orgId: string | null | undefined) =>
    ['subscriptions', 'current', orgId ?? 'none'] as const,
};

export function useCurrentSubscription(options?: { refetchInterval?: number | false }) {
  const { orgId, isLoaded } = useAuth();
  const api = useSubscriptionsApi();

  return useQuery<SubscriptionDetail>({
    queryKey: subscriptionQueryKeys.current(orgId),
    queryFn: () => api.getCurrentSubscription(),
    enabled: isLoaded && Boolean(orgId),
    staleTime: 5_000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useCreateCheckout() {
  const api = useSubscriptionsApi();

  return useMutation<CheckoutResponse, Error, SubscriptionPlan>({
    mutationFn: (plan: SubscriptionPlan) => api.createCheckout(plan),
    onError: (err) => {
      toast.error(err.message || 'Failed to generate VietQR checkout');
    },
  });
}

export function useSimulatePayment() {
  const { orgId } = useAuth();
  const api = useSubscriptionsApi();
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, SubscriptionPlan>({
    mutationFn: (plan: SubscriptionPlan) => api.simulatePayment(plan),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('[DEMO] SePay Webhook simulated! Subscription activated.');
        queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.current(orgId) });
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
      } else {
        toast.error(data.message || 'Payment simulation failed');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error simulating payment request');
    },
  });
}

export function useResetDevSubscription() {
  const { orgId } = useAuth();
  const api = useSubscriptionsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.resetDevSubscription(),
    onSuccess: () => {
      toast.success('Reset organization back to Free Plan');
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.current(orgId) });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to reset subscription');
    },
  });
}
