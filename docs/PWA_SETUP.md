# Progressive Web App (PWA) Setup - Furama Resort Digital Concierge

## ✅ Đã hoàn thành

### 1. Service Worker (`public/sw.js`)
- ✅ **Cache Strategy**: 
  - **Cache First** cho static assets (images, fonts, CSS, JS)
  - **Network First** cho API calls và dynamic content
  - **Network First với Fallback** cho HTML pages
- ✅ **Offline Support**: App có thể hoạt động offline với cached content
- ✅ **Background Sync**: Sẵn sàng cho offline actions
- ✅ **Push Notifications**: Hỗ trợ push notifications

### 2. Web App Manifest (`public/manifest.json`)
- ✅ **Metadata đầy đủ**: name, short_name, description, theme colors
- ✅ **Icons**: Hỗ trợ 192x192 và 512x512 (cần tạo files)
- ✅ **Shortcuts**: Quick access đến Buggy, Concierge, Active Orders
- ✅ **Display mode**: Standalone (chạy như native app)
- ✅ **Orientation**: Portrait mode

### 3. PWA Install Prompt (`components/PWAInstallPrompt.tsx`)
- ✅ **Custom Install UI**: Prompt đẹp với gradient và animations
- ✅ **iOS Support**: Hướng dẫn install cho iOS devices
- ✅ **Dismiss Logic**: Nhớ user đã dismiss và không hiện lại trong 7 ngày
- ✅ **Multi-language**: Hỗ trợ English và Vietnamese
- ✅ **Auto-detect**: Tự động phát hiện nếu app đã được install

### 4. Apple iOS Support (`index.html`)
- ✅ **Apple Touch Icons**: Meta tags cho iOS
- ✅ **Status Bar Style**: Black translucent
- ✅ **App Title**: "Furama Concierge"
- ✅ **Microsoft Tiles**: Support cho Windows devices

### 5. Service Worker Registration (`index.html`)
- ✅ **Auto-register**: Tự động đăng ký service worker khi app load
- ✅ **Error Handling**: Log errors nếu registration fails

## ⚠️ Cần hoàn thành

### Icon Files
App cần 2 icon files trong thư mục `public/`:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

**Cách tạo:**
1. Sử dụng `public/logo.png` hiện có
2. Resize thành 192x192 và 512x512
3. Đặt vào thư mục `public/`

Xem hướng dẫn chi tiết: `scripts/create-pwa-icons.md`

## 🧪 Testing

### Test PWA Installability
1. **Chrome/Edge Desktop**:
   - Mở DevTools (F12)
   - Tab "Application" → "Manifest"
   - Kiểm tra manifest được load đúng
   - Tab "Service Workers" → Kiểm tra SW đã register
   - Icon install sẽ xuất hiện ở address bar

2. **Mobile Chrome/Edge**:
   - Mở app trên mobile browser
   - Menu → "Add to Home Screen" hoặc "Install App"
   - Kiểm tra icon và splash screen

3. **iOS Safari**:
   - Mở app trên Safari
   - Tap Share button → "Add to Home Screen"
   - Kiểm tra icon và app title

### Test Offline Functionality
1. Mở app và navigate qua các pages
2. Mở DevTools → Network tab → Check "Offline"
3. Refresh page - app vẫn hoạt động với cached content
4. Test API calls - sẽ trả về cached data hoặc error message

## 📱 Features

### Install Prompt
- Tự động hiện sau 2-3 giây khi user visit lần đầu
- Có thể dismiss và sẽ không hiện lại trong 7 ngày
- Hỗ trợ cả Android và iOS

### Offline Support
- Static assets được cache ngay khi install
- API calls sử dụng Network First strategy
- HTML pages fallback về index.html nếu offline

### Performance
- Service Worker cache giúp load nhanh hơn
- Assets được serve từ cache khi có thể
- Background sync sẵn sàng cho future features

## 🔧 Configuration

### Service Worker Version
Để update service worker, thay đổi `CACHE_NAME` trong `public/sw.js`:
```javascript
const CACHE_NAME = 'furama-concierge-v2.1'; // Increment version
```

### Manifest Updates
Chỉnh sửa `public/manifest.json` để update:
- App name, description
- Theme colors
- Shortcuts
- Icons

## 📚 Resources
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)

## 🎯 Next Steps
1. ✅ Tạo icon files (192x192, 512x512)
2. ✅ Test trên real devices
3. ✅ Monitor service worker performance
4. ✅ Add background sync cho offline actions (optional)
5. ✅ Implement push notifications (optional)
