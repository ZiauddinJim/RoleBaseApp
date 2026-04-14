/*
 * ApplicationUser — extended Identity user.
 * CAUSE: PublicUserId is display/login id for onboarding flow (UserName also set to same value).
 *        MustChangePassword drives first-login UX until user calls change-password.
 */
using Microsoft.AspNetCore.Identity;

public class ApplicationUser : IdentityUser
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Human-readable login ID (e.g. RB-2026-AB12CD34). Null for legacy email-username accounts.</summary>
    public string? PublicUserId { get; set; }

    public bool MustChangePassword { get; set; }

    public ICollection<UserFormSubmission> FormSubmissions { get; set; } = new List<UserFormSubmission>();
}
