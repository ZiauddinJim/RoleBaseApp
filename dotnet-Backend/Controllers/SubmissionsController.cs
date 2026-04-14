/*
 * SubmissionsController — onboarding form payloads stored per user.
 * GET me: form.submissions_own | GET / : admin.submissions (list all).
 * CAUSE: [HttpGet("me")] is declared before [HttpGet] so routing resolves /submissions/me correctly.
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SubmissionsController(ApplicationDbContext db) => _db = db;

    [HttpGet("me")]
    [Authorize(Policy = "Perm:" + PermissionKeys.FormSubmissionsOwn)]
    public async Task<IActionResult> MySubmission()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var row = await _db.UserFormSubmissions.AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.SubmittedAtUtc)
            .FirstOrDefaultAsync();

        if (row == null)
            return Ok(new { submission = (object?)null });

        return Ok(new
        {
            submission = new
            {
                row.Id,
                row.PublicUserId,
                row.SubmittedAtUtc,
                step1 = JsonSerializer.Deserialize<JsonElement>(row.Step1Json),
                step2 = JsonSerializer.Deserialize<JsonElement>(row.Step2Json),
                step3 = JsonSerializer.Deserialize<JsonElement>(row.Step3Json)
            }
        });
    }

    [HttpPut("me")]
    [Authorize(Policy = "Perm:" + PermissionKeys.FormSubmissionsOwn)]
    public async Task<IActionResult> UpsertMySubmission([FromBody] UpdateMySubmissionDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        if (dto.Step1 == null || string.IsNullOrWhiteSpace(dto.Step1.FullName) || string.IsNullOrWhiteSpace(dto.Step1.Email))
            return BadRequest("Step 1 must include fullName and email");

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized();

        var step1Json = JsonSerializer.Serialize(dto.Step1);
        var step2Json = JsonSerializer.Serialize(dto.Step2 ?? new OnboardingStep2Data());
        var step3Json = JsonSerializer.Serialize(dto.Step3 ?? new OnboardingStep3Data());

        var row = await _db.UserFormSubmissions
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (row == null)
        {
            row = new UserFormSubmission
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PublicUserId = user.PublicUserId ?? string.Empty,
                Step1Json = step1Json,
                Step2Json = step2Json,
                Step3Json = step3Json,
                SubmittedAtUtc = DateTime.UtcNow
            };
            _db.UserFormSubmissions.Add(row);
        }
        else
        {
            row.Step1Json = step1Json;
            row.Step2Json = step2Json;
            row.Step3Json = step3Json;
            row.SubmittedAtUtc = DateTime.UtcNow;
            row.PublicUserId = user.PublicUserId ?? row.PublicUserId;
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Submission saved",
            submission = new
            {
                row.Id,
                row.PublicUserId,
                row.SubmittedAtUtc,
                step1 = JsonSerializer.Deserialize<JsonElement>(row.Step1Json),
                step2 = JsonSerializer.Deserialize<JsonElement>(row.Step2Json),
                step3 = JsonSerializer.Deserialize<JsonElement>(row.Step3Json)
            }
        });
    }

    [HttpGet]
    [Authorize(Policy = "Perm:" + PermissionKeys.AdminSubmissions)]
    public async Task<IActionResult> All()
    {
        var rows = await _db.UserFormSubmissions
            .AsNoTracking()
            .Include(s => s.User)
            .OrderByDescending(s => s.SubmittedAtUtc)
            .ToListAsync();

        var list = rows.Select(s => new
        {
            s.Id,
            s.UserId,
            s.PublicUserId,
            s.SubmittedAtUtc,
            userName = s.User.Name,
            userEmail = s.User.Email,
            step1 = JsonSerializer.Deserialize<JsonElement>(s.Step1Json),
            step2 = JsonSerializer.Deserialize<JsonElement>(s.Step2Json),
            step3 = JsonSerializer.Deserialize<JsonElement>(s.Step3Json)
        }).ToList();

        return Ok(list);
    }
}
