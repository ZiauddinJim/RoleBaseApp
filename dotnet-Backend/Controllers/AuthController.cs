using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtService _jwt;

    public AuthController(UserManager<ApplicationUser> userManager, JwtService jwt)
    {
        _userManager = userManager;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("All fields are required");
        }

        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            return BadRequest("Email already exists");

        var assignedRole = "User";
        if (dto.Role == "Admin") assignedRole = "Admin";

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            Name = dto.Name
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(string.Join("; ", result.Errors.Select(e => e.Description)));

        var roleResult = await _userManager.AddToRoleAsync(user, assignedRole);
        if (!roleResult.Succeeded)
            return BadRequest(string.Join("; ", roleResult.Errors.Select(e => e.Description)));

        return Ok(new { message = "User registered successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return Unauthorized("Invalid credentials");

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwt.GenerateToken(user, roles);
        var role = roles.Contains("Admin") ? "Admin" : (roles.FirstOrDefault() ?? "User");

        return Ok(new
        {
            token,
            role,
            userId = user.Id,
            name = user.Name,
            email = user.Email
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("users/count")]
    public async Task<IActionResult> GetUsersCount()
    {
        var count = await _userManager.Users.CountAsync();
        return Ok(new { totalUsers = count });
    }
}
