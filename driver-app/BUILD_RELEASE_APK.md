# 🔐 Build & Sign Release APK - Furama Driver App

Hướng dẫn tạo keystore và build bản Release APK đã ký để phân phối.

## 📋 Yêu cầu

- ✅ Java JDK 17+ đã cài đặt
- ✅ Android Studio đã cài đặt
- ✅ Android platform đã được thêm vào project (`npm run cap:add:android`)

## 🔑 Bước 1: Tạo Keystore (Chỉ làm 1 lần)

### Cách 1: Sử dụng Script Tự Động (Khuyến nghị)

```powershell
.\generate-keystore.ps1
```

Script sẽ hỏi các thông tin:
- **Keystore Password**: Mật khẩu bảo vệ keystore (tối thiểu 6 ký tự)
- **Key Password**: Mật khẩu cho key (có thể giống keystore password)
- **Certificate Info**: Thông tin tổ chức (có thể dùng mặc định)

**Kết quả:**
- File `furama-driver-release.keystore` được tạo
- File `keystore-info.txt` lưu thông tin (nếu chọn lưu)

### Cách 2: Tạo Thủ Công

```bash
keytool -genkeypair -v -keystore furama-driver-release.keystore -alias furama-driver -keyalg RSA -keysize 2048 -validity 10000
```

Nhập thông tin khi được hỏi.

## ⚠️ BẢO MẬT KEYSTORE

**CỰC KỲ QUAN TRỌNG:**
- 🔒 Lưu file `.keystore` và mật khẩu an toàn
- 🔒 **KHÔNG** commit keystore vào Git
- 🔒 Nếu mất keystore, **KHÔNG THỂ** update app trên Play Store
- 🔒 Backup keystore ở nhiều nơi an toàn

Thêm vào `.gitignore`:
```
*.keystore
keystore-info.txt
```

## 🏗️ Bước 2: Cấu Hình Signing trong Android

### Option A: Cấu hình trong `build.gradle` (Khuyến nghị)

1. Tạo file `android/keystore.properties`:

```properties
storeFile=../furama-driver-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=furama-driver
keyPassword=YOUR_KEY_PASSWORD
```

⚠️ **Lưu ý:** Thay `YOUR_KEYSTORE_PASSWORD` và `YOUR_KEY_PASSWORD` bằng mật khẩu thực tế.

2. Thêm vào `.gitignore`:
```
android/keystore.properties
```

3. Sửa file `android/app/build.gradle`:

Thêm **TRƯỚC** block `android {`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Trong block `android {`, thêm `signingConfigs`:
```gradle
android {
    ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Option B: Cấu hình trong Android Studio (Thủ công)

1. Mở Android Studio
2. **File** → **Project Structure** → **Modules** → **app**
3. Tab **Signing Configs**:
   - Click **+** → Tạo config mới tên `release`
   - **Store File**: Chọn file `furama-driver-release.keystore`
   - **Store Password**: Nhập keystore password
   - **Key Alias**: `furama-driver`
   - **Key Password**: Nhập key password
4. Tab **Build Types** → **release**:
   - **Signing Config**: Chọn `release`

## 📦 Bước 3: Build Release APK

### Cách 1: Sử dụng Android Studio (Dễ nhất)

1. Build web app trước:
```bash
npm run build
npm run cap:sync:android
```

2. Mở Android Studio:
```bash
npm run cap:open:android
```

3. Đợi Gradle sync xong

4. Build APK:
   - **Build** → **Generate Signed Bundle / APK**
   - Chọn **APK** → **Next**
   - Chọn keystore file và nhập passwords
   - Chọn **release** build variant
   - Click **Finish**

5. APK sẽ ở: `android/app/build/outputs/apk/release/app-release.apk`

### Cách 2: Command Line (Nhanh hơn)

```bash
# 1. Build web app
npm run build

# 2. Sync với Android
npm run cap:sync:android

# 3. Build release APK
cd android
./gradlew assembleRelease

# APK ở: android/app/build/outputs/apk/release/app-release.apk
```

### Cách 3: Script Tự Động (Tạo sau)

Tạo file `build-release.ps1`:
```powershell
Write-Host "Building Furama Driver Release APK..." -ForegroundColor Cyan

# Build web
npm run build

# Sync Android
npm run cap:sync:android

# Build APK
cd android
./gradlew assembleRelease

Write-Host "✅ APK built successfully!" -ForegroundColor Green
Write-Host "Location: android/app/build/outputs/apk/release/app-release.apk"
```

## ✅ Bước 4: Verify APK

Kiểm tra APK đã được ký:

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

Kết quả phải có: `jar verified.`

## 📱 Bước 5: Test APK

### Cài đặt trên thiết bị:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

Hoặc copy file APK vào điện thoại và cài thủ công.

### Kiểm tra:
- ✅ App mở được
- ✅ Kết nối API thành công
- ✅ Tất cả chức năng hoạt động
- ✅ GPS tracking hoạt động
- ✅ Notifications hoạt động

## 🚀 Bước 6: Phân Phối

### Upload lên Google Play Store:

1. Tạo tài khoản Google Play Developer ($25)
2. Tạo app mới trong Play Console
3. Upload APK (hoặc AAB - khuyến nghị)
4. Điền thông tin app
5. Submit để review

### Phân phối nội bộ:

- Upload lên server nội bộ
- Gửi qua email/chat
- Sử dụng Firebase App Distribution

## 🔄 Update App

Khi cần update:

1. Tăng version trong `package.json`:
```json
{
  "version": "1.0.1"
}
```

2. Update version code trong `android/app/build.gradle`:
```gradle
versionCode 2
versionName "1.0.1"
```

3. Build lại APK với cùng keystore

## 🐛 Troubleshooting

### Lỗi: "Failed to read key from keystore"
- Kiểm tra password đúng chưa
- Kiểm tra alias đúng chưa
- Kiểm tra đường dẫn keystore file

### Lỗi: "Keystore was tampered with"
- Password sai
- File keystore bị corrupt

### APK không cài được
- Uninstall version cũ trước
- Kiểm tra signing config
- Kiểm tra version code phải lớn hơn version cũ

## 📚 Tham Khảo

- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Google Play Console](https://play.google.com/console)

---

**🎉 Chúc bạn build APK thành công!**
