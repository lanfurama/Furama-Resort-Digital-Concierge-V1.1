# Furama Driver App

Ứng dụng riêng cho tài xế của Furama Resort. App này được tách ra từ app chính để có thể build APK độc lập.

## Cài đặt

```bash
cd driver-app
npm install
```

## Chạy Development

```bash
npm run dev
```

## Build cho Android

```bash
# Build web app
npm run build

# Sync với Capacitor
npm run cap:sync:android

# Mở Android Studio
npm run cap:open:android
```

Sau đó build APK từ Android Studio.

## Cấu trúc

- `App.tsx` - Component chính, chỉ xử lý login cho driver
- `components/DriverPortal.tsx` - Giao diện chính cho driver
- `components/ServiceChat.tsx` - Chat với khách
- `components/NotificationBell.tsx` - Thông báo
- `services/` - Các service để gọi API
- `contexts/` - Language context

## Lưu ý

- App này chỉ dành cho role DRIVER
- Cần API server chạy để app hoạt động
- Cấu hình API URL trong `.env` file (VITE_API_URL)

