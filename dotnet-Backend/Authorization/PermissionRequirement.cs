/*
 * PermissionRequirement — holds one permission key for the dynamic policy provider.
 */
using Microsoft.AspNetCore.Authorization;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Key { get; }
    public PermissionRequirement(string key) => Key = key;
}
