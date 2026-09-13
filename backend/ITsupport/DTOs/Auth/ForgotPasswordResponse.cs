using System;

namespace ITsupport.DTOs.Auth
{
    public class ForgotPasswordResponse
    {
        public string Message { get; set; }
            = string.Empty;


        // Chỉ trả trong Development để test.
        public string? ResetToken { get; set; }


        public DateTime? ExpiresAt { get; set; }
    }
}