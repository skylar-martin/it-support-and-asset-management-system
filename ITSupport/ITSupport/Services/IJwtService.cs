//Code resued from previous group project where I did the Authentication part of the program. Needs modification to fit the program.

namespace ITSupport.Services
{
    public class IJwtService
    {
        string GenerateToken(User user, IList<string> roles);
    }
}
