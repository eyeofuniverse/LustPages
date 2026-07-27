export const SUBSCRIPTION_TIERS = {
  spark: {
    id: "spark",
    name: "Spark",
    price: 4.99,
    coinsPerMonth: 500,
    coinsAutoRenew: 625,
    color: "#6366f1",
    badge: null,
    perks: [
      "500 coins every month",
      "625 coins with auto-renew (+25%)",
      "Unlock premium stories & chapters",
      "Tip your favourite authors",
      "No ads",
    ],
  },
  flame: {
    id: "flame",
    name: "Flame",
    price: 9.99,
    coinsPerMonth: 1200,
    coinsAutoRenew: 1500,
    color: "#c4426a",
    badge: "Most Popular",
    perks: [
      "1,200 coins every month",
      "1,500 coins with auto-renew (+25%)",
      "Unlock premium stories & chapters",
      "Tip your favourite authors",
      "No ads",
      "Early access to featured stories",
    ],
  },
  inferno: {
    id: "inferno",
    name: "Inferno",
    price: 24.99,
    coinsPerMonth: 3500,
    coinsAutoRenew: 4375,
    color: "#f59e0b",
    badge: "Best Value",
    perks: [
      "3,500 coins every month",
      "4,375 coins with auto-renew (+25%)",
      "Unlock premium stories & chapters",
      "Tip your favourite authors",
      "No ads",
      "Early access to featured stories",
      "Priority support",
    ],
  },
} as const;

export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;

export function getTier(tierId: string) {
  return SUBSCRIPTION_TIERS[tierId as SubscriptionTierId] ?? null;
}

export const WELCOME_COINS = 150;
export const WELCOME_COINS_DAYS = 7;
