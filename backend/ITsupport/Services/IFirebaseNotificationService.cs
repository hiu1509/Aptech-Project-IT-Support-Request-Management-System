using System.Collections.Generic;
using System.Threading.Tasks;

namespace ITsupport.Services
{
    public interface IFirebaseNotificationService
    {
        Task<bool> SendToDeviceAsync(
            string fcmToken,
            string title,
            string body,
            Dictionary<string, string>? data = null
        );
    }
}