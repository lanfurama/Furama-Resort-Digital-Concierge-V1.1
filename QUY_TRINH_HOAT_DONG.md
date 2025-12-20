# 🏨 QUY TRÌNH HOẠT ĐỘNG - FUrama Resort Digital Concierge

> **Tài liệu hướng dẫn quy trình làm việc cho tất cả các bộ phận**

---

## 📋 MỤC LỤC

1. [Quy trình Buggy Service (Xe điện)](#1-quy-trình-buggy-service-xe-điện)
2. [Quy trình Service Booking (Dịch vụ)](#2-quy-trình-service-booking-dịch-vụ)
3. [Quy trình AI Concierge Chat](#3-quy-trình-ai-concierge-chat)
4. [Tổng quan các Role](#4-tổng-quan-các-role)

---

## 1. QUY TRÌNH BUGGY SERVICE (XE ĐIỆN)

### 🎯 Tổng quan
Hệ thống đặt xe điện (buggy) tự động kết nối khách hàng với tài xế, có AI hỗ trợ phân công tối ưu.

---

### 👤 **ROLE: GUEST (Khách hàng)**

#### 📱 **Bước 1: Đặt xe**
```
1. Khách mở app → Chọn "Buggy"
2. Hệ thống tự động phát hiện vị trí hiện tại (GPS)
3. Khách chọn điểm đón và điểm đến
4. Nhấn "Request Buggy"
```

**Trạng thái:** `SEARCHING` (Đang tìm tài xế)

#### ⏳ **Bước 2: Chờ tài xế**
- **Tự động:** Hệ thống tự động tìm và phân công tài xế gần nhất
- **AI:** Thuật toán tính toán khoảng cách, thời gian chờ, tối ưu phân công
- **Thời gian:** Tối đa 10 phút (có thể hủy nếu chờ quá lâu)

**Trạng thái:** `SEARCHING` → `ASSIGNED` (Đã phân công)

#### 🚗 **Bước 3: Tài xế đang đến**
- **Thông báo:** App tự động thông báo khi tài xế chấp nhận
- **Chat:** Có thể chat với tài xế qua app
- **Theo dõi:** Xem ETA (thời gian ước tính đến)

**Trạng thái:** `ASSIGNED` → `ARRIVING` (Đang đến)

#### ✅ **Bước 4: Đã đón khách**
- **Tự động:** Tài xế xác nhận đã đón khách
- **Theo dõi:** Xem tiến trình di chuyển

**Trạng thái:** `ARRIVING` → `ON_TRIP` (Đang di chuyển)

#### 🎉 **Bước 5: Hoàn thành**
- **Tự động:** Tài xế xác nhận đã đến đích
- **Đánh giá:** Khách có thể đánh giá và phản hồi

**Trạng thái:** `ON_TRIP` → `COMPLETED` (Hoàn thành)

---

### 🚗 **ROLE: DRIVER (Tài xế)**

#### 📲 **Bước 1: Đăng nhập & Online**
```
1. Tài xế đăng nhập vào Driver Portal
2. Hệ thống tự động gửi heartbeat mỗi 30 giây (giữ trạng thái online)
3. Cập nhật vị trí GPS (nếu có)
```

**Trạng thái:** `ONLINE` (Sẵn sàng nhận chuyến)

#### 🔔 **Bước 2: Nhận yêu cầu**
- **Tự động:** Hệ thống gửi thông báo khi có yêu cầu mới
- **AI:** Yêu cầu được phân công dựa trên:
  - Khoảng cách từ tài xế đến điểm đón
  - Thời gian chờ của khách
  - Tài xế đang rảnh hay đang có chuyến

**Hiển thị:** Danh sách yêu cầu với thông tin:
- Tên khách, phòng
- Điểm đón → Điểm đến
- Thời gian chờ

#### ✅ **Bước 3: Chấp nhận chuyến**
```
1. Tài xế xem chi tiết yêu cầu
2. Nhấn "Accept Ride"
3. Hệ thống tự động cập nhật trạng thái
```

**Trạng thái:** `SEARCHING` → `ASSIGNED` (Đã nhận chuyến)

#### 🚗 **Bước 4: Đến điểm đón**
- **Cập nhật:** Tài xế có thể cập nhật ETA
- **Chat:** Có thể chat với khách qua app
- **Xác nhận:** Nhấn "Picked Up" khi đã đón khách

**Trạng thái:** `ASSIGNED` → `ARRIVING` → `ON_TRIP`

#### 🎯 **Bước 5: Hoàn thành chuyến**
```
1. Tài xế đưa khách đến đích
2. Nhấn "Complete Ride"
3. Hệ thống tự động cập nhật trạng thái
4. Tài xế sẵn sàng nhận chuyến mới
```

**Trạng thái:** `ON_TRIP` → `COMPLETED` → `ONLINE`

---

### 🏢 **ROLE: RECEPTION (Lễ tân)**

#### 👁️ **Bước 1: Giám sát hệ thống**
- **Xem tất cả:** Tất cả yêu cầu buggy trong hệ thống
- **Theo dõi:** Trạng thái từng chuyến (SEARCHING, ASSIGNED, ON_TRIP, COMPLETED)
- **Thống kê:** Số tài xế online, số yêu cầu đang chờ

#### 🤖 **Bước 2: AI Tự động phân công**
```
Tự động kích hoạt khi:
- Có yêu cầu chờ quá 5 phút (có thể cấu hình)
- Tài xế online nhưng chưa được phân công
```

**AI tính toán:**
- Khoảng cách GPS từ tài xế đến điểm đón
- Thời gian chờ của khách (ưu tiên khách chờ lâu)
- Tài xế đang rảnh hay đang có chuyến (Chain Trip)
- Tối ưu để giảm thời gian chờ và tăng hiệu quả

#### ✋ **Bước 3: Phân công thủ công (nếu cần)**
```
1. Reception xem danh sách yêu cầu đang chờ
2. Xem danh sách tài xế online
3. Chọn yêu cầu → Chọn tài xế → "Assign"
```

**Khi nào cần phân công thủ công:**
- AI không tự động phân công được
- Cần ưu tiên khách VIP
- Tài xế yêu cầu chuyến cụ thể

#### 📝 **Bước 4: Tạo yêu cầu thủ công**
```
1. Reception nhận yêu cầu qua điện thoại/trực tiếp
2. Mở "Create New Ride"
3. Nhập: Phòng khách, điểm đón, điểm đến
4. Hệ thống tự động tạo yêu cầu và phân công
```

---

## 2. QUY TRÌNH SERVICE BOOKING (DỊCH VỤ)

### 🎯 Tổng quan
Khách đặt dịch vụ (Dining, Spa, Pool, Butler) → Staff xác nhận → Thực hiện → Hoàn thành

---

### 👤 **ROLE: GUEST (Khách hàng)**

#### 📱 **Bước 1: Chọn dịch vụ**
```
1. Khách mở app → Chọn dịch vụ:
   - Dining (Nhà hàng)
   - Spa (Massage & Spa)
   - Pool (Hồ bơi)
   - Butler (Người phục vụ)
```

#### 🛒 **Bước 2: Đặt hàng**
```
1. Xem menu (tự động load từ database)
2. Thêm vào giỏ hàng
3. Nhấn "Place Order"
```

**Trạng thái:** `PENDING` (Đang chờ xác nhận)

#### ⏳ **Bước 3: Chờ xác nhận**
- **Thông báo:** App tự động thông báo khi staff xác nhận
- **Chat:** Có thể chat với staff qua app

**Trạng thái:** `PENDING` → `CONFIRMED` (Đã xác nhận)

#### ✅ **Bước 4: Nhận dịch vụ**
- **Theo dõi:** Xem trạng thái dịch vụ
- **Chat:** Liên hệ với staff nếu cần

**Trạng thái:** `CONFIRMED` → `COMPLETED` (Hoàn thành)

#### ⭐ **Bước 5: Đánh giá**
- **Đánh giá:** Khách có thể đánh giá và phản hồi sau khi hoàn thành

---

### 👨‍🍳 **ROLE: STAFF (Nhân viên phục vụ)**

#### 📲 **Bước 1: Đăng nhập & Online**
```
1. Staff đăng nhập vào Staff Portal
2. Hệ thống tự động gửi heartbeat mỗi 30 giây
3. Chỉ xem yêu cầu thuộc bộ phận của mình:
   - Dining Staff → Chỉ thấy DINING
   - Spa Staff → Chỉ thấy SPA
   - Pool Staff → Chỉ thấy POOL
   - Butler Staff → Chỉ thấy BUTLER
```

**Lưu ý:** Supervisor có thể xem tất cả bộ phận

#### 🔔 **Bước 2: Nhận yêu cầu mới**
- **Thông báo:** App tự động thông báo khi có yêu cầu mới
- **Hiển thị:** Danh sách yêu cầu `PENDING`

**Thông tin hiển thị:**
- Phòng khách
- Chi tiết đơn hàng
- Thời gian đặt

#### ✅ **Bước 3: Xác nhận đơn hàng**
```
1. Staff xem chi tiết đơn hàng
2. Nhấn "Confirm Order"
3. Hệ thống tự động thông báo cho khách
```

**Trạng thái:** `PENDING` → `CONFIRMED`

#### 🎯 **Bước 4: Thực hiện dịch vụ**
- **Chat:** Có thể chat với khách qua app
- **Cập nhật:** Cập nhật tiến trình nếu cần

#### ✅ **Bước 5: Hoàn thành**
```
1. Staff hoàn thành dịch vụ
2. Nhấn "Complete Order"
3. Hệ thống tự động thông báo cho khách
4. Khách có thể đánh giá
```

**Trạng thái:** `CONFIRMED` → `COMPLETED`

---

### 🏢 **ROLE: RECEPTION (Lễ tân)**

#### 👁️ **Bước 1: Giám sát dịch vụ**
- **Xem tất cả:** Tất cả yêu cầu dịch vụ trong hệ thống
- **Theo dõi:** Trạng thái từng đơn (PENDING, CONFIRMED, COMPLETED)
- **Thống kê:** Số đơn đang chờ, số staff online

#### 🤖 **Bước 2: AI Tự động phân công (nếu có)**
```
Tự động phân công staff cho yêu cầu dịch vụ:
- Dựa trên bộ phận (Dining, Spa, Pool, Butler)
- Dựa trên tải công việc hiện tại
- Tối ưu để giảm thời gian chờ
```

---

## 3. QUY TRÌNH AI CONCIERGE CHAT

### 🎯 Tổng quan
AI Concierge sử dụng Google Gemini AI để trả lời câu hỏi, hỗ trợ đặt dịch vụ, cung cấp thông tin resort.

---

### 👤 **ROLE: GUEST (Khách hàng)**

#### 💬 **Bước 1: Mở Chat**
```
1. Khách mở app → Chọn "Concierge"
2. Mở giao diện chat
```

#### 🤖 **Bước 2: Chat với AI**
- **AI:** Google Gemini 2.5 Flash
- **Tự động:** AI tự động trả lời dựa trên:
  - Knowledge Base (cơ sở tri thức về resort)
  - Events (sự kiện hiện tại)
  - Promotions (khuyến mãi)
  - Google Maps (hỗ trợ chỉ đường)

**Ví dụ câu hỏi:**
- "Giờ mở cửa của nhà hàng?"
- "Có sự kiện nào hôm nay không?"
- "Làm sao để đặt xe buggy?"
- "Nhà hàng nào gần phòng tôi?"

#### 🗺️ **Bước 3: AI Hỗ trợ đặt dịch vụ**
- **Tự động:** AI có thể tự động tạo yêu cầu buggy nếu khách yêu cầu
- **Thông minh:** AI hiểu ngữ cảnh và đưa ra gợi ý phù hợp

---

## 4. TỔNG QUAN CÁC ROLE

### 📊 **Bảng phân quyền**

| Role | Quyền hạn | Chức năng chính |
|------|-----------|-----------------|
| **GUEST** | Xem & đặt dịch vụ | Đặt buggy, đặt dịch vụ, chat với AI, đánh giá |
| **DRIVER** | Quản lý chuyến xe | Nhận chuyến, cập nhật trạng thái, chat với khách |
| **STAFF** | Quản lý dịch vụ | Xác nhận đơn, hoàn thành dịch vụ, chat với khách |
| **RECEPTION** | Giám sát & phân công | Xem tất cả, phân công thủ công, tạo yêu cầu |
| **ADMIN/SUPERVISOR** | Quản trị hệ thống | Quản lý menu, events, promotions, locations, users |

---

### 🔄 **Luồng dữ liệu tổng quan**

```
GUEST đặt dịch vụ
    ↓
Hệ thống tự động tạo yêu cầu
    ↓
AI tự động phân công (nếu bật)
    ↓
STAFF/DRIVER nhận thông báo
    ↓
STAFF/DRIVER xác nhận
    ↓
Thực hiện dịch vụ
    ↓
Hoàn thành & Đánh giá
```

---

### 🤖 **Tính năng AI & Tự động**

#### ✅ **Tự động (Automatic)**
- ✅ Phát hiện vị trí GPS của khách
- ✅ Tạo yêu cầu khi khách đặt
- ✅ Gửi thông báo real-time
- ✅ Cập nhật trạng thái tự động
- ✅ Heartbeat để giữ trạng thái online
- ✅ Polling để cập nhật dữ liệu mới nhất

#### 🤖 **AI (Artificial Intelligence)**
- 🤖 **AI Phân công Buggy:** Thuật toán tối ưu phân công tài xế
- 🤖 **AI Concierge Chat:** Google Gemini trả lời câu hỏi
- 🤖 **AI Chain Trip:** Tự động phát hiện chuyến nối tiếp
- 🤖 **AI Auto-assign:** Tự động phân công khi chờ quá lâu

---

### ⚙️ **Cấu hình hệ thống**

#### 🚗 **Buggy Auto-assign**
```
Cấu hình trong Reception Portal:
- maxWaitTimeBeforeAutoAssign: 300 giây (5 phút)
- autoAssignEnabled: true/false
```

**Hoạt động:**
- Tự động kiểm tra mỗi 5 giây
- Nếu có yêu cầu chờ ≥ 5 phút → Tự động phân công
- Sử dụng AI để tính toán tài xế phù hợp nhất

---

### 📱 **Thông báo & Chat**

#### 🔔 **Thông báo tự động**
- **Khách:** Thông báo khi tài xế chấp nhận, đang đến, đã đón
- **Tài xế:** Thông báo khi có yêu cầu mới
- **Staff:** Thông báo khi có đơn hàng mới

#### 💬 **Chat tích hợp**
- **Buggy:** Khách ↔ Tài xế
- **Service:** Khách ↔ Staff
- **Concierge:** Khách ↔ AI

---

### 🎯 **Best Practices**

#### 👤 **Cho GUEST:**
- ✅ Cho phép app truy cập GPS để tự động phát hiện vị trí
- ✅ Kiểm tra thông báo thường xuyên
- ✅ Sử dụng chat để liên hệ với tài xế/staff
- ✅ Đánh giá sau khi hoàn thành dịch vụ

#### 🚗 **Cho DRIVER:**
- ✅ Giữ app mở để nhận heartbeat (online)
- ✅ Cập nhật vị trí GPS nếu có
- ✅ Xác nhận nhanh khi nhận chuyến
- ✅ Chat với khách nếu cần hướng dẫn

#### 👨‍🍳 **Cho STAFF:**
- ✅ Giữ app mở để nhận heartbeat (online)
- ✅ Xác nhận đơn hàng nhanh chóng
- ✅ Cập nhật trạng thái khi hoàn thành
- ✅ Chat với khách nếu cần xác nhận thêm

#### 🏢 **Cho RECEPTION:**
- ✅ Giám sát hệ thống thường xuyên
- ✅ Kiểm tra yêu cầu chờ quá lâu
- ✅ Phân công thủ công nếu AI không hoạt động
- ✅ Tạo yêu cầu thủ công khi khách gọi điện

---

### 📞 **Liên hệ hỗ trợ**

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ:
- **IT Support:** [Email/Phone]
- **Reception:** [Phone]
- **Admin:** [Email]

---

**📅 Cập nhật lần cuối:** [Ngày tháng năm]

**👤 Người soạn:** Hệ thống Digital Concierge

---


