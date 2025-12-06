# Hướng dẫn đổi tên các folder trong api/

Để tránh lỗi "No more than 12 Serverless Functions" trên Vercel Hobby plan, bạn cần đổi tên các folder trong `api/` thành bắt đầu bằng `_`.

## Các bước:

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

4. **Sau khi đổi tên xong:**
   - Tất cả imports đã được tự động cập nhật
   - Chỉ cần commit và push code
   - Vercel sẽ chỉ detect `api/index.ts` như là serverless function duy nhất

## Lý do:

Vercel tự động detect tất cả file `.ts` trong `api/` folder như là serverless functions. Các folder bắt đầu bằng `_` sẽ được Vercel tự động ignore, nhưng vẫn có thể import được.
