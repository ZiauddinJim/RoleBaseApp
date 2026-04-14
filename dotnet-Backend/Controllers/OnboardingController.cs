/*
 * OnboardingController — anonymous multi-step registration backed by RegistrationDraft.
 * FLOW:  POST draft (step 1–3 JSON) → POST complete (password) → user + UserFormSubmission + email.
 * CAUSE: Draft token in localStorage lets user resume; MustChangePassword forces first login security.
 */
using System.Text.Json;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class OnboardingController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly PublicUserIdGenerator _publicUserIdGenerator;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _config;

    public OnboardingController(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        PublicUserIdGenerator publicUserIdGenerator,
        IEmailSender emailSender,
        IConfiguration config)
    {
        _db = db;
        _userManager = userManager;
        _publicUserIdGenerator = publicUserIdGenerator;
        _emailSender = emailSender;
        _config = config;
    }

    [AllowAnonymous]
    [HttpPost("draft")]
    public async Task<IActionResult> SaveDraft([FromBody] OnboardingDraftDto dto)
    {
        if (dto.Step is < 1 or > 3)
            return BadRequest("Step must be 1, 2, or 3");

        var json = dto.Data.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null
            ? "{}"
            : dto.Data.GetRawText();

        RegistrationDraft draft;
        if (string.IsNullOrWhiteSpace(dto.DraftToken))
        {
            draft = new RegistrationDraft
            {
                Id = Guid.NewGuid(),
                DraftToken = Guid.NewGuid().ToString("N"),
                ExpiresAtUtc = DateTime.UtcNow.AddDays(7)
            };
            _db.RegistrationDrafts.Add(draft);
        }
        else
        {
            var found = await _db.RegistrationDrafts.FirstOrDefaultAsync(d => d.DraftToken == dto.DraftToken);
            if (found == null || found.ExpiresAtUtc < DateTime.UtcNow)
                return BadRequest("Invalid or expired draft");
            draft = found;
        }

        switch (dto.Step)
        {
            case 1: draft.Step1Json = json; break;
            case 2: draft.Step2Json = json; break;
            case 3: draft.Step3Json = json; break;
        }

        await _db.SaveChangesAsync();
        return Ok(new { draftToken = draft.DraftToken });
    }

    [AllowAnonymous]
    [HttpGet("draft/{token}")]
    public async Task<IActionResult> GetDraft(string token)
    {
        var draft = await _db.RegistrationDrafts.AsNoTracking()
            .FirstOrDefaultAsync(d => d.DraftToken == token);
        if (draft == null || draft.ExpiresAtUtc < DateTime.UtcNow)
            return NotFound();

        return Ok(new
        {
            step1Json = draft.Step1Json,
            step2Json = draft.Step2Json,
            step3Json = draft.Step3Json,
            expiresAtUtc = draft.ExpiresAtUtc
        });
    }

    [AllowAnonymous]
    [HttpPost("complete")]
    public async Task<IActionResult> Complete([FromBody] OnboardingCompleteDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DraftToken))
            return BadRequest("Draft token required");
        if (dto.Password != dto.ConfirmPassword)
            return BadRequest("Passwords do not match");
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return BadRequest("Password must be at least 6 characters");

        var draft = await _db.RegistrationDrafts.FirstOrDefaultAsync(d => d.DraftToken == dto.DraftToken);
        if (draft == null || draft.ExpiresAtUtc < DateTime.UtcNow)
            return BadRequest("Invalid or expired draft");

        OnboardingStep1Data? step1;
        try
        {
            step1 = JsonSerializer.Deserialize<OnboardingStep1Data>(draft.Step1Json);
        }
        catch
        {
            step1 = null;
        }

        if (step1 == null || string.IsNullOrWhiteSpace(step1.Email) || string.IsNullOrWhiteSpace(step1.FullName))
            return BadRequest("Step 1 must include fullName and email");

        if (await _userManager.FindByEmailAsync(step1.Email) != null)
            return BadRequest("Email already registered");

        var publicId = await _publicUserIdGenerator.GenerateUniqueAsync();

        var user = new ApplicationUser
        {
            UserName = publicId,
            Email = step1.Email,
            Name = step1.FullName,
            PublicUserId = publicId,
            MustChangePassword = true,
            EmailConfirmed = true
        };

        var create = await _userManager.CreateAsync(user, dto.Password);
        if (!create.Succeeded)
            return BadRequest(string.Join("; ", create.Errors.Select(e => e.Description)));

        var roleResult = await _userManager.AddToRoleAsync(user, "User");
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return BadRequest("Could not assign default role");
        }

        var submission = new UserFormSubmission
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            PublicUserId = publicId,
            Step1Json = draft.Step1Json,
            Step2Json = draft.Step2Json,
            Step3Json = draft.Step3Json,
            SubmittedAtUtc = DateTime.UtcNow
        };
        _db.UserFormSubmissions.Add(submission);
        _db.RegistrationDrafts.Remove(draft);
        await _db.SaveChangesAsync();

        var loginUrl = $"{_config["App:PublicUrl"]?.TrimEnd('/') ?? "http://localhost:5173"}/login";
        var body = $"""
                    <p>Hello {HtmlEncoder.Default.Encode(step1.FullName)},</p>
                    <p>Your account is ready.</p>
                    <p><strong>Your User ID:</strong> {HtmlEncoder.Default.Encode(publicId)}</p>
                    <p>Sign in at: <a href="{HtmlEncoder.Default.Encode(loginUrl)}">{HtmlEncoder.Default.Encode(loginUrl)}</a></p>
                    <p>Use your User ID and the password you chose. You will be prompted to change your password after first login.</p>
                    """;

        await _emailSender.SendAsync(step1.Email, "Your account and User ID", body);

        return Ok(new
        {
            message = "Registration complete. Check your email for your User ID.",
            publicUserId = publicId
        });
    }
}
