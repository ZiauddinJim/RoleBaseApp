/*
 * JwtService — builds signed JWT after login/password change.
 * CAUSE: Embeds permission claims so [Authorize(Policy = "Perm:...")] works without DB per request.
 *        Re-login (or /auth/me + new token) refreshes permissions after admin changes roles.
 */
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

public class JwtService
{
    public const string MustChangePasswordClaim = "must_change_password";

    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(
        ApplicationUser user,
        IEnumerable<string> roles,
        IEnumerable<string> permissionKeys,
        bool mustChangePassword)
    {
        var roleList = roles.ToList();
        var primaryRole = roleList.Contains("Admin", StringComparer.OrdinalIgnoreCase)
            ? "Admin"
            : (roleList.FirstOrDefault() ?? "User");

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Role, primaryRole),
            new Claim(ClaimTypes.Name, user.Name ?? string.Empty),
            new Claim(MustChangePasswordClaim, mustChangePassword ? "true" : "false")
        };

        if (!string.IsNullOrEmpty(user.PublicUserId))
            claims.Add(new Claim("public_user_id", user.PublicUserId));

        foreach (var permKey in permissionKeys.Distinct())
            claims.Add(new Claim(PermissionAuthorizationHandler.PermissionClaimType, permKey));

        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)
        );

        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
