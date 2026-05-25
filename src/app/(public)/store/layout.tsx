import type { Metadata } from "next";

const BASE = "https://lustpages.com";

export const metadata: Metadata = {
  title: "Coin Store — Coming Soon | LustPages",
  description:
    "Premium content and coin features are coming soon to LustPages. Stay tuned!",
  robots: { index: false, follow: false },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
