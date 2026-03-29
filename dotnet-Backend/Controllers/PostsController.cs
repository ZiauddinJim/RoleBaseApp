using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Must be logged in
public class PostsController : ControllerBase
{
    private readonly MongoDbService _db;

    public PostsController(MongoDbService db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetPosts()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null) return Unauthorized();

        if (role == "Admin" || role == "Manager")
        {
            var posts = await _db.Posts.Find(_ => true)
                .SortByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(posts);
        }

        var userPosts = await _db.Posts.Find(x => x.CreatedByUserId == userId)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(userPosts);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest("Title is required");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var post = new Post
        {
            Title = dto.Title,
            Content = dto.Content,
            CreatedByUserId = userId
        };

        await _db.Posts.InsertOneAsync(post);
        return Ok(post);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePost(string id, [FromBody] UpdatePostDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userId == null) return Unauthorized();

        var post = await _db.Posts.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (post == null) return NotFound("Post not found");

        //  FIXED LOGIC
        if (role != "Admin" && post.CreatedByUserId != userId)
        {
            return Forbid("You can only edit your own posts.");
        }

        if (!string.IsNullOrWhiteSpace(dto.Title))
            post.Title = dto.Title;

        if (!string.IsNullOrWhiteSpace(dto.Content))
            post.Content = dto.Content;

        await _db.Posts.ReplaceOneAsync(x => x.Id == id, post);

        return Ok(new { message = "Post updated successfully" });
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePost(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userId == null) return Unauthorized();

        var post = await _db.Posts.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (post == null) return NotFound("Post not found");

        //  FIXED LOGIC
        if (role != "Admin" && post.CreatedByUserId != userId)
        {
            return Forbid("You can only delete your own posts.");
        }

        await _db.Posts.DeleteOneAsync(x => x.Id == id);

        return Ok(new { message = "Post deleted successfully" });
    }
}
