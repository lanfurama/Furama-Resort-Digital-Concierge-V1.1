# Hướng dẫn đổi tên các folder trong api/

Để tránh lỗi "No more than 12 Serverless Functions" trên Vercel Hobby plan, bạn cần đổi tên các folder trong `api/` thành bắt đầu bằng `_`.

## Cách 1: Chạy script tự động (KHUYẾN NGHỊ)

1. **Đóng tất cả các file đang mở trong IDE** (VS Code, Cursor, etc.)
2. **Chạy file `rename-api-folders.bat`** (double-click hoặc chạy từ terminal)
3. Script sẽ tự động:
   - Đổi tên các folder: `config` → `_config`, `controllers` → `_controllers`, `models` → `_models`, `routes` → `_routes`
   - Cập nhật tất cả imports trong các file `.ts`

## Cách 2: Đổi tên thủ công

1. **Đóng tất cả các file đang mở trong IDE** (VS Code, Cursor, etc.)

2. **Đổi tên các folder sau trong `api/` folder:**
   - `config` → `_config`
   - `controllers` → `_controllers`
   - `models` → `_models`
   - `routes` → `_routes`

3. **Cách đổi tên:**
   - Mở File Explorer
   - Điều hướng đến `api/` folder
   - Click chuột phải vào từng folder → Rename
   - Thêm `_` ở đầu tên folder

4. **Sau khi đổi tên xong, chạy lệnh này để cập nhật imports:**
   ```powershell
   powershell -Command "$files = Get-ChildItem -Path api -Recurse -Filter *.ts; foreach ($file in $files) { $content = Get-Content $file.FullName -Raw; $original = $content; $content = $content -replace \"from ['\\\"]\\.\\./(config)/\", \"from '../_`$1/'; $content = $content -replace \"from ['\\\"]\\.\\./(controllers)/\", \"from '../_`$1/'; $content = $content -replace \"from ['\\\"]\\.\\./(models)/\", \"from '../_`$1/'; $content = $content -replace \"from ['\\\"]\\.\\./(routes)/\", \"from '../_`$1/'; if ($content -ne $original) { Set-Content -Path $file.FullName -Value $content -NoNewline } }"
   ```

## Lý do:

Vercel tự động detect tất cả file `.ts` trong `api/` folder như là serverless functions. Các folder bắt đầu bằng `_` sẽ được Vercel tự động ignore, nhưng vẫn có thể import được.

Sau khi đổi tên và cập nhật imports, Vercel sẽ chỉ detect `api/index.ts` như là serverless function duy nhất.
