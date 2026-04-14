/**
 * Permission key constants — MUST stay in sync with dotnet-Backend/PermissionKeys.cs.
 *
 * can(permissions, key) returns true if user has the key OR system.fullaccess.
 * CAUSE: Sidebar and buttons hide modules user cannot call anyway (403 from API if bypassed).
 */
export const PK = {
  systemFullAccess: "system.fullaccess",
  dashboardHome: "dashboard.home",
  dashboardPosts: "dashboard.posts",
  postsView: "posts.view",
  postsCreate: "posts.create",
  postsEditOwn: "posts.edit_own",
  postsDeleteOwn: "posts.delete_own",
  postsManageAll: "posts.manage_all",
  profilePassword: "profile.password",
  formSubmissionsOwn: "form.submissions_own",
  adminRoles: "admin.roles",
  adminPermissions: "admin.permissions",
  adminUsers: "admin.users",
  adminSubmissions: "admin.submissions",
};

export function can(permissions, key) {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  if (permissions.includes(PK.systemFullAccess)) return true;
  return permissions.includes(key);
}
