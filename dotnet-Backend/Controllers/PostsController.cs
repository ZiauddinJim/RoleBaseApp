/*
 * PostsController — CRUD posts with permission policies + ownership rules.
 * CAUSE: Edit/delete require posts.edit_own/delete_own policy; ownership bypass uses posts.manage_all
 *        so admins do not need separate code paths for role name strings.
 */
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
    [Authorize(Policy = "Perm:" + PermissionKeys.PostsView)]
    public async Task<IActionResult> GetPosts()
    {
        var posts = await _db.Posts
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(posts);
    }

    [HttpPost]
    [Authorize(Policy = "Perm:" + PermissionKeys.PostsCreate)]
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
    [Authorize(Policy = "Perm:" + PermissionKeys.PostsEditOwn)]
    public async Task<IActionResult> UpdatePost(string id, [FromBody] UpdatePostDto dto)
    {
        if (!Guid.TryParse(id, out var postId))
            return BadRequest("Invalid post id");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var post = await _db.Posts.FindAsync(postId);
        if (post == null) return NotFound("Post not found");

        var canManageAll = User.HasAppPermission(PermissionKeys.PostsManageAll);
        if (!canManageAll && post.CreatedByUserId != userId)
            return Forbid();

        if (!string.IsNullOrWhiteSpace(dto.Title))
            post.Title = dto.Title;

        if (!string.IsNullOrWhiteSpace(dto.Content))
            post.Content = dto.Content;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Post updated successfully" });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "Perm:" + PermissionKeys.PostsDeleteOwn)]
    public async Task<IActionResult> DeletePost(string id)
    {
        if (!Guid.TryParse(id, out var postId))
            return BadRequest("Invalid post id");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var post = await _db.Posts.FindAsync(postId);
        if (post == null) return NotFound("Post not found");

        var canManageAll = User.HasAppPermission(PermissionKeys.PostsManageAll);
        if (!canManageAll && post.CreatedByUserId != userId)
            return Forbid();

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Post deleted successfully" });
    }
}
