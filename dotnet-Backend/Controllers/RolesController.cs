/*
 * RolesController — Identity roles + RolePermission rows (admin.roles).
 * CAUSE: Built-in Admin/User cannot be deleted; custom roles can be removed if empty.
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Perm:" + PermissionKeys.AdminRoles)]
public class RolesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly RoleManager<IdentityRole> _roleManager;

    public RolesController(ApplicationDbContext db, RoleManager<IdentityRole> roleManager)
    {
        _db = db;
        _roleManager = roleManager;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var roles = await _db.Roles.AsNoTracking().OrderBy(r => r.Name).ToListAsync();
        var rp = await _db.RolePermissions.AsNoTracking().ToListAsync();

        var result = roles.Select(r => new
        {
            r.Id,
            r.Name,
            permissionIds = rp.Where(x => x.RoleId == r.Id).Select(x => x.PermissionId).ToList()
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Name is required");

        var name = dto.Name.Trim();
        if (await _roleManager.RoleExistsAsync(name))
            return BadRequest("Role already exists");

        var r = await _roleManager.CreateAsync(new IdentityRole(name));
        if (!r.Succeeded)
            return BadRequest(string.Join("; ", r.Errors.Select(e => e.Description)));

        var role = await _roleManager.FindByNameAsync(name);
        return Ok(new { role!.Id, role.Name });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null) return NotFound();

        if (string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role.Name, "User", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Cannot delete built-in roles.");

        var usersInRole = await _db.UserRoles.AnyAsync(ur => ur.RoleId == id);
        if (usersInRole)
            return BadRequest("Remove users from this role before deleting.");

        var rps = await _db.RolePermissions.Where(rp => rp.RoleId == id).ToListAsync();
        _db.RolePermissions.RemoveRange(rps);

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
            return BadRequest(string.Join("; ", result.Errors.Select(e => e.Description)));

        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    [HttpPut("{id}/permissions")]
    public async Task<IActionResult> SetPermissions(string id, [FromBody] SetRolePermissionsDto dto)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null) return NotFound();

        var existing = await _db.RolePermissions.Where(rp => rp.RoleId == id).ToListAsync();
        _db.RolePermissions.RemoveRange(existing);

        var permIds = dto.PermissionIds.Distinct().ToList();
        var valid = await _db.Permissions.Where(p => permIds.Contains(p.Id)).Select(p => p.Id).ToListAsync();

        foreach (var pid in valid)
            _db.RolePermissions.Add(new RolePermission { RoleId = id, PermissionId = pid });

        await _db.SaveChangesAsync();
        return Ok(new { message = "Permissions updated" });
    }
}
