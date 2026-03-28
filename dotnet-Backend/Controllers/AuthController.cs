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
        // CHECK: Email already exists কিনা
        var existing = await _db.Users.Find(x => x.Email == dto.Email).FirstOrDefaultAsync();
        if (existing != null)
            return BadRequest("Email already exists");

        // CREATE: New user object
        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,

            // SECURITY: Password hashing using BCrypt
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),

            // DEFAULT ROLE
            Role = "User"
        };

        // SAVE: Insert user into MongoDB
        await _db.Users.InsertOneAsync(user);

        return Ok("User registered");
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