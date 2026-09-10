namespace ITsupport.Models
{
    public class ApiResult<T>
    {
        public bool IsSuccess { get; init; }
        public string? ErrorCode { get; init; }
        public string? Message { get; init; }
        public T? Data { get; init; }
        public static ApiResult<T> Success(T data, string? message = null)
        {
            return new ApiResult<T>
            {
                IsSuccess = true,
                Data = data,
                Message = message
            };
        }
        public static ApiResult<T> Failure(string errorCode,
            string? message = "Failure")
        {
            return new ApiResult<T>
            {
                IsSuccess = false,
                ErrorCode = errorCode,
                Message = message
            };
        }
    }
}
