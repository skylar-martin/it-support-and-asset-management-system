using ITSupport.API.Data;
using ITSupport.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace ITSupport.API.Controllers;
public record AssetInput(string Name, string AssetTag, string Type, string Status, int? AssignedUserId);
[ApiController, Route("api/assets")]
public class AssetsController(ITSupportDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await db.Assets.AsNoTracking().OrderBy(a => a.Id)
        .Select(a => new { a.Id, a.Name, a.AssetTag, a.Type, a.Status, a.AssignedUserId, AssignedUserName = a.AssignedUser == null ? null : a.AssignedUser.Name }).ToListAsync());
    [HttpPost]
    public async Task<IActionResult> Create(AssetInput input)
    {
        var error = await Validate(input);
        if (error != null) return BadRequest(error);
        var asset = new Asset { Name = input.Name.Trim(), AssetTag = input.AssetTag.Trim(), Type = input.Type, Status = input.Status, AssignedUserId = input.AssignedUserId };
        db.Assets.Add(asset); await db.SaveChangesAsync();
        return Ok(new { asset.Id });
    }
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, AssetInput input)
    {
        var asset = await db.Assets.FindAsync(id);
        if (asset == null) return NotFound();
        var error = await Validate(input, id);
        if (error != null) return BadRequest(error);
        asset.Name = input.Name.Trim(); asset.AssetTag = input.AssetTag.Trim(); asset.Type = input.Type;
        asset.Status = input.Status; asset.AssignedUserId = input.AssignedUserId;
        await db.SaveChangesAsync(); return NoContent();
    }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var asset = await db.Assets.FindAsync(id);
        if (asset == null) return NotFound();
        db.Assets.Remove(asset); await db.SaveChangesAsync(); return NoContent();
    }
    private async Task<string?> Validate(AssetInput a, int? exceptId = null)
    {
        if (string.IsNullOrWhiteSpace(a.Name) || string.IsNullOrWhiteSpace(a.AssetTag)) return "Name and asset tag are required.";
        if (!new[] { "Active", "Repair", "Retired" }.Contains(a.Status)) return "Invalid asset status.";
        if (await db.Assets.AnyAsync(x => x.AssetTag == a.AssetTag && x.Id != exceptId)) return "Asset tag already exists.";
        if (a.AssignedUserId != null && !await db.Users.AnyAsync(x => x.Id == a.AssignedUserId)) return "Assigned user not found.";
        return null;
    }
}
