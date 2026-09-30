# Postman Collection — IT Support Request Management System

`ITSupport.postman_collection.json` khớp đúng **API thật** của `backend/ITsupport`
(đã test bằng Newman trên DB sạch, 90/90 request chạy đúng). File
`docs/api-spec.yaml` cũ đã lệch với backend thật (do backend được build lại độc
lập sau đó) — dùng file Postman này để test tay, không dùng lại api-spec.yaml.

## Cách dùng

1. Chạy backend: `cd backend/ITsupport && dotnet run` (mặc định `http://localhost:5219`).
2. Mở Postman → **Import** → chọn `ITSupport.postman_collection.json`.
3. Chạy lần lượt từ folder **"0. Auth"** trở xuống — 5 request Login đầu tiên
   sẽ tự động lưu token vào biến của collection (`admin_token`,
   `employee_token`, `coordinator_token`, `leader_token`, `itstaff_token`).
   Các request phía sau tự dùng lại, không cần copy tay.
4. Có thể bấm **Run collection** (Collection Runner) để chạy tuần tự toàn bộ
   — folder **"3. Vòng đời Ticket"** đi từ tạo yêu cầu (UC05) đến khách hàng
   xác nhận hoàn thành (UC19) trên 1 ticket; folder **"3b."** tạo 1 ticket
   riêng để test đủ 2 nhánh rẽ (UC18 kiểm tra không đạt, UC20 người dùng từ
   chối) mà không đụng ticket ở folder 3 (ticket đó đã COMPLETED/đóng).

## 3 request cần thao tác tay (không tự động hóa được)

Postman không thể tự đính kèm file khi lưu collection — mở các request sau,
vào tab **Body**, bấm vào ô **File** và chọn 1 file thật trước khi Send:

- `3. Vòng đời Ticket › UC22 - Employee đính kèm file` (jpg/pdf/doc/docx, ≤10MB)
- `5. ... › Attachments - Download by id` (phụ thuộc file ở trên đã upload thành công)
- `9. Upload file chung › FileStorage - Upload`

Chạy qua Newman (CLI, không chọn được file) 3 request này sẽ trả lỗi 400/405 —
đúng như dự kiến, không phải bug.

## Tài khoản mẫu (đã seed sẵn)

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | admin@itsupport.local | Admin@123 |
| Employee | employee@itsupport.local | Employee@123 |
| Coordinator | coordinator@itsupport.local | 123456 |
| Leader | leader@itsupport.local | 123456 |
| IT Staff | itstaff@itsupport.local | 123456 |

## Bug phát hiện được nhờ bộ test này (đã sửa trong cùng đợt)

- `DELETE /api/Department/{id}` trả lỗi 500 (crash) khi phòng ban đang có
  người dùng tham chiếu, thay vì lỗi nghiệp vụ rõ ràng — đã sửa để trả
  `400 DEPARTMENT_IN_USE`.
- `POST /api/files/upload` luôn crash 500 (`IFileService` chưa được đăng ký
  Dependency Injection trong `Program.cs`) — đã đăng ký lại, endpoint chạy
  được bình thường (dù FE hiện không dùng endpoint này).
