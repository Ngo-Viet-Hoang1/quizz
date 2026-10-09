'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import type { CheckoutResponse } from '../api/subscriptions.api';
import { useCurrentSubscription, useSimulatePayment } from '../hooks/use-subscription';

interface CheckoutViewProps {
  checkoutData: CheckoutResponse;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export function CheckoutView({ checkoutData, onBack, onPaymentSuccess }: CheckoutViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: subData, refetch } = useCurrentSubscription({ refetchInterval: 2500 });
  const simulatePaymentMutation = useSimulatePayment();

  const [initialPlan] = useState(subData?.plan);
  const [initialPeriodEnd] = useState(subData?.currentPeriodEnd);

  const isDevMode =
    process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO_PAYMENT === 'true';

  // Watch for real webhook payment completion
  useEffect(() => {
    const hasPlanUpgraded = subData?.plan !== initialPlan && subData?.plan === checkoutData.plan;
    const hasDateExtended = Boolean(
      initialPeriodEnd &&
      subData?.currentPeriodEnd &&
      new Date(subData.currentPeriodEnd).getTime() > new Date(initialPeriodEnd).getTime(),
    );

    if (hasPlanUpgraded || hasDateExtended) {
      onPaymentSuccess();
    }
  }, [subData, initialPlan, initialPeriodEnd, checkoutData.plan, onPaymentSuccess]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulatePayment = () => {
    simulatePaymentMutation.mutate(checkoutData.plan, {
      onSuccess: async (res) => {
        if (res.success) {
          await refetch();
          onPaymentSuccess();
        }
      },
    });
  };

  const fields = [
    { label: 'Bank', value: checkoutData.bankId, isCopyable: false },
    { label: 'Account Number', value: checkoutData.accountNumber, isCopyable: true },
    { label: 'Account Name', value: checkoutData.accountName, isCopyable: false },
    {
      label: 'Amount',
      value: `${checkoutData.amount.toLocaleString('vi-VN')} VND`,
      copyValue: String(checkoutData.amount),
      isCopyable: true,
    },
    {
      label: 'Transfer Content',
      value: checkoutData.transferCode,
      isCopyable: true,
      isHighlight: true,
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-1"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to plans</span>
        </button>
        <DialogTitle className="text-lg sm:text-xl font-bold">
          VietQR Payment — {checkoutData.plan.toUpperCase()} Plan
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Scan the QR code with your banking app or transfer using the details below.
        </DialogDescription>
      </div>

      {/* Grid: QR Code & Transfer Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl border bg-white dark:bg-zinc-950">
          <img
            src={checkoutData.qrUrl}
            alt="VietQR Payment Code"
            className="size-48 sm:size-52 object-contain"
          />
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            Scan via any banking app (MB, VCB, Techcom, MoMo)
          </p>
        </div>

        {/* Transfer Information List */}
        <div className="space-y-2 text-xs">
          <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
            {fields.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
              >
                <span className="text-muted-foreground">{f.label}</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span
                    className={f.isHighlight ? 'font-mono font-bold text-primary' : 'font-semibold'}
                  >
                    {f.value}
                  </span>
                  {f.isCopyable && (
                    <button
                      type="button"
                      onClick={() => handleCopy(f.copyValue ?? f.value, f.label)}
                      className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={`Copy ${f.label}`}
                    >
                      {copiedField === f.label ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-[11px] text-muted-foreground">
            Waiting for payment... (Plan activates automatically)
          </div>
        </div>
      </div>

      {/* Developer Sandbox Helper */}
      {isDevMode && (
        <div className="pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            disabled={simulatePaymentMutation.isPending}
            onClick={handleSimulatePayment}
            className="w-full text-xs font-semibold h-8 cursor-pointer"
          >
            {simulatePaymentMutation.isPending
              ? 'Processing Simulation...'
              : '⚡ [Sandbox] 1-Click Simulate Payment'}
          </Button>
        </div>
      )}
    </div>
  );
}
