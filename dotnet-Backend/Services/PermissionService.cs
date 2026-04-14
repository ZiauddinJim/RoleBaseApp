/*
 * PermissionService — resolves effective permission keys for a user via role → RolePermissions.
 * CAUSE: Single place for login/JWT and future server-side checks to stay consistent.
 */
using Microsoft.EntityFrameworkCore;

public class PermissionService : IPermissionService
{
    private readonly ApplicationDbContext _db;

    public PermissionService(ApplicationDbContext db) => _db = db;

    public async Task<List<string>> GetPermissionKeysForUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var roleIds = await _db.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync(cancellationToken);

        return await _db.RolePermissions
            .Where(rp => roleIds.Contains(rp.RoleId))
            .Select(rp => rp.Permission!.Key)
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}
