interface UseUsageResult {
  plan: string;
  status: string;
  isPastDue: boolean;
  wordsUsed: number;
  wordsRemaining: number;
  limit: number;
  isSubscribed: boolean;
  isTrial: boolean;
  trialDaysLeft: number | null;
  currentPeriodEnd: string | null;
  billingInterval: "monthly" | "annual" | null;
  isOverLimit: boolean;
  isApproachingLimit: boolean;
  resetAt: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  checkoutLoading: boolean;
  refetch: () => Promise<void>;
  openCheckout: (opts?: {
    plan?: "monthly" | "annual";
    tier?: "pro" | "business";
  }) => Promise<{ success: boolean; error?: string }>;
  openBillingPortal: () => Promise<{ success: boolean; error?: string }>;
  switchPlan: (opts: {
    plan: "monthly" | "annual";
    tier: "pro" | "business";
  }) => Promise<{ success: boolean; alreadyOnPlan?: boolean; error?: string }>;
  previewSwitchPlan: (opts: { plan: "monthly" | "annual"; tier: "pro" | "business" }) => Promise<{
    success: boolean;
    immediateAmount?: number;
    currency?: string;
    currentPriceAmount?: number;
    currentInterval?: string;
    newPriceAmount?: number;
    newInterval?: string;
    nextBillingDate?: string;
    alreadyOnPlan?: boolean;
    error?: string;
  }>;
}

const disabled = async () => ({ success: false, error: "Account features are not available" });

export function useUsage(): UseUsageResult {
  return {
    plan: "local",
    status: "disabled",
    isPastDue: false,
    wordsUsed: 0,
    wordsRemaining: Number.POSITIVE_INFINITY,
    limit: Number.POSITIVE_INFINITY,
    isSubscribed: false,
    isTrial: false,
    trialDaysLeft: null,
    currentPeriodEnd: null,
    billingInterval: null,
    isOverLimit: false,
    isApproachingLimit: false,
    resetAt: null,
    isLoading: false,
    hasLoaded: true,
    error: null,
    checkoutLoading: false,
    refetch: async () => {},
    openCheckout: disabled,
    openBillingPortal: disabled,
    switchPlan: disabled,
    previewSwitchPlan: disabled,
  };
}
