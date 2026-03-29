using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

// Create builder (entry point of the application)
var builder = WebApplication.CreateBuilder(args);

// Support Render's PORT environment variable for deployment
var port = Environment.GetEnvironmentVariable("PORT") ?? "5138";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Register MongoDB and JWT services for Dependency Injection
builder.Services.AddSingleton<MongoDbService>();
builder.Services.AddSingleton<JwtService>();

// Enable controllers (API support)
builder.Services.AddControllers();

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    // Get secret key from appsettings.json
    var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);

    // Set token validation parameters
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true, // validate signature
        IssuerSigningKey = new SymmetricSecurityKey(key), // secret key

        ValidateIssuer = false,   // issuer validation off
        ValidateAudience = false  // audience validation off
    };
});

// Enable Authorization (role-based access)
builder.Services.AddAuthorization();

// Build the application
var app = builder.Build();

// Enable CORS Middleware (must be before routing/auth)
app.UseCors("AllowAll");

// Middleware: Authentication (check token)
app.UseAuthentication();

// Middleware: Authorization (check role/permission)
app.UseAuthorization();

// Map controller routes (api endpoints)
app.MapControllers();

// Run the application
app.Run();