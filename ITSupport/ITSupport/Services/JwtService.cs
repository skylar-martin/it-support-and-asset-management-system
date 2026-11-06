//Code from previous group project I worked on where I did the Authentication part. Needs modifacation to fit in the program.
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ITSupport.Services
{
    public class JwtService
    {
        public string GenerateToken(User user, IList<string> roles)
        {
            var jwtCfg = config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtCfg["SecretKey"]!));

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub,   user.UserID.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
                new("fullName", $"{user.FirstName} {user.LastName}")
            };
            claims.AddRange(roles.Select(r => new Claim("role", r)));

            var token = new JwtSecurityToken(
                issuer: jwtCfg["Issuer"],
                audience: jwtCfg["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    int.Parse(jwtCfg["ExpiryInMinutes"]!)),
                signingCredentials: new SigningCredentials(
                    key, SecurityAlgorithms.HmacSha256));

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
