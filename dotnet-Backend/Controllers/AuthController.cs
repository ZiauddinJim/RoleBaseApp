/*
 * AuthController — authentication and session-related APIs.
 * ROUTES:  POST register (email signup, User role only)
 *          POST login   (userIdOrEmail = public id OR email)
 *          GET  me      (refresh profile + permissions for SPA)
 *          POST change-password, forgot-password, reset-password
 *          GET  users/count — requires Perm:admin.users (not legacy role-only).
 * CAUSE:   FindByNameAsync first supports RB-* ids; email users use UserName=email from register.
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly PublicUserIdGenerator _publicUserIdGenerator;
    private readonly JwtService _jwt;
    private readonly IPermissionService _permissionService;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _config;

    public AuthController(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        PublicUserIdGenerator publicUserIdGenerator,
        JwtService jwt,
        IPermissionService permissionService,
        IEmailSender emailSender,
        IConfiguration config)
    {
        _db = db;
        _userManager = userManager;
        _publicUserIdGenerator = publicUserIdGenerator;
        _jwt = jwt;
        _permissionService = permissionService;
        _emailSender = emailSender;
        _config = config;
    }

    private async Task<ApplicationUser?> FindByLoginIdAsync(string userIdOrEmail)
    {
        var trimmed = userIdOrEmail.Trim();
        var byName = await _userManager.FindByNameAsync(trimmed);
        if (byName != null) return byName;
        return await _userManager.FindByEmailAsync(trimmed);
    }

    private async Task<object> BuildLoginResponseAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await _permissionService.GetPermissionKeysForUserAsync(user.Id);
        var token = _jwt.GenerateToken(user, roles, permissions, user.MustChangePassword);
        var role = roles.Contains("Admin") ? "Admin" : (roles.FirstOrDefault() ?? "User");

        return new
        {
            token,
            role,
            userId = user.Id,
            publicUserId = user.PublicUserId,
            name = user.Name,
            email = user.Email,
            mustChangePassword = user.MustChangePassword,
            permissions
        };
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("All fields are required");

        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            return BadRequest("Email already exists");

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            Name = dto.Name,
            MustChangePassword = false
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(string.Join("; ", result.Errors.Select(e => e.Description)));

        var roleResult = await _userManager.AddToRoleAsync(user, "User");
        if (!roleResult.Succeeded)
            return BadRequest(string.Join("; ", roleResult.Errors.Select(e => e.Description)));

        return Ok(new { message = "User registered successfully" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await _permissionService.GetPermissionKeysForUserAsync(userId);
        var role = roles.Contains("Admin") ? "Admin" : (roles.FirstOrDefault() ?? "User");

        return Ok(new
        {
            userId = user.Id,
            publicUserId = user.PublicUserId,
            name = user.Name,
            email = user.Email,
            role,
            mustChangePassword = user.MustChangePassword,
            permissions
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserIdOrEmail) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("User id/email and password are required");

        var user = await FindByLoginIdAsync(dto.UserIdOrEmail);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return Unauthorized("Invalid credentials");

        return Ok(await BuildLoginResponseAsync(user));
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        var submission = await _db.UserFormSubmissions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.SubmittedAtUtc)
            .FirstOrDefaultAsync();

        var step2 = new OnboardingStep2Data();
        var step3 = new OnboardingStep3Data();

        if (submission != null)
        {
            try { step2 = JsonSerializer.Deserialize<OnboardingStep2Data>(submission.Step2Json) ?? new(); } catch { }
            try { step3 = JsonSerializer.Deserialize<OnboardingStep3Data>(submission.Step3Json) ?? new(); } catch { }
        }

        return Ok(new
        {
            publicUserId = user.PublicUserId,
            fullName = user.Name ?? string.Empty,
            email = user.Email ?? string.Empty,
            company = step2.Company,
            department = step2.Department,
            bio = step3.Bio,
            goals = step3.Goals,
            profileImageUrl = step3.ProfileImageUrl,
            updatedAtUtc = submission?.SubmittedAtUtc
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateMySubmissionDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        if (dto.Step1 == null || string.IsNullOrWhiteSpace(dto.Step1.FullName) || string.IsNullOrWhiteSpace(dto.Step1.Email))
            return BadRequest("Full name and email are required");

        var newEmail = dto.Step1.Email.Trim();
        var emailOwner = await _userManager.FindByEmailAsync(newEmail);
        if (emailOwner != null && emailOwner.Id != user.Id)
            return BadRequest("Email already exists");

        var oldEmail = user.Email ?? string.Empty;
        user.Name = dto.Step1.FullName.Trim();
        user.Email = newEmail;
        user.NormalizedEmail = _userManager.NormalizeEmail(newEmail);

        var needsPublicId = string.IsNullOrWhiteSpace(user.PublicUserId);
        if (needsPublicId)
        {
            var generated = await _publicUserIdGenerator.GenerateUniqueAsync();
            user.PublicUserId = generated;
            user.UserName = generated;
            user.NormalizedUserName = _userManager.NormalizeName(generated);
        }
        else if (string.Equals(user.UserName, oldEmail, StringComparison.OrdinalIgnoreCase))
        {
            user.UserName = newEmail;
            user.NormalizedUserName = _userManager.NormalizeName(newEmail);
        }

        var updateUser = await _userManager.UpdateAsync(user);
        if (!updateUser.Succeeded)
            return BadRequest(string.Join("; ", updateUser.Errors.Select(e => e.Description)));

        var step2 = dto.Step2 ?? new OnboardingStep2Data();
        var step3 = dto.Step3 ?? new OnboardingStep3Data();

        var row = await _db.UserFormSubmissions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.SubmittedAtUtc)
            .FirstOrDefaultAsync();

        if (row == null)
        {
            row = new UserFormSubmission
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PublicUserId = user.PublicUserId ?? string.Empty
            };
            _db.UserFormSubmissions.Add(row);
        }

        row.Step1Json = JsonSerializer.Serialize(dto.Step1);
        row.Step2Json = JsonSerializer.Serialize(step2);
        row.Step3Json = JsonSerializer.Serialize(step3);
        row.SubmittedAtUtc = DateTime.UtcNow;
        row.PublicUserId = user.PublicUserId ?? row.PublicUserId;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Profile updated",
            profile = new
            {
                publicUserId = user.PublicUserId,
                fullName = user.Name ?? string.Empty,
                email = user.Email ?? string.Empty,
                company = step2.Company,
                department = step2.Department,
                bio = step3.Bio,
                goals = step3.Goals,
                profileImageUrl = step3.ProfileImageUrl,
                updatedAtUtc = row.SubmittedAtUtc
            }
        });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(string.Join("; ", result.Errors.Select(e => e.Description)));

        user.MustChangePassword = false;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await _permissionService.GetPermissionKeysForUserAsync(user.Id);
        var token = _jwt.GenerateToken(user, roles, permissions, false);

        return Ok(new
        {
            message = "Password updated",
            token,
            mustChangePassword = false,
            permissions
        });
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest("Email is required");

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return Ok(new { message = "If the email exists, reset instructions were sent." });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var baseUrl = _config["App:PublicUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
        var link = $"{baseUrl}/reset-password?email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(encoded)}";

        var body = $"""
                    <p>Hello {HtmlEncoder.Default.Encode(user.Name)},</p>
                    <p>Reset your password using this link (valid for a limited time):</p>
                    <p><a href="{HtmlEncoder.Default.Encode(link)}">Reset password</a></p>
                    <p>If you did not request this, ignore this email.</p>
                    """;

        await _emailSender.SendAsync(user.Email!, "Password reset", body);

        return Ok(new { message = "If the email exists, reset instructions were sent." });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest("Email, token, and new password are required");

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return BadRequest("Invalid request");

        string decoded;
        try
        {
            decoded = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(dto.Token));
        }
        catch
        {
            return BadRequest("Invalid token");
        }

        var result = await _userManager.ResetPasswordAsync(user, decoded, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(string.Join("; ", result.Errors.Select(e => e.Description)));

        return Ok(new { message = "Password has been reset. You can sign in." });
    }

    [Authorize(Policy = "Perm:" + PermissionKeys.AdminUsers)]
    [HttpGet("users/count")]
    public async Task<IActionResult> GetUsersCount()
    {
        var count = await _userManager.Users.CountAsync();
        return Ok(new { totalUsers = count });
    }
}
