/*
 * RoleBaseApp — Backend entry (Program.cs)
 * ---------------------------------------------------------------------------
 * PURPOSE: ASP.NET Core API with SQL Server, Identity, JWT, and dynamic RBAC
 *          (permissions assigned to roles; JWT carries permission claims).
 *
 * FLOW:    Configure services → Migrate DB → Seed roles/permissions → Run.
 *
 * KEY FILES TO READ NEXT:
 *   - Data/ApplicationDbContext.cs  — EF model + Identity tables
 *   - Data/DbSeeder.cs              — default Admin/User roles + permission catalog
 *   - PermissionKeys.cs             — string keys for policies (Perm:key)
 *   - Controllers/AuthController.cs — login, register, password, /me
 *   - Authorization/*               — PermissionPolicyProvider + handler
 *
 * CAUSE (design choices):
 *   - JWT as default auth scheme: API uses bearer tokens, not Identity cookies.
 *   - Migrate on startup: simple local/dev deploy; production may prefer pipelines.
 *   - CORS AllowAll: dev-friendly; tighten origins in production.
 *   - Email: LoggingEmailSender when SMTP host missing — avoids crash, logs instead.
 */
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// CAUSE: PORT env supports hosts like Render/Heroku; fallback matches launchSettings default.
var port = Environment.GetEnvironmentVariable("PORT") ?? "5138";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 6;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<PublicUserIdGenerator>();
builder.Services.AddSingleton<JwtService>();

if (string.IsNullOrWhiteSpace(builder.Configuration["Email:Smtp:Host"]))
    builder.Services.AddSingleton<IEmailSender, LoggingEmailSender>();
else
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();

builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

builder.Services.AddControllers();
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

// CAUSE: Explicit default scheme so AddIdentity does not steal API auth with cookies.
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtKey = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Apply pending EF migrations (creates/updates schema).
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
}

// CAUSE: Runs after migrate so AspNetRoles exists before linking RolePermissions.
await DbSeeder.SeedAsync(app.Services);

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
