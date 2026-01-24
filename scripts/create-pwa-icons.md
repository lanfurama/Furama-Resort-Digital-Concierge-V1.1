# Hướng dẫn tạo PWA Icons

## Yêu cầu
App cần 2 icon files cho PWA:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

## Cách 1: Sử dụng logo.png hiện có (Khuyến nghị)

1. Mở file `public/logo.png` trong image editor (Photoshop, GIMP, hoặc online tool như https://www.iloveimg.com/resize-image)
2. Resize logo thành 192x192 pixels, save as `public/icon-192x192.png`
3. Resize logo thành 512x512 pixels, save as `public/icon-512x512.png`
4. Đảm bảo background là transparent hoặc màu emerald (#065f46)

## Cách 2: Sử dụng online tool

1. Truy cập: https://realfavicongenerator.net/ hoặc https://www.pwabuilder.com/imageGenerator
2. Upload logo.png
3. Download các icon sizes cần thiết
4. Đặt vào thư mục `public/`

## Cách 3: Sử dụng Node.js script (nếu có canvas package)

```bash
npm install canvas
node generate-icons.js
```

## Lưu ý
- Icons nên có background màu emerald (#065f46) hoặc transparent
- Đảm bảo logo rõ ràng ở cả 2 kích thước
- Test trên mobile để đảm bảo icon hiển thị đẹp
