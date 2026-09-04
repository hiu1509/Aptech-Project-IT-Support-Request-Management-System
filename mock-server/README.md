# ITSupport Mock API Server

Server giả lập (Node.js + Express) implement **đầy đủ** [`../docs/api-spec.yaml`](../docs/api-spec.yaml)
với dữ liệu mẫu và đúng state machine workflow trong
[`../docs/API_GUIDE.md`](../docs/API_GUIDE.md). Mục đích: để Frontend cắm vào
gọi API thật (login, tạo yêu cầu, xem danh sách, đi qua từng bước xử lý...) mà
**không cần chờ backend ASP.NET** làm xong.

> Đây là **mock**, không phải backend thật: dữ liệu lưu trong RAM (mất khi
> restart), mật khẩu lưu plain text, JWT ký bằng secret cố định trong code.
> Không dùng lại bất kỳ phần nào của thư mục này cho production/ASP.NET.

## Chạy thử

```bash
cd mock-server
npm install
npm run dev      # hoặc: npm start
```

Server chạy tại `http://localhost:4000` (đổi bằng biến môi trường `PORT` nếu cần).
FE chỉ cần trỏ `axios` baseURL vào đây trong lúc dev, sau này đổi sang URL
ASP.NET thật là xong — không phải sửa gì khác vì response shape giống hệt spec.

## Tài khoản mẫu (đăng nhập qua `POST /api/auth/login`)

| Email                          | Mật khẩu         | Vai trò      |
| ------------------------------- | ----------------- | ------------- |
| admin@itsupport.local           | Admin@123          | Admin         |
| employee1@itsupport.local       | Employee@123       | Employee      |
| employee2@itsupport.local       | Employee@123       | Employee      |
| coordinator@itsupport.local     | Coordinator@123     | Coordinator   |
| itleader@itsupport.local        | ITLeader@123        | ITLeader      |
| itstaff1@itsupport.local        | ITStaff@123         | ITStaff       |
| itstaff2@itsupport.local        | ITStaff@123         | ITStaff       |

Dữ liệu mẫu có sẵn 6 `SupportRequests` ở nhiều trạng thái khác nhau (NEW,
WAITING_COORDINATOR, IN_PROGRESS, WAITING_USER_CONFIRMATION, COMPLETED, REWORK)
để FE có thể dựng UI cho từng trạng thái ngay mà không cần tự tạo dữ liệu.

## Những gì đã implement

- Toàn bộ ~40 endpoint trong `api-spec.yaml` (Auth, Users/Roles, Departments,
  Categories/Priorities/ITGroups, Requests + toàn bộ 16 bước workflow,
  Comments, Attachments (upload file thật, lưu ở `mock-server/uploads/`),
  History, Dashboard, Reports).
- **State machine đúng luồng**: gọi sai thứ tự (vd `accept` một request đã
  `ACCEPTED`) trả `409` kèm message rõ ràng, không âm thầm bỏ qua.
- **Phân quyền theo role**: sai role trả `403`; danh sách `GET /api/requests`
  tự lọc theo phạm vi truy cập (Employee thấy request của mình, Coordinator
  thấy request mình phụ trách, ITLeader/ITStaff thấy theo nhóm/theo được giao,
  Admin thấy tất cả) — xem `src/data/repo.js#scopeRequestsForActor`.
- JWT thật (ký bằng `jsonwebtoken`), request cần header
  `Authorization: Bearer <token>` giống hệt hành vi mong đợi của backend thật.

## Cấu trúc thư mục

```
mock-server/
  src/
    data/        # in-memory store (store.js), seed data (seed.js), query helpers (repo.js)
    middleware/   # auth.js - verify JWT, role guard
    workflow/     # constants.js (status/role codes), stateMachine.js (bang chuyen trang thai)
    routes/       # 1 file / nhom endpoint, khop tag trong api-spec.yaml
    utils/        # serialize.js - chuyen row noi bo (PascalCase) sang JSON response (camelCase)
    app.js        # wiring middleware + routes
    server.js     # entrypoint (npm start / npm run dev)
  uploads/        # file upload thuc te tu UC22, khong commit noi dung (xem .gitignore)
```

## Giới hạn đã biết (chấp nhận được vì đây chỉ là mock)

- Dữ liệu **không persist** — restart server là mất hết, mỗi lần chạy lại về
  đúng bộ dữ liệu mẫu trong `src/data/seed.js`.
- Không có validate email/password mạnh, không rate-limit, không HTTPS.
- 3 lỗ hổng "moderate" từ `npm audit` đến từ `qs` (dependency của `express@4`),
  chưa có bản vá non-breaking tại thời điểm viết — chấp nhận được vì server chỉ
  chạy local, không expose ra internet.
