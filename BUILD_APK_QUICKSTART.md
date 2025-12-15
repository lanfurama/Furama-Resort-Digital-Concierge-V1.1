# 🚀 Hướng dẫn nhanh Build APK

## Bước 1: Cài đặt Dependencies (Chỉ chạy lần đầu)

```bash
npm install
```

## Bước 2: Setup Android (Tự động)

Chạy script tự động:
```powershell
.\setup-android.ps1
```

Hoặc làm thủ công:
```bash
# 1. File capacitor.config.ts đã có sẵn, bỏ qua bước init

# 2. Thêm Android platform (chỉ lần đầu)
npm run cap:add:android

# 3. Build và sync
npm run build:android
```

## Bước 3: Mở Android Studio

```bash
npm run cap:open:android
```

## Bước 4: Build APK trong Android Studio

1. Đợi Gradle sync xong
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK sẽ ở: `android/app/build/outputs/apk/debug/app-debug.apk`

---

📖 **Xem hướng dẫn chi tiết:** `BUILD_APK_GUIDE.md`

