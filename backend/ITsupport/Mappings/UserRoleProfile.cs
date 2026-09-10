using AutoMapper;
using ITsupport.DTOs.UserRole;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class UserRoleProfile : Profile
    {
        public UserRoleProfile()
        {
            CreateMap<UserRole, UserRoleResponse>()
                .ForMember(dest => dest.UserFullName, opt => opt.MapFrom(src => src.User.FullName))
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.RoleCode, opt => opt.MapFrom(src => src.Role.Code))
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.Name))
                .ForMember(dest => dest.AssignedByFullName, opt => opt.MapFrom(src => src.AssignedByUser != null ? src.AssignedByUser.FullName : null));
        }
    }
}