'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import type { CheckoutResponse } from '../api/subscriptions.api';
import { CheckoutView } from './checkout-view';
import { PaymentSuccessView } from './payment-success-view';
import { PricingTiersView } from './pricing-tiers-view';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type PricingStep = 'plans' | 'checkout' | 'success';

function PricingModalContent({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<PricingStep>('plans');
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);

  const handleCheckoutCreated = (data: CheckoutResponse) => {
    setCheckoutData(data);
    setStep('checkout');
  };

  const handleBackToPlans = () => {
    setCheckoutData(null);
    setStep('plans');
  };

  const handlePaymentSuccess = () => {
    setStep('success');
  };

  return (
    <div className="overflow-y-auto overflow-x-hidden p-5 sm:p-7 max-h-[90vh]">
      {step === 'plans' && <PricingTiersView onCheckoutCreated={handleCheckoutCreated} />}

      {step === 'checkout' && checkoutData && (
        <CheckoutView
          checkoutData={checkoutData}
          onBack={handleBackToPlans}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {step === 'success' && checkoutData && (
        <PaymentSuccessView checkoutData={checkoutData} onClose={onClose} />
      )}
    </div>
  );
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl max-h-[90vh] sm:max-w-4xl w-full flex flex-col">
        <PricingModalContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
