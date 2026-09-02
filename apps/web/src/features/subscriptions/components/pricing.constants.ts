import { PLAN_CONFIG, SubscriptionPlan } from '@repo/shared-types';

export interface PlanItem {
  code: SubscriptionPlan;
  name: string;
  price: string;
  period: string;
  description: string;
  quota: string;
  features: string[];
  popular: boolean;
  order: number;
}

export const PLANS: PlanItem[] = [
  {
    code: SubscriptionPlan.FREE,
    name: PLAN_CONFIG[SubscriptionPlan.FREE].name.replace(' Plan', ''),
    price: `${PLAN_CONFIG[SubscriptionPlan.FREE].priceVnd.toLocaleString('vi-VN')} VND`,
    period: '/forever',
    description: 'Essential assessment tools for individual teachers.',
    quota: `${PLAN_CONFIG[SubscriptionPlan.FREE].aiQuotaMonthly.toLocaleString()} AI Generations / mo`,
    features: [
      'Automated question generation',
      `${PLAN_CONFIG[SubscriptionPlan.FREE].aiQuotaMonthly.toLocaleString()} AI generation credits/mo`,
      'Up to 10 quiz collections',
      'Community support',
    ],
    popular: false,
    order: 0,
  },
  {
    code: SubscriptionPlan.PRO,
    name: PLAN_CONFIG[SubscriptionPlan.PRO].name.replace(' Plan', ''),
    price: `${PLAN_CONFIG[SubscriptionPlan.PRO].priceVnd.toLocaleString('vi-VN')} VND`,
    period: '/month',
    description: 'Advanced AI capabilities and higher quotas for educators & teams.',
    quota: `${PLAN_CONFIG[SubscriptionPlan.PRO].aiQuotaMonthly.toLocaleString()} AI Generations / mo`,
    features: [
      'All features in Free plan',
      `${PLAN_CONFIG[SubscriptionPlan.PRO].aiQuotaMonthly.toLocaleString()} AI generation credits/mo`,
      'PDF & Document context extraction',
      'Unlimited quiz collections',
      'Priority 24/7 technical support',
    ],
    popular: true,
    order: 1,
  },
  {
    code: SubscriptionPlan.ENTERPRISE,
    name: PLAN_CONFIG[SubscriptionPlan.ENTERPRISE].name.replace(' Plan', ''),
    price: `${PLAN_CONFIG[SubscriptionPlan.ENTERPRISE].priceVnd.toLocaleString('vi-VN')} VND`,
    period: '/month',
    description: 'Full-scale assessment platform for schools and organizations.',
    quota: `${PLAN_CONFIG[SubscriptionPlan.ENTERPRISE].aiQuotaMonthly.toLocaleString()} AI Generations / mo`,
    features: [
      'All features in Pro plan',
      `${PLAN_CONFIG[SubscriptionPlan.ENTERPRISE].aiQuotaMonthly.toLocaleString()} AI generation credits/mo`,
      'Unlimited team member seats',
      'Custom branding & domain',
      'Dedicated account manager',
    ],
    popular: false,
    order: 2,
  },
];

export const formatSubscriptionDate = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
};
