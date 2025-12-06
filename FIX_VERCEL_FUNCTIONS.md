# 🔧 HƯỚNG DẪN SỬA LỖI "No more than 12 Serverless Functions"

## ⚠️ VẤN ĐỀ:
Vercel đang detect tất cả file `.ts` trong `api/` folder như là serverless functions riêng biệt, vượt quá giới hạn 12 functions của Hobby plan.

## ✅ GIẢI PHÁP:
Đổi tên các folder trong `api/` thành bắt đầu bằng `_`. Vercel sẽ tự động ignore các folder bắt đầu bằng `_`, nhưng vẫn có thể import được.

## 📋 CÁC BƯỚC:

### Bước 1: Đóng IDE
**QUAN TRỌNG:** Đóng tất cả file đang mở trong IDE (VS Code, Cursor, etc.) vì IDE có thể lock các folder.

### Bước 2: Đổi tên các folder
Trong `api/` folder, đổi tên:
- `config` → `_config`
- `controllers` → `_controllers`
- `models` → `_models`
- `routes` → `_routes`

**Cách đổi tên:**
1. Mở File Explorer
2. Điều hướng đến `api/` folder
3. Click chuột phải vào từng folder → Rename
4. Thêm `_` ở đầu tên folder

### Bước 3: Chạy script để cập nhật imports
Sau khi đổi tên xong, chạy script PowerShell:

```powershell
cd "C:\Users\Minimart\Desktop\python\Furama Projects\Furama Resort Digital Concierge"
.\fix-vercel-functions.ps1
```

Script sẽ tự động cập nhật tất cả imports trong các file `.ts`.

### Bước 4: Commit và push
```bash
git add .
git commit -m "Fix Vercel function limit by renaming api folders"
git push
```

## 🎯 KẾT QUẢ:
Sau khi hoàn thành, Vercel sẽ chỉ detect `api/index.ts` như là serverless function duy nhất, và lỗi sẽ được giải quyết.

## 📝 LƯU Ý:
- Nếu script không chạy được, có thể do IDE vẫn đang mở. Hãy đóng IDE hoàn toàn và thử lại.
- Nếu vẫn không được, hãy đổi tên folder thủ công và chạy lệnh cập nhật imports trong `RENAME_FOLDERS.md`.
