using AutoMapper;
using ITsupport.DTOs.EmailNotification;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class EmailNotificationProfile : Profile
    {
        public EmailNotificationProfile()
        {
            CreateMap<EmailNotification, EmailNotificationResponse>()
                .ForMember(dest => dest.RecipientUserName, opt => opt.MapFrom(src => src.RecipientUser != null ? src.RecipientUser.FullName : null));

            CreateMap<CreateEmailNotificationRequest, EmailNotification>()
                .ForMember(dest => dest.EventCode, opt => opt.MapFrom(src => src.EventCode.Trim().ToUpperInvariant()))
                .ForMember(dest => dest.SendStatus, opt => opt.MapFrom(_ => "PENDING"));
        }
    }
}