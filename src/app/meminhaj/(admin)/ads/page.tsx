import { AdsManager } from "@/components/admin/AdsManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ad Management | LustPages Admin",
};

export default function AdsPage() {
  return <AdsManager />;
}
