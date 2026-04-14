/* Temporary onboarding payload; DraftToken is client-held until complete or expiry. */
public class RegistrationDraft
{
    public Guid Id { get; set; }
    public string DraftToken { get; set; } = string.Empty;
    public string Step1Json { get; set; } = "{}";
    public string Step2Json { get; set; } = "{}";
    public string Step3Json { get; set; } = "{}";
    public DateTime ExpiresAtUtc { get; set; }
}
