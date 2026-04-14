public class CreatePermissionDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdatePermissionDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
