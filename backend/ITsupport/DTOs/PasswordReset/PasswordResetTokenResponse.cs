namespace ITsupport.DTOs.PasswordReset
{
    public class PasswordResetTokenResponse
    {
        public long Id { get; set; }
        public int UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsExpired => DateTime.UtcNow > ExpiresAt;
        public bool IsUsed => UsedAt.HasValue;
    }
}