using MongoDB.Driver;

// MongoDB service class to manage database connection and collections
public class MongoDbService
{
    // Private readonly field to store database instance
    private readonly IMongoDatabase _database;

    // Constructor: runs automatically when service is created
    public MongoDbService(IConfiguration config)
    {
        // Create MongoDB client using connection string from appsettings.json
        var client = new MongoClient(config["MongoDb:ConnectionString"]);

        // Get database by name from appsettings.json
        _database = client.GetDatabase(config["MongoDb:DatabaseName"]);
    }

    // Property to access "Users" collection
    // IMongoCollection<User> means this collection stores User documents
    public IMongoCollection<User> Users =>
        _database.GetCollection<User>("Users");
}