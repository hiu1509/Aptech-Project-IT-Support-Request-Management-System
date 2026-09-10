using AutoMapper;
using ITsupport.DTOs.RequestHistory;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class RequestHistoryProfile : Profile
    {
        public RequestHistoryProfile()
        {
            CreateMap<RequestHistory, RequestHistoryResponse>()
                .ForMember(dest => dest.FromStatusName, opt => opt.MapFrom(src => src.FromStatus != null ? src.FromStatus.Name : null))
                .ForMember(dest => dest.ToStatusName, opt => opt.MapFrom(src => src.ToStatus != null ? src.ToStatus.Name : null))
                .ForMember(dest => dest.PerformedByUserName, opt => opt.MapFrom(src => src.PerformedByUser != null ? src.PerformedByUser.FullName : null));

            CreateMap<CreateHistoryRequest, RequestHistory>()
                .ForMember(dest => dest.ActionCode, opt => opt.MapFrom(src => src.ActionCode.Trim().ToUpperInvariant()));
        }
    }
}