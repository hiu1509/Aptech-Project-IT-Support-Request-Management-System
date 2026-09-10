using AutoMapper;
using ITsupport.DTOs.Department;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class DepartmentProfile : Profile
    {
        public DepartmentProfile()
        {
            CreateMap<Department, DepartmentResponse>();
            CreateMap<CreateDepartmentRequest, Department>()
                .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.Code.Trim().ToUpperInvariant()));
            CreateMap<UpdateDepartmentRequest, Department>();
        }
    }
}