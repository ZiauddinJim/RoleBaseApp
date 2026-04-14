/*
 * ClaimsPrincipalExtensions — HasAppPermission for controller logic (e.g. post ownership + manage_all).
 * CAUSE: Mirrors handler rules for resource checks that are not a single policy attribute.
 */
using System.Security.Claims;

public static class ClaimsPrincipalExtensions
{
    public static bool HasAppPermission(this ClaimsPrincipal user, string permissionKey)
    {
        if (!user.Identity?.IsAuthenticated ?? true)
            return false;

        return user.HasClaim(PermissionAuthorizationHandler.PermissionClaimType, PermissionKeys.SystemFullAccess)
            || user.HasClaim(PermissionAuthorizationHandler.PermissionClaimType, permissionKey);
    }
}
