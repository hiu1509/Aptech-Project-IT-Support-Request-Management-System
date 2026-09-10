using AutoMapper;
using ITsupport.DTOs.PasswordReset;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class PasswordResetProfile : Profile
    {
        public PasswordResetProfile()
        {
            CreateMap<PasswordResetToken, PasswordResetTokenResponse>()
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email));
        }
    }
}