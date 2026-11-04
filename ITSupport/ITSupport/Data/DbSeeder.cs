using ITSupport.API.Models;
using Microsoft.EntityFrameworkCore;
namespace ITSupport.API.Data;
public static class DbSeeder
{
    public static async Task SeedAsync(ITSupportDbContext db)
    {
        if (await db.Users.AnyAsync()) return;
        var users = new[] {
            new AppUser { Name = "Alex Morgan", Email = "alex@example.test", Department = "Marketing", Role = "Employee" },
            new AppUser { Name = "Jordan Lee", Email = "jordan@example.test", Department = "Finance", Role = "Employee" },
            new AppUser { Name = "Sam Rivera", Email = "sam@example.test", Department = "Operations", Role = "Employee" },
            new AppUser { Name = "Taylor Kim", Email = "taylor@example.test", Department = "IT", Role = "Admin" }
        };
        db.Users.AddRange(users);
        var assets = new[] {
            new Asset { AssetTag = "LT-1001", Name = "Dell Latitude 7440", Type = "Laptop", AssignedUser = users[0] },
            new Asset { AssetTag = "MN-1002", Name = "Dell UltraSharp 27", Type = "Monitor", AssignedUser = users[0] },
            new Asset { AssetTag = "LT-1003", Name = "HP EliteBook 840", Type = "Laptop", AssignedUser = users[1] },
            new Asset { AssetTag = "DT-1004", Name = "Lenovo ThinkCentre", Type = "Desktop", AssignedUser = users[2] },
            new Asset { AssetTag = "PR-1005", Name = "Brother Office Printer", Type = "Printer", Status = "Repair" }
        };
        db.Assets.AddRange(assets);
        db.Tickets.AddRange(
            new Ticket { Title = "Laptop battery drains quickly", Description = "Battery lasts less than an hour.", Priority = "High", User = users[0], Asset = assets[0], Status = "Open", CreatedAt = DateTime.UtcNow.AddDays(-2) },
            new Ticket { Title = "Monitor flickering", Description = "Screen flashes occasionally.", Priority = "Medium", User = users[0], Asset = assets[1], Status = "In Progress", CreatedAt = DateTime.UtcNow.AddDays(-1) },
            new Ticket { Title = "Cannot connect to VPN", Description = "VPN authentication fails.", Priority = "High", User = users[1], Status = "Resolved", CreatedAt = DateTime.UtcNow.AddDays(-5) }
        );
        await db.SaveChangesAsync();
    }
}
