using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;

// CONTROLLER: Handles authentication (Register & Login)
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // SERVICE: MongoDB database access
    private readonly MongoDbService _db;

    // SERVICE: JWT token generation
    private readonly JwtService _jwt;

    // CONSTRUCTOR: Dependency Injection
    public AuthController(MongoDbService db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }


    // POST: /api/auth/register
    // Handles user registration and enforces role assignment safely
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("All fields are required");
        }

        var existing = await _db.Users.Find(x => x.Email == dto.Email).FirstOrDefaultAsync();
        if (existing != null)
            return BadRequest("Email already exists");
        // Restrict role to known valid roles (Defaults to User if unspecified)
        var assignedRole = "User";
        if (dto.Role == "Admin") assignedRole = "Admin";
        
        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = assignedRole
        };

        await _db.Users.InsertOneAsync(user);

        return Ok(new { message = "User registered successfully" });
    }


    // POST: /api/auth/login
    // Validates credentials and returns a JWT token representing user identity and role
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        // FIND: User by email
        var user = await _db.Users.Find(x => x.Email == dto.Email).FirstOrDefaultAsync();

        // VALIDATE: User exists + password match
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

        // GENERATE: JWT Token
        var token = _jwt.GenerateToken(user);

        // RETURN: Token + Role + UserId + Name + Email
        return Ok(new { 
            token, 
            role = user.Role, 
            userId = user.Id, 
            name = user.Name, 
            email = user.Email 
        });
    }

    // GET: /api/auth/users/count
    // Admin-only route to retrieve total application user count
    [Authorize(Roles = "Admin")]
    [HttpGet("users/count")]
    public async Task<IActionResult> GetUsersCount()
    {
        var count = await _db.Users.CountDocumentsAsync(_ => true);
        return Ok(new { totalUsers = count });
    }
}