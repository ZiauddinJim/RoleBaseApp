public class LoginDto
{
    /// <summary>Email or public user id (RB-YYYY-XXXXXXXX).</summary>
    public string UserIdOrEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
