export const SUBSCRIPTION_TIERS = {
  basic: {
    id: "basic",
    name: "Basic",
    price: 4.99,
    coinsPerMonth: 600,
    discount: 0.10,
    color: "#6366f1",
    perks: ["600 coins every month", "10% off extra coin purchases", "No ads"],
  },
  reader: {
    id: "reader",
    name: "Reader",
    price: 9.99,
    coinsPerMonth: 1400,
    discount: 0.20,
    color: "#c4426a",
    perks: ["1,400 coins every month", "20% off extra coin purchases", "No ads", "Early access to featured stories"],
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 19.99,
    coinsPerMonth: 3000,
    discount: 0.30,
    color: "#f59e0b",
    perks: ["3,000 coins every month", "30% off extra coin purchases", "No ads", "Early access to featured stories", "Priority support"],
  },
} as const;

export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;

export function getTier(tierId: string) {
  return SUBSCRIPTION_TIERS[tierId as SubscriptionTierId] ?? null;
}
