/*
 * UsersAdminController — list users and replace role assignments (admin.users).
 * CAUSE: Route prefix api/admin/users avoids clashing with future Identity user APIs.
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = "Perm:" + PermissionKeys.AdminUsers)]
public class UsersAdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _db;

    public UsersAdminController(UserManager<ApplicationUser> userManager, ApplicationDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var users = await _userManager.Users.AsNoTracking()
            .OrderBy(u => u.Email)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.Name,
                u.PublicUserId,
                u.MustChangePassword
            })
            .ToListAsync();

        var roleRows = await (
            from ur in _db.UserRoles.AsNoTracking()
            join r in _db.Roles.AsNoTracking() on ur.RoleId equals r.Id
            select new { ur.UserId, RoleName = r.Name! }
        ).ToListAsync();

        var rolesByUser = roleRows
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName).ToList());

        var result = users.Select(u => new
        {
            u.Id,
            u.Email,
            u.Name,
            u.PublicUserId,
            u.MustChangePassword,
            roles = rolesByUser.GetValueOrDefault(u.Id, new List<string>())
        }).ToList();

        return Ok(result);
    }

    [HttpPut("{id}/roles")]
    public async Task<IActionResult> SetRoles(string id, [FromBody] SetUserRolesDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var current = await _userManager.GetRolesAsync(user);
        var remove = await _userManager.RemoveFromRolesAsync(user, current);
        if (!remove.Succeeded)
            return BadRequest(string.Join("; ", remove.Errors.Select(e => e.Description)));

        var names = dto.RoleNames.Where(n => !string.IsNullOrWhiteSpace(n)).Select(n => n.Trim()).Distinct().ToList();
        if (names.Count > 0)
        {
            var add = await _userManager.AddToRolesAsync(user, names);
            if (!add.Succeeded)
                return BadRequest(string.Join("; ", add.Errors.Select(e => e.Description)));
        }

        return Ok(new { message = "Roles updated" });
    }
}
