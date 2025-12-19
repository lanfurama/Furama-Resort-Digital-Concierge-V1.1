# 🏖️ Furama Resort Digital Concierge - Flow & Cấu Trúc Dự Án

## 📋 Tổng Quan

**Furama Resort Digital Concierge** là hệ thống quản lý dịch vụ kỹ thuật số cho resort, hỗ trợ đa vai trò (Guest, Staff, Driver, Admin) với các tính năng đặt dịch vụ, chat concierge AI, quản lý buggy, và quản lý đơn hàng.

---

## 🌐 Demo & Tài Khoản Test

### **🔗 Link Demo**
**URL**: [http://data.horecfex.com:3000/](http://data.horecfex.com:3000/)

### **👤 Tài Khoản Test**

| Vai Trò | Username | Password | Ghi Chú |
|---------|----------|----------|---------|
| 🏖️ **Guest** | `101` | `Smith` | Đăng nhập bằng số phòng và tên |
| 👑 **Admin** | `ADMIN001` | `123` | Quản lý toàn hệ thống |
| 👔 **Supervisor** | `SUPER001` | `123` | Giám sát với quyền hạn chế |
| 👨‍💼 **Staff** | `STAFF001` | `123` | Xử lý đơn hàng dịch vụ |
| 🏨 **Reception** | `RECEPT001` | `123` | Check-in/out, quản lý phòng |
| 🚗 **Driver** | `DRIVER001` | `123` | Quản lý chuyến đi buggy |

---

## 🏗️ Kiến Trúc Hệ Thống

### **Tech Stack**
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Mobile**: Capacitor (Android APK)
- **AI**: Google Gemini API
- **Deployment**: Vercel (Serverless Functions)

---

## 🔄 User Flow - Luồng Sử Dụng Hệ Thống

### **1️⃣ Đăng Nhập & Phân Quyền**

**Bước 1:** Chọn vai trò (Guest / Staff / Driver / Admin)  
**Bước 2:** Nhập thông tin đăng nhập  
**Bước 3:** Hệ thống tự động chuyển đến màn hình phù hợp với vai trò

---

### **2️⃣ Luồng Khách Hàng (Guest) 🏖️**

#### **Màn hình chính (Home)**
- Xem banner resort
- Xem khuyến mãi đặc biệt
- Truy cập menu dịch vụ

#### **Đặt dịch vụ (Service Menu)**
- 🍽️ **Dining Order** → Chọn món, đặt đồ ăn
- 💆 **Spa Booking** → Đặt lịch spa
- 🏊 **Pool Order** → Đặt đồ uống tại hồ bơi
- 🧑‍💼 **Butler Request** → Yêu cầu butler
- 📅 **Events** → Xem sự kiện resort

#### **Đặt xe buggy (Buggy Booking)**
1. Chọn điểm đón và điểm đến
2. Gửi yêu cầu → Hệ thống tìm tài xế
3. Theo dõi trạng thái:
   - 🔍 **SEARCHING** → Đang tìm tài xế
   - ✅ **ASSIGNED** → Tài xế đã nhận đơn
   - 🚗 **ARRIVING** → Tài xế đang đến
   - 🛣️ **ON_TRIP** → Đang trên đường
   - ✨ **COMPLETED** → Hoàn thành
4. Đánh giá và phản hồi sau chuyến đi

#### **Chat với Concierge AI 🤖**
- Trò chuyện với AI (Google Gemini)
- AI tự động tra cứu thông tin từ knowledge base
- Nếu AI không trả lời được → Chuyển cho nhân viên

#### **Quản lý đơn hàng (Active Orders)**
- Xem tất cả đơn đã đặt
- Theo dõi trạng thái từng đơn
- Xem lịch sử đơn hàng

#### **Tài khoản (Account)**
- Cập nhật thông tin cá nhân
- Chọn ngôn ngữ (Tiếng Việt / English)
- Xem thông tin check-in/check-out

---

### **3️⃣ Luồng Tài Xế (Driver) 🚗**

#### **Dashboard chính**
- 📋 Xem danh sách yêu cầu đang chờ
- ✅ Nhận đơn / ❌ Từ chối đơn
- 📍 Cập nhật vị trí real-time (GPS)
- 🔄 Cập nhật trạng thái chuyến đi:
  - **ASSIGNED** → Đã nhận đơn
  - **ARRIVING** → Đang đến điểm đón
  - **ON_TRIP** → Đã đón khách, đang đi
  - **COMPLETED** → Hoàn thành chuyến
- 📊 Xem lịch sử chuyến đi

---

### **4️⃣ Luồng Nhân Viên (Staff) 👨‍💼**

#### **Dashboard quản lý**
- 📦 **Hàng đợi đơn dịch vụ:**
  - Xem đơn đang chờ xử lý
  - Xác nhận đơn
  - Cập nhật trạng thái
  - Hoàn thành đơn

- 💬 **Chat hỗ trợ:**
  - Nhận tin nhắn từ khách (khi AI không xử lý được)
  - Trả lời và hỗ trợ khách hàng

- 🔍 **Lọc theo bộ phận:**
  - Dining (Nhà hàng)
  - Spa
  - Pool (Hồ bơi)
  - Butler (Người phục vụ)

---

### **5️⃣ Luồng Quản Trị (Admin) 👑**

#### **Dashboard quản lý toàn hệ thống**
- 👥 **Quản lý người dùng** → Thêm/sửa/xóa users
- 📋 **Quản lý menu dịch vụ** → Thêm/sửa món ăn, dịch vụ
- 🎁 **Quản lý khuyến mãi** → Tạo và quản lý chương trình khuyến mãi
- 📅 **Quản lý sự kiện** → Thêm/sửa sự kiện resort
- 📚 **Quản lý knowledge base** → Cập nhật thông tin cho AI
- 📍 **Quản lý địa điểm** → Thêm/sửa vị trí trong resort
- 📊 **Báo cáo & thống kê** → Xem analytics
- ⚙️ **Cài đặt hệ thống** → Cấu hình chung

---

## 🗄️ Cơ Sở Dữ Liệu

### **Bảng Người Dùng & Phòng**
- 👥 `users` → Tài khoản (Khách, Nhân viên, Tài xế, Admin)
- 🏨 `rooms` → Thông tin phòng
- 🏡 `room_types` → Loại phòng/villa
- 📍 `locations` → Địa điểm trong resort

### **Bảng Dịch Vụ & Đơn Hàng**
- 📦 `service_requests` → Đơn dịch vụ (Ăn uống, Spa, Hồ bơi, Butler)
- 🍽️ `menu_items` → Menu món ăn/dịch vụ
- 🚗 `ride_requests` → Yêu cầu đặt xe buggy
- 💬 `chat_messages` → Lịch sử chat
- 🔔 `notifications` → Thông báo

### **Bảng Nội Dung**
- 🎁 `promotions` → Khuyến mãi
- 📅 `resort_events` → Sự kiện resort
- 📚 `knowledge_items` → Cơ sở tri thức cho AI
- ⭐ `hotel_reviews` → Đánh giá của khách

---

## 🎯 Tính Năng Chính

### **1. Hệ Thống Đa Vai Trò 👥**
| Vai Trò | Chức Năng |
|---------|-----------|
| 🏖️ **GUEST** | Đặt dịch vụ, chat AI, đặt buggy |
| 🚗 **DRIVER** | Nhận đơn, cập nhật vị trí, quản lý chuyến đi |
| 👨‍💼 **STAFF** | Xử lý đơn hàng, trả lời chat |
| 🏨 **RECEPTION** | Check-in/out, quản lý phòng |
| 👑 **ADMIN** | Quản lý toàn hệ thống |
| 👔 **SUPERVISOR** | Giám sát với quyền hạn chế |

### **2. Hệ Thống Đặt Xe Buggy 🚗**
- 📍 Theo dõi vị trí real-time
- 🔄 Luồng trạng thái: `SEARCHING → ASSIGNED → ARRIVING → ON_TRIP → COMPLETED`
- 🤖 Tự động phân công tài xế gần nhất
- ⏱️ Tính toán thời gian đến (ETA)
- ⭐ Đánh giá và phản hồi sau chuyến đi

### **3. Chat Concierge AI 🤖**
- 🤖 Tích hợp Google Gemini AI
- 📚 Tự động tra cứu từ knowledge base
- 🌐 Hỗ trợ đa ngôn ngữ
- 👨‍💼 Chuyển tiếp cho nhân viên khi cần

### **4. Đặt Dịch Vụ 📦**
- 🍽️ Đặt đồ ăn (Dining)
- 💆 Đặt spa
- 🏊 Đặt đồ uống tại hồ bơi (Pool)
- 🧑‍💼 Yêu cầu butler
- 📊 Theo dõi trạng thái đơn hàng
- 🔄 Cập nhật trạng thái real-time

### **5. Đa Ngôn Ngữ 🌐**
- 🇻🇳 Tiếng Việt
- 🇬🇧 English
- 🔄 Hệ thống dịch tự động cho nội dung
- ⚙️ Người dùng tự chọn ngôn ngữ ưa thích

---

## 🚀 Phát Triển & Triển Khai

### **Chạy Local**
```bash
# Terminal 1: Frontend (Port 5173)
npm run dev

# Terminal 2: Backend API (Port 3000)
npm run dev:api
```

### **Build & Deploy**
```bash
# Build frontend
npm run build

# Build Android APK
npm run build:android
npm run cap:open:android
```

### **Biến Môi Trường**
- 🔑 `GEMINI_API_KEY` → API key Google Gemini
- 🗄️ `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` → Thông tin PostgreSQL
- 🔒 `ENABLE_HTTPS` → Bật HTTPS (tùy chọn)

---

## 📱 Ứng Dụng Mobile

- 🤖 **Nền tảng**: Android
- 📦 **Build**: Tạo APK qua Capacitor
- ⚡ **Tính năng**: GPS native, push notifications, hỗ trợ offline

---

## 🔐 Bảo Mật & Xác Thực

- 🔒 **Phân quyền theo vai trò** (RBAC)
- 🔑 **Xác thực bằng mật khẩu** cho nhân viên
- 🏨 **Xác thực bằng số phòng** cho khách
- 💾 **Quản lý session** qua localStorage
- 🛡️ **Bảo vệ API routes**

---

## 📊 Luồng Dữ Liệu

**Khi người dùng thực hiện hành động:**

1. 👆 **Người dùng thao tác** trên giao diện
2. 🎨 **Component React** xử lý sự kiện
3. 🔌 **Service Layer** gọi API
4. 🌐 **Backend API** nhận request
5. 🧠 **Controller** xử lý logic nghiệp vụ
6. 💾 **Model** truy vấn database
7. 🗄️ **PostgreSQL** lưu/trả dữ liệu
8. ✅ **Response** trả về frontend
9. 🔄 **UI tự động cập nhật** với dữ liệu mới

---

## 🎨 Giao Diện & Trải Nghiệm

- ✨ **Thiết kế hiện đại**: Glassmorphism, hiệu ứng gradient
- 📱 **Responsive**: Tối ưu cho mobile trước
- 🔄 **Cập nhật real-time**: Tự động làm mới trạng thái
- 🔔 **Thông báo**: Badge số đếm, push notifications
- 🧭 **Điều hướng mượt mà**: Thanh nav dưới, chuyển màn hình mượt

---

## 📝 Thông Tin Dự Án

- 📌 **Phiên bản**: V1.1
- ✅ **Trạng thái**: Sẵn sàng production
- 🚀 **Triển khai**: Vercel (Serverless Functions)
- 🗄️ **Database**: PostgreSQL (Cloud/On-premise)
- 📱 **Mobile**: Hỗ trợ Android APK

---

*Tài liệu mô tả flow và cấu trúc dự án Furama Resort Digital Concierge V1.1*

