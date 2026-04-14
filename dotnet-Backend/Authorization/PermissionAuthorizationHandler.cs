/*
 * PermissionAuthorizationHandler — evaluates dynamic permission requirements.
 * CAUSE: system.fullaccess lets Admin pass any Perm:* check without listing every new permission.
 */
using Microsoft.AspNetCore.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    public const string PermissionClaimType = "permission";

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (context.User.HasClaim(PermissionClaimType, PermissionKeys.SystemFullAccess))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (context.User.HasClaim(PermissionClaimType, requirement.Key))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
