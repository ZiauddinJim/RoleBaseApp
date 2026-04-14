/*
 * PermissionKeys — canonical permission strings (also in frontend lib/permissionKeys.js).
 * CAUSE: Policies use "Perm:" + key; handler checks JWT "permission" claims OR system.fullaccess.
 */
public static class PermissionKeys
{
    public const string SystemFullAccess = "system.fullaccess";

    public const string DashboardHome = "dashboard.home";
    public const string DashboardPosts = "dashboard.posts";

    public const string PostsView = "posts.view";
    public const string PostsCreate = "posts.create";
    public const string PostsEditOwn = "posts.edit_own";
    public const string PostsDeleteOwn = "posts.delete_own";
    public const string PostsManageAll = "posts.manage_all";

    public const string ProfilePassword = "profile.password";
    public const string FormSubmissionsOwn = "form.submissions_own";

    public const string AdminRoles = "admin.roles";
    public const string AdminPermissions = "admin.permissions";
    public const string AdminUsers = "admin.users";
    public const string AdminSubmissions = "admin.submissions";
}
