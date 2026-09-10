using AutoMapper;
using ITsupport.DTOs.Role;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class RoleProfile : Profile
    {
        public RoleProfile()
        {
            CreateMap<Role, RoleResponse>();
            CreateMap<CreateRoleRequest, Role>()
                .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.Code.Trim().ToUpperInvariant()));
            CreateMap<UpdateRoleRequest, Role>();
        }
    }
}