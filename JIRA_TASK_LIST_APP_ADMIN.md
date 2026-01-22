# Epic: App Admin - Quản lý hệ thống CMS resort

## STORIES (Tính năng mới/thiếu)

### Story 1: Chỉnh sửa Sự kiện
**Tên:** Cho phép chỉnh sửa thông tin sự kiện đã tạo
**Mô tả:** Hiện tại chỉ có thể thêm mới và xóa sự kiện. Cần thêm chức năng chỉnh sửa để cập nhật ngày, giờ, địa điểm, mô tả mà không phải xóa và tạo lại.

### Story 2: Chỉnh sửa Knowledge Base
**Tên:** Cho phép chỉnh sửa câu hỏi và câu trả lời trong Knowledge Base
**Mô tả:** Cần có khả năng sửa các câu hỏi và câu trả lời đã tạo để cập nhật thông tin cho chatbot, cải thiện chất lượng phản hồi.

### Story 3: Chỉnh sửa Lịch làm việc Tài xế
**Tên:** Cho phép chỉnh sửa lịch làm việc của tài xế
**Mô tả:** Hiện tại chỉ có thể thêm mới và xóa lịch. Cần thêm chức năng chỉnh sửa ca làm việc, ngày nghỉ mà không phải xóa và tạo lại.

### Story 6: Tìm kiếm nâng cao
**Tên:** Tìm kiếm với nhiều tiêu chí và gợi ý tự động
**Mô tả:** Cho phép tìm kiếm với nhiều bộ lọc cùng lúc (loại, ngày, trạng thái) và có gợi ý tự động khi gõ để tìm nhanh hơn.

### Story 7: Xuất dữ liệu toàn bộ
**Tên:** Xuất toàn bộ dữ liệu ra file Excel/CSV
**Mô tả:** Cho phép xuất dữ liệu của từng mục (địa điểm, menu, sự kiện, khách hàng, lịch sử) ra file để backup và phân tích.

### Story 8: Tải ảnh trực tiếp
**Tên:** Tải ảnh trực tiếp từ máy tính lên hệ thống
**Mô tả:** Thay vì phải nhập link ảnh, cho phép tải ảnh trực tiếp từ máy tính cho menu món ăn và khuyến mãi.

### Story 9: Lịch sử thay đổi
**Tên:** Hiển thị lịch sử ai đã thay đổi gì, khi nào
**Mô tả:** Ghi lại và hiển thị lịch sử thêm/sửa/xóa dữ liệu (ai làm, khi nào, thay đổi gì) để theo dõi hoạt động quản lý.

---

## BUGS (Lỗi cần sửa)

### Bug 1: Thông báo popup cứng nhắc
**Tên:** Thay thế popup thông báo bằng thông báo nhẹ nhàng
**Mô tả:** Hiện tại dùng alert() gây gián đoạn. Cần thay bằng thông báo ở góc màn hình, tự động biến mất, không chặn công việc.

### Bug 2: Loại phòng không liên kết đúng địa điểm
**Tên:** Sửa lỗi liên kết địa điểm cho loại phòng
**Mô tả:** Khi chọn địa điểm cho loại phòng, hệ thống vẫn hiển thị "Unlinked" dù đã chọn. Cần kiểm tra và sửa logic matching ID.

### Bug 3: Import CSV không kiểm tra định dạng
**Tên:** Kiểm tra và cảnh báo định dạng file CSV trước khi import
**Mô tả:** Hiện tại import CSV không kiểm tra trước, dễ gây lỗi khi file sai cấu trúc. Cần validate và hiển thị lỗi rõ ràng.

### Bug 5: Xác nhận xóa thiếu thông tin
**Tên:** Hiển thị thông tin chi tiết trong hộp xác nhận xóa
**Mô tả:** Khi xóa, chỉ hiện "Are you sure?" chung chung. Cần hiển thị tên và thông tin của mục sẽ bị xóa để tránh xóa nhầm.

### Bug 6: Thiếu chức năng sửa lịch làm việc
**Tên:** Thêm nút chỉnh sửa lịch làm việc
**Mô tả:** Hiện tại chỉ có thêm mới và xóa lịch làm việc. Cần thêm nút sửa để chỉnh ca làm, ngày nghỉ mà không phải xóa và tạo lại.

---

## TASKS (Công việc cải thiện hệ thống)

### Task 1: Cải thiện hệ thống thông báo
**Tên:** Xây dựng hệ thống thông báo đẹp và rõ ràng
**Mô tả:** Thay thế alert() bằng toast notifications với giao diện đẹp, hiển thị ở góc màn hình, tự động biến mất, phân loại thành công/lỗi/cảnh báo.

### Task 2: Hiển thị trạng thái đang xử lý
**Tên:** Thêm loading indicator cho các thao tác
**Mô tả:** Hiển thị spinner hoặc progress bar khi lưu, xóa, import dữ liệu để người dùng biết hệ thống đang xử lý, tránh click nhiều lần.

### Task 3: Cải thiện kiểm tra dữ liệu form
**Tên:** Validation form với thông báo lỗi rõ ràng
**Mô tả:** Kiểm tra dữ liệu nhập vào form ngay khi gõ, hiển thị thông báo lỗi rõ ràng và đánh dấu trường sai bằng màu đỏ.

### Task 4: Phân trang cho danh sách dài
**Tên:** Thêm phân trang cho các danh sách lớn
**Mô tả:** Khi có nhiều địa điểm, menu items, khách hàng, cần phân trang để tải nhanh và dễ xem hơn, không phải scroll dài.

### Task 5: Sắp xếp dữ liệu theo cột
**Tên:** Cho phép sắp xếp dữ liệu theo các cột
**Mô tả:** Click vào header cột để sắp xếp theo tên, ngày, giá, trạng thái (tăng dần/giảm dần) để tìm kiếm và quản lý dễ hơn.

### Task 6: Tối ưu giao diện trên điện thoại
**Tên:** Responsive design cho mobile
**Mô tả:** Tối ưu layout, font size, button size để quản lý được trên điện thoại, không cần máy tính, tiện lợi mọi lúc mọi nơi.

### Task 7: Viết hướng dẫn sử dụng
**Tên:** Tài liệu hướng dẫn chi tiết cho nhân viên
**Mô tả:** Viết hướng dẫn từng chức năng với hình ảnh minh họa để nhân viên mới dễ học và sử dụng đúng cách.

---
