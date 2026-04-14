/*
 * ApplicationDbContext — single EF Core database for Identity + app entities.
 * CAUSE: IdentityDbContext<ApplicationUser> gives Users/Roles/Claims tables;
 *        we add Posts, Permission, RolePermission, drafts, and form submissions.
 */
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RegistrationDraft> RegistrationDrafts => Set<RegistrationDraft>();
    public DbSet<UserFormSubmission> UserFormSubmissions => Set<UserFormSubmission>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Post>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(500);
            entity.HasIndex(e => e.CreatedAt);
        });

        builder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Key).HasMaxLength(128);
            entity.Property(e => e.Name).HasMaxLength(256);
            entity.HasIndex(e => e.Key).IsUnique();
        });

        builder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(e => new { e.RoleId, e.PermissionId });
            entity.HasOne(e => e.Role)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(e => e.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<RegistrationDraft>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DraftToken).HasMaxLength(64);
            entity.HasIndex(e => e.DraftToken).IsUnique();
        });

        builder.Entity<UserFormSubmission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PublicUserId).HasMaxLength(64);
            entity.HasIndex(e => e.UserId);
            entity.HasOne(e => e.User)
                .WithMany(u => u.FormSubmissions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.PublicUserId).HasMaxLength(64);
            entity.HasIndex(e => e.PublicUserId).IsUnique().HasFilter("[PublicUserId] IS NOT NULL");
        });
    }
}
