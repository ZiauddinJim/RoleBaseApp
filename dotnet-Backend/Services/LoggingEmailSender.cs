/* CAUSE: No SMTP in appsettings → still run API; onboarding/forgot log intent instead of sending. */
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger) => _logger = logger;

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            "Email not sent (SMTP not configured). To: {To}, Subject: {Subject}",
            toEmail, subject);
        return Task.CompletedTask;
    }
}
