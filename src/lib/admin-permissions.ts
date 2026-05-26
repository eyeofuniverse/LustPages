export const ADMIN_PERMISSIONS = {
  stories: "Stories, Series & Collections",
  categories: "Categories",
  tags: "Tags & Tag Requests",
  approvals: "Story Approvals",
  ads: "Ads",
  featured: "Featured Content",
  accounts: "Accounts & Transactions",
  coin_packages: "Coin Packages",
  comments: "Comments",
  reports: "Reports",
  emails: "Email Settings",
} as const;

export type AdminPermissionKey = keyof typeof ADMIN_PERMISSIONS;

export const ALL_PERMISSION_KEYS = Object.keys(ADMIN_PERMISSIONS) as AdminPermissionKey[];

export function hasPermission(
  isSuperAdmin: boolean,
  permissions: string[],
  key: AdminPermissionKey,
): boolean {
  if (isSuperAdmin) return true;
  return permissions.includes(key);
}
