/*
 * PermissionsController — CRUD permission catalog (admin.permissions).
 * CAUSE: New keys can be added at runtime; roles map to them via RolesController.
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Perm:" + PermissionKeys.AdminPermissions)]
public class PermissionsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PermissionsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var list = await _db.Permissions.AsNoTracking()
            .OrderBy(p => p.Key)
            .Select(p => new { p.Id, p.Key, p.Name, p.Description })
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePermissionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Key) || string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Key and name are required");

        var normalized = dto.Key.Trim().ToLowerInvariant();
        if (await _db.Permissions.AnyAsync(p => p.Key == normalized))
            return BadRequest("Permission key already exists");

        var p = new Permission
        {
            Id = Guid.NewGuid(),
            Key = normalized,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim()
        };
        _db.Permissions.Add(p);
        await _db.SaveChangesAsync();
        return Ok(new { p.Id, p.Key, p.Name, p.Description });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePermissionDto dto)
    {
        var p = await _db.Permissions.FindAsync(id);
        if (p == null) return NotFound();

        p.Name = string.IsNullOrWhiteSpace(dto.Name) ? p.Name : dto.Name.Trim();
        p.Description = dto.Description?.Trim();
        await _db.SaveChangesAsync();
        return Ok(new { p.Id, p.Key, p.Name, p.Description });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var p = await _db.Permissions.FindAsync(id);
        if (p == null) return NotFound();

        var used = await _db.RolePermissions.AnyAsync(rp => rp.PermissionId == id);
        if (used)
            return BadRequest("Permission is assigned to roles; remove assignments first.");

        _db.Permissions.Remove(p);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }
}
