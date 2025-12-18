# Furama Driver App

Ứng dụng riêng cho tài xế của Furama Resort. App này được tách ra từ app chính để có thể build APK độc lập.

## ✨ Tính năng

- ✅ Đã tách riêng hoàn toàn từ main app
- ✅ App ID riêng: `com.furama.resort.driver`
- ✅ Chỉ dành cho role DRIVER
- ✅ Có thể build APK độc lập
- ✅ Package.json riêng với dependencies riêng

## 🚀 Quick Start

### Cài đặt

```bash
cd driver-app
npm install
```

### Chạy Development

```bash
npm run dev
```

### Build cho Android

```bash
# Build web app
npm run build

# Sync với Capacitor
npm run cap:sync:android

# Mở Android Studio
npm run cap:open:android
```

Sau đó build APK từ Android Studio.

📖 **Xem hướng dẫn chi tiết:** [BUILD_APK_GUIDE.md](./BUILD_APK_GUIDE.md)

## 📁 Cấu trúc

```
driver-app/
├── App.tsx                    # Component chính, chỉ xử lý login cho driver
├── components/
│   ├── DriverPortal.tsx       # Giao diện chính cho driver
│   ├── ServiceChat.tsx       # Chat với khách
│   └── NotificationBell.tsx   # Thông báo
├── services/
│   ├── apiClient.ts          # Client để gọi API
│   ├── authService.ts        # Service xác thực
│   ├── dataService.ts        # Service xử lý data
│   └── geminiService.ts      # Service AI
├── contexts/
│   └── LanguageContext.tsx   # Language context
├── capacitor.config.ts       # Capacitor config (App ID riêng)
├── package.json              # Dependencies riêng
└── vite.config.ts            # Vite config
```

## ⚙️ Cấu hình

### App ID
- **Driver App**: `com.furama.resort.driver`
- **Main App**: `com.furama.resort.concierge`

### API URL
Cấu hình trong `.env` file:
```env
VITE_API_URL=https://your-api-server.com/api/v1
```

Hoặc trong `capacitor.config.ts` (cho development):
```typescript
server: {
  url: 'http://YOUR_SERVER_IP:3000',
  cleartext: true
}
```

## 🔐 Bảo mật

- App chỉ cho phép login với role `DRIVER`
- Nếu login với role khác, sẽ hiển thị lỗi: "This app is for drivers only"
- Tự động clear localStorage nếu user không phải driver

## 📱 Build APK

Xem hướng dẫn chi tiết trong [BUILD_APK_GUIDE.md](./BUILD_APK_GUIDE.md)

### Scripts nhanh:
```bash
npm run build:android        # Build và sync
npm run cap:sync:android      # Sync với Android
npm run cap:open:android      # Mở Android Studio
```

## ⚠️ Lưu ý

- App này chỉ dành cho role **DRIVER**
- Cần API server chạy để app hoạt động
- Cấu hình API URL trong `.env` file hoặc `capacitor.config.ts`
- Build APK độc lập, không ảnh hưởng đến main app
- Có thể deploy riêng lên Google Play Store với package name khác

## 🔄 Khác biệt với Main App

| Tính năng | Main App | Driver App |
|-----------|----------|------------|
| App ID | `com.furama.resort.concierge` | `com.furama.resort.driver` |
| Roles | Guest, Admin, Staff, Reception, Supervisor, Driver | Chỉ Driver |
| Login | Role selection → Login | Trực tiếp login |
| Features | Đầy đủ tính năng | Chỉ Driver Portal |
| Build | Build riêng | Build riêng |

