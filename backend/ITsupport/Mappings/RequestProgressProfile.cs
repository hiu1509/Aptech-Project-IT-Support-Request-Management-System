using AutoMapper;
using ITsupport.DTOs.RequestProgress;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class RequestProgressProfile : Profile
    {
        public RequestProgressProfile()
        {
            CreateMap<RequestProgress, RequestProgressResponse>()
                .ForMember(dest => dest.UpdatedByUserName, opt => opt.MapFrom(src => src.UpdatedByUser.FullName))
                .ForMember(dest => dest.UpdatedByUserEmployeeCode, opt => opt.MapFrom(src => src.UpdatedByUser.EmployeeCode));

            CreateMap<CreateProgressRequest, RequestProgress>();
        }
    }
}