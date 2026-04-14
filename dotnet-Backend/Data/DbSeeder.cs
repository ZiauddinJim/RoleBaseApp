/*
 * DbSeeder — idempotent catalog + default role links.
 * CAUSE: Admin needs all permissions including system.fullaccess; User gets a subset.
 *        Ensures missing permissions/links are added without overwriting existing data.
 */
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var roleName in new[] { "Admin", "User" })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole(roleName));
        }

        var permissionDefs = new List<Permission>
        {
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.SystemFullAccess, Name = "Full system access", Description = "Bypasses individual permission checks." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.DashboardHome, Name = "Dashboard home", Description = "View dashboard home metrics." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.DashboardPosts, Name = "Dashboard posts module", Description = "Access posts area in dashboard." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.PostsView, Name = "View posts", Description = "List posts." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.PostsCreate, Name = "Create posts", Description = "Create new posts." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.PostsEditOwn, Name = "Edit own posts", Description = "Edit posts created by self." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.PostsDeleteOwn, Name = "Delete own posts", Description = "Delete own posts." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.PostsManageAll, Name = "Manage all posts", Description = "Edit/delete any post." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.ProfilePassword, Name = "Change password", Description = "Change own password." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.FormSubmissionsOwn, Name = "View own form submission", Description = "See onboarding form data." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.AdminRoles, Name = "Manage roles", Description = "CRUD roles and assign permissions." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.AdminPermissions, Name = "Manage permissions", Description = "CRUD permission catalog." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.AdminUsers, Name = "Manage users", Description = "Assign roles to users." },
            new() { Id = Guid.NewGuid(), Key = PermissionKeys.AdminSubmissions, Name = "View all submissions", Description = "See all user onboarding data." },
        };

        // Add only missing permission keys so repeated startup is safe.
        var existingPermissions = await db.Permissions
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var existingByKey = existingPermissions.ToDictionary(p => p.Key, StringComparer.OrdinalIgnoreCase);

        var missing = permissionDefs
            .Where(p => !existingByKey.ContainsKey(p.Key))
            .ToList();

        if (missing.Count > 0)
        {
            db.Permissions.AddRange(missing);
            await db.SaveChangesAsync(cancellationToken);
            existingPermissions = await db.Permissions
                .AsNoTracking()
                .ToListAsync(cancellationToken);
            existingByKey = existingPermissions.ToDictionary(p => p.Key, StringComparer.OrdinalIgnoreCase);
        }

        var adminRole = await db.Roles.FirstAsync(r => r.Name == "Admin", cancellationToken);
        var userRole = await db.Roles.FirstAsync(r => r.Name == "User", cancellationToken);

        var adminKeys = permissionDefs.Select(p => p.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var userKeys = new HashSet<string>
        {
            PermissionKeys.DashboardHome,
            PermissionKeys.DashboardPosts,
            PermissionKeys.PostsView,
            PermissionKeys.PostsCreate,
            PermissionKeys.PostsEditOwn,
            PermissionKeys.PostsDeleteOwn,
            PermissionKeys.ProfilePassword,
            PermissionKeys.FormSubmissionsOwn
        };

        var existingLinks = await db.RolePermissions
            .AsNoTracking()
            .Select(rp => new { rp.RoleId, rp.PermissionId })
            .ToListAsync(cancellationToken);
        var existingLinkSet = existingLinks
            .Select(x => $"{x.RoleId}:{x.PermissionId}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var p in existingPermissions)
        {
            if (adminKeys.Contains(p.Key) && !existingLinkSet.Contains($"{adminRole.Id}:{p.Id}"))
                db.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = p.Id });
            if (userKeys.Contains(p.Key) && !existingLinkSet.Contains($"{userRole.Id}:{p.Id}"))
                db.RolePermissions.Add(new RolePermission { RoleId = userRole.Id, PermissionId = p.Id });
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
