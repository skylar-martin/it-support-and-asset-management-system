using ITSupport.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace ITSupport.API.Controllers;
[ApiController, Route("api/users")]
public class UsersController(ITSupportDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await db.Users.AsNoTracking()
        .OrderBy(u => u.Id).Select(u => new { u.Id, u.Name, u.Email, u.Department, u.Role }).ToListAsync());
}
