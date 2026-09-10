using AutoMapper;
using ITsupport.DTOs.User;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<User, UserResponse>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null));

            CreateMap<CreateUserRequest, User>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.Trim().ToLowerInvariant()))
                .ForMember(dest => dest.EmployeeCode, opt => opt.MapFrom(src => string.IsNullOrWhiteSpace(src.EmployeeCode) ? null : src.EmployeeCode.Trim().ToUpperInvariant()))
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

            CreateMap<UpdateUserRequest, User>()
                .ForMember(dest => dest.EmployeeCode, opt => opt.MapFrom(src => string.IsNullOrWhiteSpace(src.EmployeeCode) ? null : src.EmployeeCode.Trim().ToUpperInvariant()));
        }
    }
}