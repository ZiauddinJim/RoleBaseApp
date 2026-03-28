using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

// Service class responsible for generating JWT tokens
public class JwtService
{
    // Configuration object to access appsettings.json values
    private readonly IConfiguration _config;

    // Constructor: inject IConfiguration
    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    // Method to generate JWT token for a user
    public string GenerateToken(User user)
    {
        // Define claims (data inside token)
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),   // User ID
            new Claim(ClaimTypes.Email, user.Email),         // User Email
            new Claim(ClaimTypes.Role, user.Role)            // User Role (for authorization)
        };

        // Create security key using secret key from appsettings.json
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)
        );

        // Create signing credentials using HmacSha256 algorithm
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Create JWT token
        var token = new JwtSecurityToken(
            claims: claims,                         // payload data
            expires: DateTime.Now.AddDays(1),       // token expiration (1 day)
            signingCredentials: creds               // signing info
        );

        // Convert token object to string and return
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}