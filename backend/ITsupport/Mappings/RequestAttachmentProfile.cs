using AutoMapper;
using ITsupport.DTOs.RequestAttachment;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class RequestAttachmentProfile : Profile
    {
        public RequestAttachmentProfile()
        {
            CreateMap<RequestAttachment, AttachmentResponse>()
                .ForMember(dest => dest.UploadedByUserName, opt => opt.MapFrom(src => src.UploadedByUser.FullName));
        }
    }
}