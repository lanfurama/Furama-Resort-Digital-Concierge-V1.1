# 📘 Phân Tích Thiết Kế Hệ Thống
## Furama Resort Digital Concierge V1.1

---

## 🎯 Hệ Thống Là Gì?

**Furama Resort Digital Concierge** là một ứng dụng kỹ thuật số giúp quản lý và cung cấp dịch vụ cho resort một cách tự động và thông minh. Hệ thống kết nối khách hàng, nhân viên, tài xế và quản trị viên trên một nền tảng duy nhất, giúp:

- ✅ Khách hàng đặt dịch vụ dễ dàng, nhanh chóng
- ✅ Nhân viên xử lý đơn hàng hiệu quả
- ✅ Tài xế quản lý chuyến đi thuận tiện
- ✅ Quản trị viên quản lý toàn bộ hệ thống tập trung

---

## 👥 Ai Sử Dụng Hệ Thống?

Hệ thống được thiết kế cho **6 nhóm người dùng** với các quyền và chức năng khác nhau:

### 1. 🏖️ **Khách Hàng (Guest)**
**Đăng nhập bằng:** Số phòng + Tên khách hàng

**Có thể làm gì:**
- Xem thông tin resort, khuyến mãi, sự kiện
- Đặt dịch vụ: ăn uống, spa, đồ uống hồ bơi, yêu cầu butler
- Đặt xe buggy và theo dõi vị trí tài xế real-time
- Chat với AI Concierge để được tư vấn 24/7
- Xem và quản lý các đơn hàng đã đặt
- Cập nhật thông tin cá nhân, chọn ngôn ngữ

**Giao diện:** Màn hình chính với menu dịch vụ, thanh điều hướng dưới cùng

---

### 2. 🚗 **Tài Xế Buggy (Driver)**
**Đăng nhập bằng:** Mã nhân viên + Mật khẩu

**Có thể làm gì:**
- Xem danh sách yêu cầu đặt xe đang chờ
- Nhận hoặc từ chối đơn hàng
- Cập nhật vị trí GPS real-time
- Cập nhật trạng thái chuyến đi (đang đến, đã đón khách, đang đi, hoàn thành)
- Chat với khách hàng trong suốt chuyến đi
- Xem lịch sử các chuyến đi đã hoàn thành

**Giao diện:** Dashboard hiển thị bản đồ, danh sách đơn hàng, thông tin chuyến đi hiện tại

---

### 3. 👨‍💼 **Nhân Viên Dịch Vụ (Staff)**
**Đăng nhập bằng:** Mã nhân viên + Mật khẩu

**Có thể làm gì:**
- Xem tất cả đơn hàng dịch vụ đang chờ xử lý
- Xác nhận, cập nhật trạng thái và hoàn thành đơn hàng
- Lọc đơn hàng theo bộ phận (Nhà hàng, Spa, Hồ bơi, Butler)
- Chat với khách hàng khi cần hỗ trợ
- Xem thông báo về đơn hàng mới

**Giao diện:** Dashboard với danh sách đơn hàng, bộ lọc, và chat widget

---

### 4. 🏨 **Lễ Tân (Reception)**
**Đăng nhập bằng:** Mã nhân viên + Mật khẩu

**Có thể làm gì:**
- Check-in/Check-out khách hàng
- Quản lý thông tin phòng
- Xem danh sách khách đang lưu trú
- Tạo và quản lý mã check-in cho khách
- Xem thống kê phòng trống/đã đặt

**Giao diện:** Dashboard quản lý phòng với danh sách khách và thông tin check-in/out

---

### 5. 👑 **Quản Trị Viên (Admin)**
**Đăng nhập bằng:** Mã admin + Mật khẩu

**Có thể làm gì:**
- Quản lý tất cả người dùng (thêm, sửa, xóa)
- Quản lý menu dịch vụ (món ăn, dịch vụ spa, v.v.)
- Tạo và quản lý chương trình khuyến mãi
- Quản lý sự kiện resort
- Cập nhật cơ sở tri thức cho AI Concierge
- Quản lý địa điểm trong resort
- Xem báo cáo và thống kê toàn hệ thống
- Cấu hình hệ thống

**Giao diện:** Dashboard quản trị với nhiều tab quản lý khác nhau

---

### 6. 👔 **Giám Sát (Supervisor)**
**Đăng nhập bằng:** Mã supervisor + Mật khẩu

**Có thể làm gì:**
- Xem dashboard giám sát với thống kê tổng quan
- Theo dõi hiệu suất các bộ phận
- Xem báo cáo và phân tích
- Quyền hạn hạn chế hơn Admin (chỉ xem, không chỉnh sửa)

**Giao diện:** Dashboard giám sát với biểu đồ và thống kê

---

## 🔄 Hệ Thống Hoạt Động Như Thế Nào?

### **Luồng Đặt Dịch Vụ (Ví dụ: Đặt Đồ Ăn)**

1. **Khách hàng:**
   - Mở app → Chọn "Dining Order"
   - Xem menu, chọn món, thêm vào giỏ
   - Nhấn "Đặt hàng"
   - Hệ thống tự động gửi đơn đến nhân viên

2. **Hệ thống:**
   - Lưu đơn vào database với trạng thái "PENDING"
   - Gửi thông báo đến nhân viên bộ phận Dining
   - Hiển thị đơn trong danh sách "Đơn đang chờ" của Staff

3. **Nhân viên:**
   - Nhận thông báo có đơn mới
   - Xem chi tiết đơn, xác nhận
   - Cập nhật trạng thái: "CONFIRMED" → "PREPARING" → "COMPLETED"
   - Mỗi lần cập nhật, khách hàng tự động nhận thông báo

4. **Khách hàng:**
   - Xem trạng thái đơn hàng real-time trong "Active Orders"
   - Nhận thông báo khi đơn được xác nhận, đang chuẩn bị, hoàn thành

---

### **Luồng Đặt Xe Buggy**

1. **Khách hàng đặt xe:**
   - Chọn điểm đón và điểm đến trên bản đồ
   - Nhấn "Đặt xe"
   - Hệ thống tìm tài xế gần nhất

2. **Hệ thống tìm tài xế:**
   - Trạng thái: **SEARCHING** (đang tìm)
   - Tự động gửi yêu cầu đến các tài xế đang online
   - Tài xế gần điểm đón nhất sẽ nhận được thông báo ưu tiên

3. **Tài xế nhận đơn:**
   - Xem thông tin: điểm đón, điểm đến, số phòng khách
   - Chọn "Nhận đơn" hoặc "Từ chối"
   - Nếu nhận: Trạng thái chuyển thành **ASSIGNED**

4. **Tài xế đến đón:**
   - Cập nhật vị trí GPS real-time
   - Khi gần điểm đón: Cập nhật trạng thái **ARRIVING**
   - Khách hàng thấy tài xế đang đến trên bản đồ

5. **Trong chuyến đi:**
   - Tài xế đón khách: Trạng thái **ON_TRIP**
   - Cả khách và tài xế có thể chat với nhau
   - Khách hàng theo dõi vị trí real-time

6. **Hoàn thành:**
   - Tài xế đến điểm đến: Trạng thái **COMPLETED**
   - Khách hàng có thể đánh giá chuyến đi

---

### **Luồng Chat với AI Concierge**

1. **Khách hàng hỏi:**
   - Mở "Concierge Chat"
   - Gửi câu hỏi (ví dụ: "Giờ mở cửa nhà hàng?")

2. **AI xử lý:**
   - AI (Google Gemini) nhận câu hỏi
   - Tự động tra cứu trong "Knowledge Base" (cơ sở tri thức)
   - Trả lời ngay lập tức nếu có thông tin

3. **Nếu AI không trả lời được:**
   - Tự động chuyển câu hỏi cho nhân viên
   - Nhân viên nhận thông báo và trả lời
   - Khách hàng nhận phản hồi từ nhân viên

4. **Hỗ trợ đa ngôn ngữ:**
   - AI hiểu và trả lời bằng nhiều ngôn ngữ
   - Tự động dịch nội dung theo ngôn ngữ người dùng chọn

---

## 🎨 Giao Diện và Trải Nghiệm

### **Thiết Kế Hiện Đại**
- **Glassmorphism:** Hiệu ứng kính mờ, trong suốt
- **Gradient:** Màu sắc chuyển tiếp mượt mà
- **Animation:** Chuyển động mượt mà, không giật lag
- **Responsive:** Tối ưu cho điện thoại, máy tính bảng

### **Điều Hướng Dễ Dàng**
- **Thanh điều hướng dưới cùng:** Luôn hiển thị, dễ truy cập
- **Badge thông báo:** Số đếm đơn hàng, thông báo mới
- **Trạng thái real-time:** Tự động cập nhật không cần refresh

### **Thông Báo Thông Minh**
- **Badge số đếm:** Hiển thị số đơn hàng đang chờ
- **Thông báo trạng thái:** Khi đơn hàng thay đổi trạng thái
- **Thông báo khẩn cấp:** Khi có vấn đề cần xử lý ngay

---

## 🔐 Bảo Mật và Quyền Truy Cập

### **Phân Quyền Theo Vai Trò**
- Mỗi vai trò chỉ thấy và làm được những gì phù hợp
- Khách hàng không thể truy cập trang quản trị
- Nhân viên chỉ thấy đơn hàng của bộ phận mình

### **Xác Thực An Toàn**
- **Khách hàng:** Đăng nhập bằng số phòng + tên (không cần mật khẩu)
- **Nhân viên/Tài xế/Admin:** Đăng nhập bằng mã + mật khẩu
- Session được lưu an toàn, tự động đăng xuất khi hết hạn

---

## 📱 Sử Dụng Trên Nhiều Thiết Bị

### **Web App**
- Truy cập qua trình duyệt trên máy tính, điện thoại
- Không cần cài đặt
- Tự động lưu trạng thái đăng nhập

### **Mobile App (Android)**
- Có thể build thành ứng dụng Android (APK)
- Sử dụng GPS native để theo dõi vị trí chính xác
- Push notifications khi có thông báo mới
- Hoạt động tốt cả khi mạng yếu

---

## ⚡ Hiệu Năng và Tối Ưu

### **Cập Nhật Thông Minh**
- Hệ thống tự động cập nhật thông tin mới
- Không cần refresh trang thủ công
- Tần suất cập nhật được tối ưu để không làm chậm app

### **Tiết Kiệm Dữ Liệu**
- Chỉ tải dữ liệu cần thiết
- Tối ưu hình ảnh, giảm dung lượng
- Cache thông minh để giảm tải server

---

## 🌟 Tính Năng Nổi Bật

### 1. **AI Concierge 24/7**
- Trả lời tự động các câu hỏi thường gặp
- Hỗ trợ đa ngôn ngữ
- Chuyển tiếp cho nhân viên khi cần

### 2. **Theo Dõi Real-Time**
- Vị trí tài xế cập nhật mỗi vài giây
- Trạng thái đơn hàng cập nhật ngay lập tức
- Thông báo push khi có thay đổi

### 3. **Đa Ngôn Ngữ**
- Hỗ trợ: Tiếng Việt, English, Korean, Japanese, Chinese, French, Russian
- Tự động dịch menu, thông báo
- Người dùng chọn ngôn ngữ ưa thích

### 4. **Quản Lý Tập Trung**
- Tất cả đơn hàng, khách hàng, nhân viên ở một nơi
- Báo cáo và thống kê chi tiết
- Dễ dàng tìm kiếm và lọc thông tin

---

## 📊 Tình Huống Sử Dụng Thực Tế

### **Tình Huống 1: Khách Đặt Bữa Sáng**
1. Khách thức dậy, mở app
2. Chọn "Dining Order" → Xem menu bữa sáng
3. Chọn món, đặt hàng
4. 15 phút sau, nhân viên xác nhận đơn
5. 30 phút sau, đơn sẵn sàng, khách nhận thông báo
6. Khách đánh giá chất lượng dịch vụ

### **Tình Huống 2: Khách Cần Đi Từ Phòng Đến Bãi Biển**
1. Khách mở "Buggy Booking"
2. Chọn điểm đón: "Villa 101", điểm đến: "Beach"
3. Đặt xe, hệ thống tìm tài xế
4. Tài xế nhận đơn, bắt đầu đến đón
5. Khách theo dõi tài xế trên bản đồ
6. Tài xế đến, khách lên xe
7. Đến bãi biển, hoàn thành chuyến đi

### **Tình Huống 3: Khách Hỏi Về Dịch Vụ Spa**
1. Khách mở "Concierge Chat"
2. Hỏi: "Giờ mở cửa spa là mấy giờ?"
3. AI tự động trả lời: "Spa mở cửa từ 9:00 - 22:00 hàng ngày"
4. Khách hỏi thêm: "Có dịch vụ massage nào?"
5. AI liệt kê các dịch vụ massage có sẵn
6. Khách đặt lịch spa ngay trong chat

---

## 🎯 Lợi Ích Của Hệ Thống

### **Cho Khách Hàng:**
- ✅ Đặt dịch vụ nhanh chóng, không cần gọi điện
- ✅ Theo dõi đơn hàng real-time
- ✅ Chat với AI 24/7, được tư vấn ngay lập tức
- ✅ Đặt xe buggy dễ dàng, biết tài xế ở đâu

### **Cho Nhân Viên:**
- ✅ Quản lý đơn hàng tập trung, không bỏ sót
- ✅ Thông báo ngay khi có đơn mới
- ✅ Chat với khách trực tiếp trong app
- ✅ Lọc đơn hàng theo bộ phận dễ dàng

### **Cho Tài Xế:**
- ✅ Nhận đơn tự động, không cần điều phối viên
- ✅ GPS giúp tìm đường nhanh nhất
- ✅ Chat với khách trong suốt chuyến đi
- ✅ Quản lý lịch sử chuyến đi

### **Cho Quản Trị:**
- ✅ Quản lý toàn bộ hệ thống từ một nơi
- ✅ Xem báo cáo và thống kê chi tiết
- ✅ Cập nhật menu, khuyến mãi dễ dàng
- ✅ Theo dõi hiệu suất nhân viên

---

## 🔧 Cách Hệ Thống Xử Lý Dữ Liệu

### **Khi Khách Đặt Dịch Vụ:**
1. Thông tin được lưu vào database
2. Hệ thống tự động gửi thông báo đến nhân viên
3. Nhân viên xác nhận → Database cập nhật
4. Khách hàng nhận thông báo → Giao diện tự động refresh

### **Khi Tài Xế Cập Nhật Vị Trí:**
1. GPS gửi tọa độ mới
2. Database lưu vị trí
3. Khách hàng nhận dữ liệu mới
4. Bản đồ tự động cập nhật vị trí tài xế

### **Khi AI Trả Lời Câu Hỏi:**
1. Câu hỏi được gửi đến AI (Google Gemini)
2. AI tra cứu trong Knowledge Base
3. Trả lời được gửi về và hiển thị ngay
4. Nếu không trả lời được, chuyển cho nhân viên

---

## 📈 Tương Lai và Mở Rộng

Hệ thống được thiết kế để dễ dàng mở rộng:

- 🔮 **Thêm dịch vụ mới:** Dễ dàng thêm loại dịch vụ mới
- 🌍 **Thêm ngôn ngữ:** Hỗ trợ thêm ngôn ngữ mới
- 📱 **iOS App:** Có thể phát triển app iOS
- 🤖 **AI Thông Minh Hơn:** Cải thiện khả năng AI
- 📊 **Báo Cáo Nâng Cao:** Thêm nhiều loại báo cáo hơn

---

## 📞 Hỗ Trợ và Liên Hệ

Nếu có thắc mắc hoặc cần hỗ trợ:
- Xem tài liệu kỹ thuật: `PROJECT_FLOW_STRUCTURE.md`
- Xem hướng dẫn cài đặt: `README.md`
- Liên hệ đội phát triển qua email hoặc chat trong app

---

**Tài liệu này được tạo để giúp người dùng hiểu rõ cách hệ thống hoạt động và cách sử dụng hiệu quả.**

*Phiên bản: V1.1 | Cập nhật: 2025*

