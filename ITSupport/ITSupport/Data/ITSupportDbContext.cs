using ITSupport.API.Models;
using Microsoft.EntityFrameworkCore;
namespace ITSupport.API.Data;
public class ITSupportDbContext(DbContextOptions<ITSupportDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Asset>().HasIndex(x => x.AssetTag).IsUnique();
        modelBuilder.Entity<Asset>().HasOne(x => x.AssignedUser).WithMany(x => x.Assets)
            .HasForeignKey(x => x.AssignedUserId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Ticket>().HasOne(x => x.User).WithMany(x => x.Tickets)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<TicketAttachment>().HasOne(x => x.Ticket).WithMany(x => x.Attachments)
            .HasForeignKey(x => x.TicketId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Ticket>().HasOne(x => x.Asset).WithMany(x => x.Tickets)
            .HasForeignKey(x => x.AssetId).OnDelete(DeleteBehavior.SetNull);
    }
}
