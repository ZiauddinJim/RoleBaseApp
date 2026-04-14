using System.Text.Json;

public class OnboardingDraftDto
{
    public string? DraftToken { get; set; }
    public int Step { get; set; }
    public JsonElement Data { get; set; }
}

public class OnboardingCompleteDto
{
    public string DraftToken { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class OnboardingStep1Data
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class OnboardingStep2Data
{
    public string Company { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
}

public class OnboardingStep3Data
{
    public string Bio { get; set; } = string.Empty;
    public string Goals { get; set; } = string.Empty;
    public string ProfileImageUrl { get; set; } = string.Empty;
}

public class UpdateMySubmissionDto
{
    public OnboardingStep1Data Step1 { get; set; } = new();
    public OnboardingStep2Data Step2 { get; set; } = new();
    public OnboardingStep3Data Step3 { get; set; } = new();
}
