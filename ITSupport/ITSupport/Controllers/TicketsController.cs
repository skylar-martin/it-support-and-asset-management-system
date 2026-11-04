using ITSupport.API.Data;
using ITSupport.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace ITSupport.API.Controllers;
public record TicketInput(string Title, string Description, string Priority, string Status, int UserId, int? AssetId);
[ApiController, Route("api/tickets")]
public class TicketsController(ITSupportDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await db.Tickets.AsNoTracking().OrderByDescending(t => t.CreatedAt)
        .Select(t => new { t.Id, t.Title, t.Description, t.Priority, t.Status, t.CreatedAt, t.UserId,
            UserName = t.User.Name, t.AssetId, AssetName = t.Asset == null ? null : t.Asset.Name }).ToListAsync());
    [HttpPost]
    public async Task<IActionResult> Create(TicketInput input)
    {
        var error = await Validate(input);
        if (error != null) return BadRequest(error);
        var ticket = new Ticket { Title = input.Title.Trim(), Description = input.Description.Trim(), Priority = input.Priority,
            Status = input.Status, UserId = input.UserId, AssetId = input.AssetId };
        db.Tickets.Add(ticket); await db.SaveChangesAsync(); return Ok(new { ticket.Id });
    }
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, TicketInput input)
    {
        var ticket = await db.Tickets.FindAsync(id);
        if (ticket == null) return NotFound();
        var error = await Validate(input);
        if (error != null) return BadRequest(error);
        ticket.Title = input.Title.Trim(); ticket.Description = input.Description.Trim(); ticket.Priority = input.Priority;
        ticket.Status = input.Status; ticket.UserId = input.UserId; ticket.AssetId = input.AssetId;
        await db.SaveChangesAsync(); return NoContent();
    }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ticket = await db.Tickets.FindAsync(id);
        if (ticket == null) return NotFound();
        var files = await db.TicketAttachments.Where(a => a.TicketId == id).Select(a => a.StoredFileName).ToListAsync();
        db.Tickets.Remove(ticket); await db.SaveChangesAsync();
        foreach (var file in files) { try { System.IO.File.Delete(Path.Combine(environment.ContentRootPath, "App_Data", "TicketAttachments", file)); } catch (IOException) { } }
        return NoContent();
    }
    private async Task<string?> Validate(TicketInput t)
    {
        if (string.IsNullOrWhiteSpace(t.Title) || string.IsNullOrWhiteSpace(t.Description)) return "Title and description are required.";
        if (!new[] { "Low", "Medium", "High" }.Contains(t.Priority)) return "Invalid priority.";
        if (!new[] { "Open", "In Progress", "Resolved" }.Contains(t.Status)) return "Invalid status.";
        if (!await db.Users.AnyAsync(x => x.Id == t.UserId)) return "User not found.";
        if (t.AssetId != null && !await db.Assets.AnyAsync(x => x.Id == t.AssetId)) return "Asset not found.";
        return null;
    }
}
