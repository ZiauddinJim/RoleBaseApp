public class CreatePostDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class UpdatePostDto
{
    public string? Title { get; set; }
    public string? Content { get; set; }
}
