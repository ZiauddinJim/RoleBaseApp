using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

public class Post
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    
    // Authorization / Ownership
    [BsonRepresentation(BsonType.ObjectId)]
    public string CreatedByUserId { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
