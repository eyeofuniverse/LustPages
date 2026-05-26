import { requireSuperAdmin } from "@/lib/admin-guard";
import AdminsClient from "./AdminsClient";

export default async function AdminsPage() {
  await requireSuperAdmin();
  return <AdminsClient />;
}
