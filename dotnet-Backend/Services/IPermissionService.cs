public interface IPermissionService
{
    Task<List<string>> GetPermissionKeysForUserAsync(string userId, CancellationToken cancellationToken = default);
}
