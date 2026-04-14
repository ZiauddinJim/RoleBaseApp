/*
 * PublicUserIdGenerator — unique RB-YYYY-XXXXXXXX style id for onboarding users.
 * CAUSE: UserName = public id so FindByNameAsync works for login; must not collide with email usernames.
 */
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;

public class PublicUserIdGenerator
{
    private readonly ApplicationDbContext _db;

    public PublicUserIdGenerator(ApplicationDbContext db) => _db = db;

    public async Task<string> GenerateUniqueAsync(CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var suffix = Convert.ToHexString(RandomNumberGenerator.GetBytes(4));
            var id = $"RB-{DateTime.UtcNow:yyyy}-{suffix}";

            var taken = await _db.Users.AnyAsync(
                u => u.UserName == id || u.PublicUserId == id,
                cancellationToken);
            if (!taken)
                return id;
        }

        throw new InvalidOperationException("Could not generate a unique public user id.");
    }
}
