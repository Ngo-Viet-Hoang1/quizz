# 🚀 KẾ HOẠCH TỐI ƯU HÓA HỆ THỐNG ĐẠT 1,000 HỌC SINH ĐỒNG THỜI (CONCURRENT USERS)

> **Dự án**: HKT Quizz AI Platform  
> **Môi trường đo lường**: AWS EC2 `t3.small` (2 vCPU, 2GB RAM, 3GB Swap), Singapore (`ap-southeast-1`)  
> **Domain**: [https://hktquiz.phamhongky.dev](https://hktquiz.phamhongky.dev)  
> **Ngày ghi nhận baseline**: 14/09/2026

---

## 📊 1. BẢNG DỮ LIỆU ĐO LƯỜNG TRƯỚC TỐI ƯU (BASELINE BENCHMARK)

### Bảng 1: Giới Hạn Chịu Tải Live Room (WebSocket Realtime)

_Kịch bản: Giả lập học sinh đồng thời quét mã PIN và gửi yêu cầu `join_room` qua WebSocket (WSS)._

| Số lượng học sinh (Concurrent) |   Tỉ lệ thành công   | Thời gian hoàn thành | Độ trễ P95 (95% User) | Độ trễ trung bình | Trạng thái ghi nhận                              |
| :----------------------------- | :------------------: | :------------------: | :-------------------: | :---------------: | :----------------------------------------------- |
| **100 học sinh**               | **100.0%** (100/100) |       1,173 ms       |      **958 ms**       |      420 ms       | 🟢 Rất mượt, phản hồi tức thì                    |
| **250 học sinh**               | **100.0%** (250/250) |       3,420 ms       |     **1,970 ms**      |      890 ms       | 🟢 Hoạt động ổn định, 0 lỗi                      |
| **500 học sinh**               | **99.6%** (498/500)  |      10,240 ms       |     **4,880 ms**      |     2,150 ms      | 🟡 Bắt đầu nghẽn hàng đợi (P95 tăng cao)         |
| **750 học sinh**               | **~69.3%** (520/750) |     > 12,000 ms      |    **> 8,000 ms**     |    > 4,500 ms     | 🔴 Suy giảm nặng, rớt > 200 kết nối              |
| **1,000 học sinh**             |     **< 55.0%**      |       Timeout        |    **> 10,000 ms**    |        N/A        | 🔴 Quá tải, socket bị drop do chạm trần OS/Nginx |

---

### Bảng 2: Giới Hạn Băng Thông REST API (HTTP Throughput & Health Check)

_Kịch bản: Giả lập lưu lượng tải gọi API kiểm tra trạng thái và nộp bài đồng thời._

| Kịch bản Test (Total Reqs @ Concurrency) |  Thông lượng (RPS)   | Độ trễ trung bình (Avg Latency) | Tỉ lệ thành công (HTTP 200) | Trạng thái & Ghi chú                                 |
| :--------------------------------------- | :------------------: | :-----------------------------: | :-------------------------: | :--------------------------------------------------- |
| **100 reqs @ 10 concurrency**            |    **137.6 RPS**     |            **71 ms**            |         **100.0%**          | 🟢 Cực nhanh, CPU < 5%                               |
| **200 reqs @ 20 concurrency**            |    **142.1 RPS**     |            **84 ms**            |         **100.0%**          | 🟢 Ổn định                                           |
| **300 reqs @ 30 concurrency**            |    **148.5 RPS**     |           **112 ms**            |         **100.0%**          | 🟢 Ổn định                                           |
| **500 reqs @ 50 concurrency**            |    **153.2 RPS**     |           **145 ms**            |         **100.0%**          | 🟢 Băng thông đạt ~153 requests/giây                 |
| **Route Nghiệp vụ (Quiz/Room API)**      | Giới hạn 100 req/min |               N/A               |  Bị 429 Too Many Requests   | 🔴 Chạm trần `ThrottlerGuard` mặc định (100 req/60s) |

---

## 🔍 2. TRUY TÌM VẤN ĐỀ & NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

Dựa trên dữ liệu đo lường thực tế, hệ thống bắt đầu suy giảm từ mức **500+ học sinh** và rớt ở **750 - 1000 học sinh** do 5 điểm nghẽn (bottlenecks) sau:

```
[1,000 Học Sinh Đồng Thời]
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ 🔴 Điểm nghẽn 1: OS File Descriptors & TCP Queue        │ ──► ulimit -n = 1024, somaxconn = 128 (Drop Socket TCP)
└────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ 🔴 Điểm nghẽn 2: Nginx Worker Connections Limit        │ ──► worker_connections = 768 (Chỉ chịu tối đa ~384 WS)
└────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ 🔴 Điểm nghẽn 3: NestJS Throttler Rate Limiting        │ ──► limit = 100 req / 60s (Chặn nhầm học sinh nộp bài)
└────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ 🔴 Điểm nghẽn 4: MongoDB Connection Pool Quá Nhỏ       │ ──► maxPoolSize = 10 (Các query DB phải xếp hàng chờ)
└────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ 🔴 Điểm nghẽn 5: AuditLog Ghi Đơn Lẻ Tranh Chấp DB     │ ──► @Audit('exam_attempt.answer') gây ra 40,000 DB writes
└────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ 🔴 Điểm nghẽn 6: Socket.IO Transport & Serialization   │ ──► WebSocket handshake chưa tối ưu buffer
└────────────────────────────────────────────────────────┘
```

### Chi tiết từng điểm nghẽn:

1. **Nginx Worker Connections thấp (Default: 768)**:
   - Một kết nối WebSocket đi qua Nginx Reverse Proxy tiêu tốn **2 file descriptors/connections** (1 từ Client $\rightarrow$ Nginx, 1 từ Nginx $\rightarrow$ Node.js NestJS).
   - Với `worker_connections 768`, Nginx chỉ có thể gánh tối đa **$768 / 2 = 384$ kết nối WebSocket đồng thời**. Khi ta test 500 - 1,000 học sinh, Nginx tự động drop các kết nối vượt ngưỡng.
2. **Hệ điều hành Linux Kernel Limits (`ulimit -n` & `somaxconn`)**:
   - Mặc định Ubuntu giới hạn mỗi process chỉ được mở tối đa 1024 file descriptors.
   - Khi có 1,000 socket + kết nối DB + HTTP request + log files, Node.js và Nginx chạm ngưỡng `EMFILE: too many open files`.
   - Hàng đợi lắng nghe kết nối TCP (`somaxconn`) mặc định chỉ 128/512, khiến các gói tin TCP SYN bị từ chối khi 1,000 học sinh bấm Join Room cùng 1 giây.
3. **AuditLog ghi đơn lẻ (Unbuffered DB Writes) gây nghẽn Connection Pool**:
   - Endpoint `@Put(':id/answer')` (lưu đáp án từng câu) đang bật `@Audit('exam_attempt.answer')`.
   - 1,000 học sinh làm đề 40 câu $\rightarrow$ Tạo ra **40,000 lượt INSERT riêng lẻ** vào collection `audit_logs`.
   - AuditLog tranh chấp trực tiếp pool kết nối MongoDB với logic chấm bài và nộp bài, làm chậm toàn bộ hệ thống.
4. **MongoDB Connection Pool chỉ có 10 kết nối (`maxPoolSize: 10`)**:
   - File cấu hình `apps/api/src/database/database.module.ts` đang đặt cứng `maxPoolSize: 10`.
   - Khi 1,000 học sinh nộp bài hoặc lấy thông tin room, chỉ có 10 query được thực thi song song, 990 query còn lại phải xếp hàng chờ (Queueing delay) $\rightarrow$ Đẩy P95 vọt từ 900ms lên gần 5-10 giây!
5. **NestJS Throttler chặn ở mức 100 requests/phút**:
   - `AppModule` cấu hình `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])`.
   - Khi 1,000 học sinh cùng thi, các endpoint làm bài như `/exam-attempts/*`, `/rooms/*`, `/quiz/*` sẽ nhanh chóng bị trả về mã lỗi `HTTP 429 Too Many Requests`.
6. **Cấu hình PM2 & Node.js Memory Buffer**:
   - PM2 đang chạy `quizz-api` ở chế độ single instance tiêu chuẩn chưa bật tối ưu `max_memory_restart` và swap caching.

---

## 🛠️ 3. KẾ HOẠCH VÀ GIẢI PHÁP TỐI ƯU CHI TIẾT (OPTIMIZATION PLAN)

Để hệ thống xử lý mượt mà **1,000 học sinh cùng làm bài và thi Live Room** với **P95 < 2 giây và tỉ lệ rớt kết nối = 0%**, chúng ta thực hiện các giai đoạn tối ưu đồng bộ:

### Giai đoạn 1: Nâng cấp Kernel Linux & File Descriptors (OS Layer)

- Tăng giới hạn File Descriptors cho Nginx và PM2:
  - Cập nhật `/etc/security/limits.conf`:
    ```text
    * soft nofile 65535
    * hard nofile 65535
    ubuntu soft nofile 65535
    ubuntu hard nofile 65535
    ```
  - Cập nhật `/etc/sysctl.conf`:
    ```text
    fs.file-max = 2097152
    net.core.somaxconn = 65535
    net.ipv4.tcp_max_syn_backlog = 65535
    ```

### Giai đoạn 2: Tối ưu hóa Nginx Reverse Proxy (Network Layer)

- Cấu hình lại file `/etc/nginx/nginx.conf`:
  ```nginx
  worker_processes auto;
  worker_rlimit_nofile 65535;

  events {
      worker_connections 4096;
      multi_accept on;
      use epoll;
  }
  ```
- Tối ưu Keep-alive và Buffer cho WebSocket trong `nginx-quizz.conf`:
  ```nginx
  proxy_read_timeout 3600s;
  proxy_send_timeout 3600s;
  proxy_buffering off;
  ```

### Giai đoạn 3: Tối ưu AuditLog & Database Connection Pool (Application Layer)

- **Tối ưu AuditLog**:
  - Gỡ `@Audit('exam_attempt.answer')` tại [exam-attempts.controller.ts](file:///f:/WordSpace/project/VTI/quizz_ai/vti_rag/apps/api/src/modules/exam-attempts/exam-attempts.controller.ts) để triệt tiêu 40,000 write queries thừa khi học sinh chọn từng câu hỏi.
  - Chỉ giữ AuditLog cho các sự kiện quan trọng: `exam_attempt.start`, `exam_attempt.submit`, `exam_attempt.violation`.
  - Triển khai **In-Memory Batch Buffer** (`insertMany` định kỳ mỗi 2-3s) trong `AuditService` để gom các bản ghi log thay vì ghi đơn lẻ từng cái một.
- **Tăng MongoDB Pool Size** trong `apps/api/src/database/database.module.ts`:
  ```typescript
  maxPoolSize: 50, // Nâng từ 10 lên 50 kết nối song song
  minPoolSize: 10, // Duy trì sẵn 10 kết nối sẵn sàng không cần bắt tay lại
  ```
- **Tùy biến Throttler Rate Limiting** trong `apps/api/src/app.module.ts`:
  - Nâng giới hạn cho API thông thường lên `3,000 requests/phút`.
  - Miễn trừ hoặc đặt quota riêng 10,000 req/min cho các endpoint làm bài thi Live Room & Exam Attempts.

### Giai đoạn 4: Tối ưu Socket.IO & Redis Caching

- Bật Redis Adapter hoặc giữ Room State tối ưu trong RAM Redis với serialization nhanh.
- Giảm kích thước payload broadcast của Room Gateway (chỉ gửi thông tin cần thiết: `scores`, `currentQuestionIndex`, loại bỏ dữ liệu thừa).

---

## 📈 4. BẢNG MỤC TIÊU VÀ SO SÁNH TRƯỚC / SAU TỐI ƯU

| Tiêu chí đánh giá                       | Trước Tối Ưu (Hiện tại) | Mục tiêu Sau Tối Ưu (Target) | Kết quả Thực Tế Sau Tối Ưu | Đánh giá |
| :-------------------------------------- | :---------------------: | :--------------------------: | :------------------------: | :------: |
| **Số kết nối WebSocket tối đa**         |     768 connections     |    **4,096 connections**     |    _(Đang cập nhật...)_    |    ⏳    |
| **Học sinh thi Live Room (100 user)**   |   P95: 958 ms (100%)    |   **P95 < 500 ms (100%)**    |    _(Đang cập nhật...)_    |    ⏳    |
| **Học sinh thi Live Room (500 user)**   |  P95: 4,880 ms (99.6%)  |  **P95 < 1,500 ms (100%)**   |    _(Đang cập nhật...)_    |    ⏳    |
| **Học sinh thi Live Room (1,000 user)** |  **RỚT (Fail > 45%)**   |  **P95 < 2,500 ms (100%)**   |    _(Đang cập nhật...)_    |    ⏳    |
| **API Throughput (RPS)**                |        ~153 RPS         |     **> 300 - 450 RPS**      |    _(Đang cập nhật...)_    |    ⏳    |
| **Rate Limit Quota**                    |      100 req/phút       |     **3,000+ req/phút**      |    _(Đang cập nhật...)_    |    ⏳    |
| **Database Pool Connections**           |   10 pool connections   |   **50 pool connections**    |    _(Đang cập nhật...)_    |    ⏳    |
| **Tỉ lệ lỗi (Error Rate / Drop)**       |   Cao khi > 500 user    |    **0.0% ở 1,000 user**     |    _(Đang cập nhật...)_    |    ⏳    |

---

## 🚀 5. LỘ TRÌNH THỰC THI (EXECUTION STEPS)

1. [x] **Bước 1**: Đo đạc baseline và lưu trữ bảng số liệu thực tế.
2. [ ] **Bước 2**: Sửa code `apps/api` (MongoDB Pool = 50, Throttler = 3000 req/min).
3. [ ] **Bước 3**: SSH lên EC2 cấu hình OS kernel (`limits.conf`, `sysctl.conf`) và Nginx (`worker_connections 4096`).
4. [ ] **Bước 4**: Deploy phiên bản mới lên EC2 và restart PM2/Nginx.
5. [ ] **Bước 5**: Chạy lại bộ benchmark 100, 250, 500, 750, 1000 học sinh để ghi nhận số liệu so sánh thực tế.
