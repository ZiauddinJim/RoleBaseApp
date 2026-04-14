public class CreateRoleDto
{
    public string Name { get; set; } = string.Empty;
}

public class SetRolePermissionsDto
{
    public List<Guid> PermissionIds { get; set; } = new();
}
