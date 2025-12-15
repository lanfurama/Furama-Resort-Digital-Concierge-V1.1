# Hướng dẫn Build APK cho Furama Resort Digital Concierge

Hướng dẫn chi tiết để chuyển đổi ứng dụng web React thành file APK Android.

## 📋 Yêu cầu hệ thống

### Windows:
1. **Node.js** (v18 trở lên) - [Tải về](https://nodejs.org/)
2. **Java JDK 17** - [Tải về](https://www.oracle.com/java/technologies/downloads/#java17)
3. **Android Studio** - [Tải về](https://developer.android.com/studio)
4. **Git** (tùy chọn) - [Tải về](https://git-scm.com/)

### Cài đặt Android Studio:
1. Tải và cài đặt Android Studio
2. Mở Android Studio → **More Actions** → **SDK Manager**
3. Cài đặt:
   - **Android SDK Platform 33** (hoặc mới hơn)
   - **Android SDK Build-Tools**
   - **Android SDK Command-line Tools**
4. Thêm vào biến môi trường:
   - `ANDROID_HOME` = `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   - Thêm vào PATH: `%ANDROID_HOME%\platform-tools` và `%ANDROID_HOME%\tools`

## 🚀 Các bước Build APK

### Bước 1: Cài đặt Dependencies

```bash
npm install
```

### Bước 2: Khởi tạo Capacitor (Chỉ chạy lần đầu - ĐÃ CÓ SẴN)

⚠️ **Lưu ý**: File `capacitor.config.ts` đã được tạo sẵn trong project, nên **KHÔNG CẦN** chạy `npm run cap:init` nữa.

Nếu bạn muốn tự tạo lại (không khuyến nghị):
```bash
# Xóa file config cũ trước
# npm run cap:init
```

### Bước 3: Thêm Android Platform

```bash
npm run cap:add:android
```

### Bước 4: Build ứng dụng web

```bash
npm run build
```

Lệnh này sẽ tạo thư mục `dist/` chứa các file đã build.

### Bước 5: Đồng bộ với Android

```bash
npm run cap:sync:android
```

Lệnh này sẽ copy các file từ `dist/` vào project Android.

### Bước 6: Mở Android Studio

```bash
npm run cap:open:android
```

Hoặc mở thủ công:
- Mở Android Studio
- **File** → **Open** → Chọn thư mục `android/`

### Bước 7: Cấu hình trong Android Studio

1. **Kiểm tra Gradle sync**:
   - Đợi Android Studio sync xong (thường có thông báo ở góc dưới)
   - Nếu có lỗi, click **Sync Now**

2. **Cấu hình Signing (Ký ứng dụng)**:
   - **File** → **Project Structure** → **Modules** → **app**
   - Tab **Signing Configs**:
     - Click **+** để tạo config mới
     - Đặt tên: `release`
     - Chọn **Key store file** (tạo mới hoặc dùng file có sẵn)
     - Nhập **Key store password**, **Key alias**, **Key password**
   
   ⚠️ **Lưu ý**: Lưu giữ file keystore và mật khẩu cẩn thận! Nếu mất sẽ không thể cập nhật app lên Play Store.

3. **Cấu hình Build Variants**:
   - **File** → **Project Structure** → **Modules** → **app** → **Build Variants**
   - Chọn **release** cho **Build Variant**

### Bước 8: Build APK

#### Cách 1: Build APK trực tiếp (Debug)

1. Trong Android Studio, menu **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Đợi build xong
3. Click **locate** trong thông báo để mở thư mục chứa APK
4. Đường dẫn thường là: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Cách 2: Build APK Release (Để phân phối)

1. Menu **Build** → **Generate Signed Bundle / APK**
2. Chọn **APK** → **Next**
3. Chọn **release** signing config đã tạo ở Bước 7
4. Chọn **release** build variant → **Finish**
5. APK sẽ được tạo tại: `android/app/build/outputs/apk/release/app-release.apk`

#### Cách 3: Build bằng Command Line

```bash
cd android
./gradlew assembleDebug        # Debug APK
./gradlew assembleRelease      # Release APK (cần signing config)
```

## 🔧 Cấu hình bổ sung

### Thay đổi App ID

Chỉnh sửa file `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.yourapp'
```

Sau đó chạy:
```bash
npm run cap:sync:android
```

### Thay đổi Icon và Splash Screen

1. Icon:
   - Thay thế các file trong `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - Hoặc dùng công cụ: https://capacitorjs.com/docs/guides/splash-screens-and-icons

2. Splash Screen:
   - Cấu hình trong `capacitor.config.ts`
   - Tạo file `splash.png` (2732x2732px) và đặt trong `android/app/src/main/res/drawable/`

### Cấu hình Permissions

File: `android/app/src/main/AndroidManifest.xml`

Thêm permissions cần thiết (thường đã có sẵn):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Kết nối với API Server

⚠️ **Quan trọng**: Mobile app cần kết nối đến API server riêng biệt. Có 2 cách:

#### Cách 1: Cấu hình trong Capacitor (Khuyến nghị cho Development)

Cập nhật `capacitor.config.ts`:
```typescript
server: {
  androidScheme: 'https',
  url: 'http://YOUR_SERVER_IP:3000',  // Thay bằng IP server của bạn
  cleartext: true  // Cho phép HTTP (chỉ dùng cho development)
}
```

⚠️ **Lưu ý**: Với production, nên dùng HTTPS và bỏ `cleartext: true`.

#### Cách 2: Sử dụng biến môi trường VITE_API_URL (Khuyến nghị cho Production)

1. Tạo file `.env.production`:
```env
VITE_API_URL=https://your-api-server.com/api/v1
```

2. Build với production mode:
```bash
NODE_ENV=production npm run build
```

3. File `services/apiClient.ts` sẽ tự động sử dụng `VITE_API_URL` nếu có.

#### Kiểm tra kết nối

Sau khi build APK, kiểm tra:
- API server đang chạy và accessible
- CORS đã được cấu hình đúng (cho phép origin của mobile app)
- Network permissions đã được thêm vào AndroidManifest.xml

## 📱 Test APK trên thiết bị

### Cách 1: Cài đặt trực tiếp
1. Copy file APK vào điện thoại
2. Bật **Install từ Unknown Sources** trong Settings
3. Mở file APK và cài đặt

### Cách 2: Debug qua USB
1. Bật **USB Debugging** trên điện thoại (Settings → Developer Options)
2. Kết nối điện thoại với máy tính
3. Trong Android Studio: **Run** → **Run 'app'**

### Cách 3: ADB Command
```bash
adb install app-debug.apk
```

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "SDK location not found"
- Kiểm tra biến môi trường `ANDROID_HOME`
- Tạo file `local.properties` trong thư mục `android/` với nội dung:
  ```
  sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
  ```

### Lỗi: "Execution failed for task ':app:mergeDebugResources'"
- Mở **File** → **Invalidate Caches / Restart** trong Android Studio
- Hoặc xóa thư mục `.gradle` trong `android/`

### Lỗi: "Cannot find module '@capacitor/...'"
- Chạy lại: `npm install`
- Chạy: `npm run cap:sync:android`

### APK không kết nối được API
- Kiểm tra CORS settings trên server
- Kiểm tra `capacitor.config.ts` có cấu hình `server.url` đúng không
- Kiểm tra firewall và network permissions

## 📦 Phân phối APK

### Upload lên Google Play Store:
1. Tạo tài khoản Developer ($25 một lần)
2. Tạo app mới trong Google Play Console
3. Upload file APK hoặc AAB (App Bundle) - khuyên dùng AAB
4. Điền thông tin app và submit

### Phân phối nội bộ:
- Upload lên server và cung cấp link download
- Sử dụng Google Play Internal Testing
- Sử dụng Firebase App Distribution

## 📚 Tài liệu tham khảo

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [React + Capacitor Best Practices](https://capacitorjs.com/docs/guides/react)

## ⚡ Scripts nhanh

Đã thêm vào `package.json`:
- `npm run build:android` - Build và sync trong một lệnh
- `npm run cap:sync:android` - Đồng bộ với Android
- `npm run cap:open:android` - Mở Android Studio

---

**Chúc bạn build APK thành công! 🎉**

