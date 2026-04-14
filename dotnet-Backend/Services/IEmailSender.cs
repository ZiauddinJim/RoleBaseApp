/*
 * IEmailSender — abstraction so dev can run without SMTP (LoggingEmailSender).
 */
public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
