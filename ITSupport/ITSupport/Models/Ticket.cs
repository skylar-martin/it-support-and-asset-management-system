namespace ITSupport.API.Models;
public class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Priority { get; set; } = "Medium";
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int? AssetId { get; set; }
    public Asset? Asset { get; set; }
    public List<TicketAttachment> Attachments { get; set; } = new();
}
