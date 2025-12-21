# 📋 DÀN Ý SLIDE TRÌNH BÀY CHO ĐỘI NGŨ BUGGY VILLAS

> **Mục tiêu:** Giới thiệu và hướng dẫn sử dụng hệ thống Digital Concierge cho tài xế buggy

---

## 🎯 SLIDE 1: TỔNG QUAN HỆ THỐNG

**Tiêu đề:** "Furama Resort Digital Concierge - Hệ thống quản lý xe điện thông minh"

**Nội dung:**
- Giới thiệu hệ thống mới
- Lợi ích cho tài xế:
  - ✅ Nhận chuyến tự động, không cần gọi điện
  - ✅ Xem thông tin khách trước khi đến
  - ✅ Chat trực tiếp với khách qua app
  - ✅ Theo dõi lịch sử chuyến đi
- **Hình ảnh:** Logo Furama, icon app

---

## 🚗 SLIDE 2: QUY TRÌNH LÀM VIỆC - TỔNG QUAN

**Tiêu đề:** "Quy trình làm việc của tài xế buggy"

**Nội dung (dạng flowchart đơn giản):**
```
1. Đăng nhập → Online
2. Nhận thông báo yêu cầu mới
3. Chấp nhận chuyến (Accept)
4. Đến điểm đón
5. Xác nhận đã đón khách
6. Đưa khách đến đích
7. Hoàn thành chuyến
8. Sẵn sàng nhận chuyến mới
```

**Hình ảnh:** Sơ đồ mũi tên đơn giản

---

## 📱 SLIDE 3: BƯỚC 1 - ĐĂNG NHẬP & GIỮ TRẠNG THÁI ONLINE

**Tiêu đề:** "Bước 1: Đăng nhập và giữ trạng thái Online"

**Nội dung:**
- **Cách đăng nhập:**
  - Mở Driver Portal
  - Nhập Username (ID tài xế) và Password
  - Nhấn "Login"

- **Quan trọng:**
  - ⚠️ **Phải giữ app mở** để nhận chuyến
  - Hệ thống tự động gửi "heartbeat" mỗi 30 giây
  - Nếu tắt app → Tự động offline → Không nhận được chuyến

- **Trạng thái Online:**
  - ✅ Xanh = Online (sẵn sàng nhận chuyến)
  - ❌ Xám = Offline (không nhận chuyến)

**Hình ảnh:** Screenshot màn hình login, icon online/offline

---

## 🔔 SLIDE 4: BƯỚC 2 - NHẬN YÊU CẦU MỚI

**Tiêu đề:** "Bước 2: Nhận thông báo yêu cầu mới"

**Nội dung:**
- **Cách hoạt động:**
  - Hệ thống tự động gửi thông báo khi có khách đặt xe
  - Thông báo hiện trên màn hình + âm thanh

- **Thông tin hiển thị:**
  - 📍 **Điểm đón:** Vị trí khách đang đợi
  - 🎯 **Điểm đến:** Nơi khách muốn đến
  - 👤 **Phòng khách:** Số phòng (ví dụ: Room 205)
  - ⏰ **Thời gian chờ:** Khách đã chờ bao lâu

- **AI tự động phân công:**
  - Hệ thống tính toán tài xế gần nhất
  - Ưu tiên tài xế đang rảnh
  - Ưu tiên khách chờ lâu

**Hình ảnh:** Screenshot thông báo, danh sách yêu cầu

---

## ✅ SLIDE 5: BƯỚC 3 - CHẤP NHẬN CHUYẾN

**Tiêu đề:** "Bước 3: Chấp nhận chuyến (Accept Ride)"

**Nội dung:**
- **Các bước:**
  1. Xem chi tiết yêu cầu
  2. Kiểm tra điểm đón và điểm đến
  3. Nhấn nút **"Accept Ride"** (màu xanh)
  4. Hệ thống tự động cập nhật trạng thái

- **Sau khi chấp nhận:**
  - ✅ Khách nhận thông báo: "Tài xế đã chấp nhận"
  - ✅ Trạng thái: `ASSIGNED` (Đã phân công)
  - ✅ Có thể chat với khách ngay

- **Lưu ý:**
  - ⚠️ Chấp nhận nhanh để khách không phải chờ
  - ⚠️ Nếu không thể nhận, để hệ thống tự động phân công tài xế khác

**Hình ảnh:** Screenshot nút Accept, trạng thái ASSIGNED

---

## 🚗 SLIDE 6: BƯỚC 4 - ĐẾN ĐIỂM ĐÓN

**Tiêu đề:** "Bước 4: Đến điểm đón khách"

**Nội dung:**
- **Trên đường đến:**
  - Có thể chat với khách để xác nhận vị trí
  - Có thể cập nhật ETA (thời gian ước tính đến)
  - Khách sẽ thấy: "Tài xế đang đến"

- **Khi đã đến:**
  1. Tìm khách tại điểm đón
  2. Xác nhận với khách (tên, phòng)
  3. Nhấn nút **"Picked Up"** (Đã đón khách)
  4. Hệ thống tự động cập nhật

- **Sau khi đón:**
  - ✅ Trạng thái: `ON_TRIP` (Đang di chuyển)
  - ✅ Khách nhận thông báo: "Tài xế đã đón"

**Hình ảnh:** Screenshot nút Picked Up, trạng thái ON_TRIP

---

## 🎯 SLIDE 7: BƯỚC 5 - HOÀN THÀNH CHUYẾN

**Tiêu đề:** "Bước 5: Hoàn thành chuyến"

**Nội dung:**
- **Khi đã đến đích:**
  1. Đưa khách đến đúng điểm đến
  2. Xác nhận với khách
  3. Nhấn nút **"Complete Ride"** (Hoàn thành)
  4. Hệ thống tự động cập nhật

- **Sau khi hoàn thành:**
  - ✅ Trạng thái: `COMPLETED` (Hoàn thành)
  - ✅ Khách có thể đánh giá dịch vụ
  - ✅ Tài xế tự động về trạng thái `ONLINE` (sẵn sàng nhận chuyến mới)

- **Lưu ý:**
  - ⚠️ Luôn xác nhận với khách trước khi hoàn thành
  - ⚠️ Hoàn thành đúng để hệ thống ghi nhận chính xác

**Hình ảnh:** Screenshot nút Complete, trạng thái COMPLETED

---

## 💬 SLIDE 8: TÍNH NĂNG CHAT VỚI KHÁCH

**Tiêu đề:** "Chat trực tiếp với khách"

**Nội dung:**
- **Khi nào cần chat:**
  - Xác nhận vị trí đón
  - Hướng dẫn khách đến điểm đón
  - Thông báo thời gian đến
  - Giải đáp thắc mắc

- **Cách sử dụng:**
  1. Mở tab "Chat" trong chuyến đang thực hiện
  2. Gõ tin nhắn
  3. Nhấn gửi
  4. Khách nhận thông báo ngay

- **Lợi ích:**
  - ✅ Giao tiếp nhanh, không cần gọi điện
  - ✅ Khách biết tài xế đang đến
  - ✅ Giảm nhầm lẫn vị trí

**Hình ảnh:** Screenshot giao diện chat

---

## 🤖 SLIDE 9: AI TỰ ĐỘNG PHÂN CÔNG

**Tiêu đề:** "AI tự động phân công - Tài xế không cần lo lắng"

**Nội dung:**
- **Cách hoạt động:**
  - Hệ thống tự động tính toán tài xế phù hợp nhất
  - Dựa trên:
    - 📍 Khoảng cách từ tài xế đến điểm đón
    - ⏰ Thời gian chờ của khách (ưu tiên khách chờ lâu)
    - 🚗 Tài xế đang rảnh hay đang có chuyến

- **Chain Trip (Chuyến nối tiếp):**
  - Nếu tài xế đang có chuyến nhưng gần điểm đón mới
  - Hệ thống tự động đề xuất chuyến nối tiếp
  - Tối ưu thời gian và hiệu quả

- **Lợi ích:**
  - ✅ Tài xế không cần tự tìm chuyến
  - ✅ Phân công công bằng, tối ưu
  - ✅ Giảm thời gian chờ của khách

**Hình ảnh:** Sơ đồ AI phân công, icon AI

---

## 📊 SLIDE 10: XEM LỊCH SỬ CHUYẾN ĐI

**Tiêu đề:** "Xem lịch sử chuyến đi"

**Nội dung:**
- **Tính năng:**
  - Xem tất cả chuyến đã hoàn thành
  - Xem chi tiết từng chuyến:
    - Điểm đón → Điểm đến
    - Thời gian
    - Đánh giá của khách (nếu có)

- **Cách xem:**
  1. Mở Driver Portal
  2. Chọn tab "History" (Lịch sử)
  3. Xem danh sách chuyến đã hoàn thành

- **Lợi ích:**
  - ✅ Theo dõi công việc
  - ✅ Xem đánh giá của khách
  - ✅ Cải thiện dịch vụ

**Hình ảnh:** Screenshot màn hình History

---

## ⚠️ SLIDE 11: LƯU Ý QUAN TRỌNG

**Tiêu đề:** "Những điều cần nhớ"

**Nội dung (dạng checklist):**
- ✅ **Luôn giữ app mở** để nhận chuyến (heartbeat mỗi 30 giây)
- ✅ **Chấp nhận chuyến nhanh** để khách không phải chờ
- ✅ **Xác nhận với khách** trước khi đón và hoàn thành
- ✅ **Sử dụng chat** để giao tiếp với khách
- ✅ **Hoàn thành đúng** để hệ thống ghi nhận chính xác
- ⚠️ **Không tắt app** khi đang làm việc
- ⚠️ **Không bỏ qua chuyến** đã chấp nhận

**Hình ảnh:** Icon checkmark, warning

---

## 🎯 SLIDE 12: TÓM TẮT QUY TRÌNH

**Tiêu đề:** "Tóm tắt quy trình làm việc"

**Nội dung (dạng timeline):**
```
1. Đăng nhập → Online ✅
2. Nhận thông báo yêu cầu 🔔
3. Chấp nhận chuyến (Accept) ✅
4. Đến điểm đón 🚗
5. Xác nhận đã đón (Picked Up) ✅
6. Đưa khách đến đích 🎯
7. Hoàn thành (Complete) ✅
8. Sẵn sàng nhận chuyến mới 🔄
```

**Thông điệp:**
- "Đơn giản, nhanh chóng, hiệu quả"
- "Hệ thống tự động hỗ trợ tài xế"

**Hình ảnh:** Icon timeline, logo Furama

---

## ❓ SLIDE 13: CÂU HỎI THƯỜNG GẶP (FAQ)

**Tiêu đề:** "Câu hỏi thường gặp"

**Nội dung:**

**Q1: Nếu tôi tắt app thì sao?**
- A: Hệ thống tự động chuyển sang offline, không nhận được chuyến mới

**Q2: Tôi có thể từ chối chuyến không?**
- A: Có, nhưng nên để hệ thống tự động phân công tài xế khác

**Q3: Làm sao biết khách đang ở đâu?**
- A: Xem thông tin điểm đón trong yêu cầu, hoặc chat với khách

**Q4: Nếu khách không có mặt tại điểm đón?**
- A: Chat với khách để xác nhận, hoặc liên hệ Reception

**Q5: Tôi có thể xem lịch sử chuyến không?**
- A: Có, vào tab "History" để xem tất cả chuyến đã hoàn thành

**Hình ảnh:** Icon question mark

---

## 📞 SLIDE 14: HỖ TRỢ & LIÊN HỆ

**Tiêu đề:** "Cần hỗ trợ?"

**Nội dung:**
- **Nếu gặp vấn đề:**
  - Liên hệ Reception để được hỗ trợ
  - Hoặc liên hệ IT Support

- **Thông tin liên hệ:**
  - Reception: [Số điện thoại]
  - IT Support: [Email/Số điện thoại]

- **Lưu ý:**
  - Luôn báo cáo sự cố kịp thời
  - Giữ app cập nhật phiên bản mới nhất

**Hình ảnh:** Icon phone, email

---

## 🎉 SLIDE 15: KẾT THÚC

**Tiêu đề:** "Cảm ơn và chúc làm việc hiệu quả!"

**Nội dung:**
- **Thông điệp:**
  - "Hệ thống Digital Concierge giúp công việc của tài xế dễ dàng hơn"
  - "Chúc các bạn làm việc hiệu quả và hài lòng!"

- **Call to action:**
  - "Hãy thử ngay và trải nghiệm!"
  - "Mọi thắc mắc, vui lòng liên hệ Reception"

**Hình ảnh:** Logo Furama, icon thumbs up

---

## 📝 GỢI Ý THIẾT KẾ SLIDE

### Màu sắc:
- **Chủ đạo:** Xanh lá (emerald) - màu Furama
- **Phụ:** Xanh dương (blue), cam (orange) cho cảnh báo
- **Nền:** Trắng hoặc xám nhạt

### Font chữ:
- **Tiêu đề:** Bold, size lớn (24-32pt)
- **Nội dung:** Regular, size vừa (16-18pt)
- **Lưu ý:** Italic hoặc màu đỏ/cam

### Hình ảnh:
- Screenshot màn hình app thực tế
- Icon đơn giản, dễ hiểu
- Sơ đồ flowchart cho quy trình
- Logo Furama

### Layout:
- Mỗi slide 1 chủ đề chính
- Không quá nhiều text (tối đa 5-7 bullet points)
- Nhiều hình ảnh, ít chữ
- Sử dụng icon để minh họa

---

## 🎬 GỢI Ý TRÌNH BÀY

### Thời gian:
- **Tổng thời gian:** 15-20 phút
- **Slide 1-2:** 2 phút (Giới thiệu)
- **Slide 3-7:** 8 phút (Quy trình chi tiết)
- **Slide 8-10:** 4 phút (Tính năng)
- **Slide 11-14:** 4 phút (Lưu ý & FAQ)
- **Slide 15:** 1 phút (Kết thúc)

### Cách trình bày:
1. **Bắt đầu:** Giới thiệu hệ thống và lợi ích
2. **Phần chính:** Đi từng bước quy trình, có thể demo trực tiếp
3. **Phần phụ:** Giải thích tính năng và lưu ý
4. **Kết thúc:** Tóm tắt và Q&A

### Demo trực tiếp (nếu có):
- Mở Driver Portal
- Demo đăng nhập
- Demo nhận và chấp nhận chuyến
- Demo chat với khách
- Demo hoàn thành chuyến

---

**📅 Ngày soạn:** [Ngày tháng năm]

**👤 Người soạn:** [Tên]

**🎯 Đối tượng:** Đội ngũ Buggy Villas - Furama Resort Danang

