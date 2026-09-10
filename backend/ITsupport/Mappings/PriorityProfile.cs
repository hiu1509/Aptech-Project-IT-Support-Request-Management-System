using AutoMapper;
using ITsupport.DTOs.Priority;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class PriorityProfile : Profile
    {
        public PriorityProfile()
        {
            CreateMap<Priority, PriorityResponse>();
            CreateMap<CreatePriorityRequest, Priority>()
                .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.Code.Trim().ToUpperInvariant()));
            CreateMap<UpdatePriorityRequest, Priority>();
        }
    }
}