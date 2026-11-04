namespace ITSupport.API.Models;
public class AppUser
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Department { get; set; } = "";
    public string Role { get; set; } = "Employee";
    public List<Asset> Assets { get; set; } = new();
    public List<Ticket> Tickets { get; set; } = new();
}
