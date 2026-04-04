using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PostsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetPosts()
    {
        var posts = await _db.Posts
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(posts);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest("Title is required");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var post = new Post
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Content = dto.Content ?? string.Empty,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();
        return Ok(post);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePost(string id, [FromBody] UpdatePostDto dto)
    {
        if (!Guid.TryParse(id, out var postId))
            return BadRequest("Invalid post id");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userId == null) return Unauthorized();

        var post = await _db.Posts.FindAsync(postId);
        if (post == null) return NotFound("Post not found");

        if (role != "Admin" && post.CreatedByUserId != userId)
            return Forbid("You can only edit your own posts.");

        if (!string.IsNullOrWhiteSpace(dto.Title))
            post.Title = dto.Title;

        if (!string.IsNullOrWhiteSpace(dto.Content))
            post.Content = dto.Content;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Post updated successfully" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePost(string id)
    {
        if (!Guid.TryParse(id, out var postId))
            return BadRequest("Invalid post id");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userId == null) return Unauthorized();

        var post = await _db.Posts.FindAsync(postId);
        if (post == null) return NotFound("Post not found");

        if (role != "Admin" && post.CreatedByUserId != userId)
            return Forbid("You can only delete your own posts.");

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Post deleted successfully" });
    }
}
