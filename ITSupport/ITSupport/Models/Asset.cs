namespace ITSupport.API.Models;
public class Asset
{
    public int Id { get; set; }
    public string AssetTag { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "Laptop";
    public string Status { get; set; } = "Active";
    public int? AssignedUserId { get; set; }
    public AppUser? AssignedUser { get; set; }
    public List<Ticket> Tickets { get; set; } = new();
}
