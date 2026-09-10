using AutoMapper;
using ITsupport.DTOs.RequestStatus;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class RequestStatusProfile : Profile
    {
        public RequestStatusProfile()
        {
            CreateMap<RequestStatus, RequestStatusResponse>();
            CreateMap<CreateRequestStatusRequest, RequestStatus>()
                .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.Code.Trim().ToUpperInvariant()));
            CreateMap<UpdateRequestStatusRequest, RequestStatus>();
        }
    }
}