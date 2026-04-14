/*
 * SmtpEmailSender — sends real mail when Email:Smtp:Host is set in configuration.
 */
using System.Net;
using System.Net.Mail;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var section = _config.GetSection("Email:Smtp");
        var host = section["Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogWarning("SMTP Host missing; skipping email to {To}", toEmail);
            return;
        }

        var port = int.TryParse(section["Port"], out var p) ? p : 587;
        var user = section["User"];
        var pass = section["Password"];
        var from = section["From"] ?? user;
        var enableSsl = bool.TryParse(section["EnableSsl"], out var ssl) && ssl;

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
            Credentials = string.IsNullOrEmpty(user)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(user, pass)
        };

        using var message = new MailMessage(from!, toEmail)
        {
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        await client.SendMailAsync(message, cancellationToken);
    }
}
