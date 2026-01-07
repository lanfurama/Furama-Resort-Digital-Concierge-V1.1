# 📱 Hướng Dẫn Build APK Release với Android Studio

Sau khi Android Studio mở lên và sync xong (đợi thanh loading ở góc dưới cùng chạy xong), bạn làm theo các bước sau:

## 1️⃣ Tạo Keystore (Chìa khóa bảo mật)

1. Trên menu bar, chọn **Build** -> **Generate Signed Bundle / APK...**
2. Chọn **APK** -> Bấm **Next**.
3. Tại dòng **Key store path**, bấm vào **Create new...**
4. Điền thông tin:
   - **Key store path**: Bấm biểu tượng 📁, chọn thư mục dự án `driver-app`, đặt tên file là `furama.jks`.
   - **Password**: Điền mật khẩu (ví dụ: `123456`) và xác nhận lại.
   - **Key -> Alias**: Để mặc định `key0` hoặc đặt `furama`.
   - **Key -> Password**: Điền mật khẩu giống ở trên.
   - **Certificate**: Điền ít nhất dòng *First and Last Name* (ví dụ: `Furama`).
5. Bấm **OK**.

## 2️⃣ Build APK

1. Sau khi tạo xong, nó sẽ quay lại màn hình cũ và tự điền thông tin.
2. Bấm **Next**.
3. Chọn:
   - **release** (QUAN TRỌNG: không chọn debug)
   - Tích vào **V1 (Jar Signature)** và **V2 (Full APK Signature)** (nếu có tùy chọn này).
4. Bấm **Create** hoặc **Finish**.

## 3️⃣ Lấy file APK

Android Studio sẽ chạy build (khoảng 1-5 phút).
Khi xong, sẽ có thông báo "Generate Signed APK" hiện lên ở góc dưới phải.
Bấm vào chữ **locate** trong thông báo đó.

Hoặc tìm file thủ công tại:
`driver-app\android\app\release\app-release.apk`

---
**Lưu ý:**
- Nếu gặp lỗi Sync Gradle, hãy bấm nút "Try Again" hoặc biểu tượng con voi (Sync Project with Gradle Files).
- File APK này có thể copy vào điện thoại Android để cài đặt ngay.
