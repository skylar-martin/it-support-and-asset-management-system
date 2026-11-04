using ITSupport.API.Data;
using ITSupport.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITSupport.API.Controllers;

[ApiController]
[Route("api/tickets/{ticketId:int}/attachments")]
public class TicketAttachmentsController(ITSupportDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    private const long MaxFileSize = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase) { ".png", ".jpg", ".jpeg", ".pdf", ".txt", ".docx" };
    private string StorageDirectory => Path.Combine(environment.ContentRootPath, "App_Data", "TicketAttachments");

    [HttpGet]
    public async Task<IActionResult> List(int ticketId)
    {
        if (!await db.Tickets.AnyAsync(t => t.Id == ticketId)) return NotFound("Ticket not found.");
        return Ok(await db.TicketAttachments.AsNoTracking().Where(a => a.TicketId == ticketId)
            .OrderBy(a => a.UploadedAt).Select(a => new { a.Id, a.TicketId, a.OriginalFileName, a.ContentType, a.SizeBytes, a.UploadedAt }).ToListAsync());
    }

    [HttpPost]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<IActionResult> Upload(int ticketId, [FromForm] IFormFile file)
    {
        if (!await db.Tickets.AnyAsync(t => t.Id == ticketId)) return NotFound("Ticket not found.");
        if (file == null || file.Length == 0 || file.Length > MaxFileSize) return BadRequest("Choose a file between 1 byte and 10 MB.");
        var original = Path.GetFileName(file.FileName);
        var ext = Path.GetExtension(original);
        if (!AllowedExtensions.Contains(ext)) return BadRequest("Allowed: PNG, JPG, PDF, TXT, DOCX.");
        var stored = Guid.NewGuid().ToString("N") + ext.ToLowerInvariant();
        Directory.CreateDirectory(StorageDirectory);
        var fullPath = Path.Combine(StorageDirectory, stored);
        try
        {
            await using (var stream = new FileStream(fullPath, FileMode.CreateNew)) await file.CopyToAsync(stream);
            if (!HasExpectedSignature(fullPath, ext)) { System.IO.File.Delete(fullPath); return BadRequest("File contents do not match its extension."); }
            var attachment = new TicketAttachment { TicketId = ticketId, OriginalFileName = original, StoredFileName = stored,
                ContentType = ext.ToLowerInvariant() switch { ".png" => "image/png", ".jpg" or ".jpeg" => "image/jpeg", ".pdf" => "application/pdf", ".txt" => "text/plain", _ => "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
                SizeBytes = file.Length };
            db.TicketAttachments.Add(attachment);
            await db.SaveChangesAsync();
            return Ok(new { attachment.Id, attachment.TicketId, attachment.OriginalFileName, attachment.ContentType, attachment.SizeBytes, attachment.UploadedAt });
        }
        catch { if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath); throw; }
    }

    [HttpGet("{attachmentId:int}/download")]
    public async Task<IActionResult> Download(int ticketId, int attachmentId)
    {
        var attachment = await db.TicketAttachments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId);
        if (attachment == null) return NotFound();
        var fullPath = Path.Combine(StorageDirectory, attachment.StoredFileName);
        if (!System.IO.File.Exists(fullPath)) return NotFound("File missing from storage.");
        return PhysicalFile(fullPath, "application/octet-stream", attachment.OriginalFileName);
    }

    [HttpDelete("{attachmentId:int}")]
    public async Task<IActionResult> Delete(int ticketId, int attachmentId)
    {
        var attachment = await db.TicketAttachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId);
        if (attachment == null) return NotFound();
        db.TicketAttachments.Remove(attachment);
        await db.SaveChangesAsync();
        var path = Path.Combine(StorageDirectory, attachment.StoredFileName);
        try { System.IO.File.Delete(path); } catch (IOException) { }
        return NoContent();
    }

    private static bool HasExpectedSignature(string path, string extension)
    {
        using var stream = System.IO.File.OpenRead(path);
        Span<byte> header = stackalloc byte[8];
        var read = stream.Read(header);
        return extension.ToLowerInvariant() switch
        {
            ".png" => read >= 8 && header[..8].SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            ".jpg" or ".jpeg" => read >= 3 && header[0] == 255 && header[1] == 216 && header[2] == 255,
            ".pdf" => read >= 4 && header[..4].SequenceEqual(new byte[] { 37, 80, 68, 70 }),
            ".docx" => read >= 4 && header[..4].SequenceEqual(new byte[] { 80, 75, 3, 4 }),
            _ => true
        };
    }
}
