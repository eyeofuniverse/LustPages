import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AdminPermissionKey } from "./admin-permissions";

type AdminUser = {
  role?: string;
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
};

export async function requireAdminPermission(permission: AdminPermissionKey) {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  if (!user || user.role !== "admin") redirect("/meminhaj/login");
  if (user.isSuperAdmin) return;
  if (!user.adminPermissions?.includes(permission)) redirect("/meminhaj");
}

export async function requireSuperAdmin() {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  if (!user || user.role !== "admin") redirect("/meminhaj/login");
  if (!user.isSuperAdmin) redirect("/meminhaj");
}
