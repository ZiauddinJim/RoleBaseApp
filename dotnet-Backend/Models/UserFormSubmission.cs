/* Final snapshot of 3-step form JSON after onboarding complete (per user). */
public class UserFormSubmission
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string PublicUserId { get; set; } = string.Empty;
    public string Step1Json { get; set; } = "{}";
    public string Step2Json { get; set; } = "{}";
    public string Step3Json { get; set; } = "{}";
    public DateTime SubmittedAtUtc { get; set; }

    public ApplicationUser User { get; set; } = null!;
}
