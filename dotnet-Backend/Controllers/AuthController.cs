using Microsoft.AspNetCore.Mvc;
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


    // TODO: Register New User

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

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),

            // Always default role
            Role = "User"
        };

        await _db.Users.InsertOneAsync(user);

        return Ok(new { message = "User registered successfully" });
    }


    // TODO: User Login

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

        // RETURN: Token + Role
        return Ok(new { token, role = user.Role });
    }
}