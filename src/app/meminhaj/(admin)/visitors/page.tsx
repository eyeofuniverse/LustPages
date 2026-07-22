import { redirect } from "next/navigation";

export default function VisitorsPage() {
  redirect("/meminhaj/analytics?tab=visitors");
}
