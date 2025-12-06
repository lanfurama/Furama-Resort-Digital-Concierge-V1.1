# Hướng dẫn Deploy lên Vercel

## ✅ Vercel hoàn toàn ổn và không cần lo về port!

Vercel sẽ tự động:
- **Build frontend** với `npm run build` → tạo folder `dist/`
- **Deploy API routes** từ `api/` folder như serverless functions
- **Tự động handle routing** và ports (không cần chỉ định port 5173 hay bất kỳ port nào)

## Các bước deploy:

### 1. Push code lên GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### 2. Kết nối với Vercel
1. Vào [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import repository từ GitHub (chọn repository của bạn)
4. **Nếu repository là PRIVATE:**
   - Vercel sẽ yêu cầu bạn **authorize GitHub**
   - Click **"Authorize Vercel"** hoặc **"Grant Access"**
   - Chọn quyền truy cập: **"All repositories"** hoặc **"Only select repositories"**
   - Nếu chọn "Only select repositories", chọn repository của bạn
   - Click **"Authorize"** hoặc **"Install"**
5. Vercel sẽ tự động detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **QUAN TRỌNG:** Đảm bảo **"Production Branch"** được set đúng (thường là `main` hoặc `master`)
7. **QUAN TRỌNG:** Đảm bảo **"Auto-Deploy"** được bật (ON) trong Settings → Git

### 3. Thêm Environment Variables
Trong Vercel Dashboard → Settings → Environment Variables, thêm các biến sau:

**Database Configuration:**
```
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

**Gemini API Key (cho frontend - QUAN TRỌNG: phải có prefix VITE_):**
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Optional:**
```
PORT=3000
NODE_ENV=production
```

**Lưu ý:** 
- File `env-template.txt` trong project chứa template đầy đủ các environment variables
- Bạn có thể copy nội dung từ `env-template.txt` và paste vào Vercel Environment Variables
- Đảm bảo `VITE_GEMINI_API_KEY` được set đúng (có prefix `VITE_`) để Vite expose vào client-side code

### 4. Deploy!
Click "Deploy" và Vercel sẽ tự động:
- Install dependencies (`npm install`)
- Build frontend (`npm run build`)
- Deploy API routes từ `api/index.js`
- Serve static files từ `dist/`

## Cấu trúc routing trên Vercel:

- `/api/*` → Serverless function (`api/index.js`)
- `/*` → Static files từ `dist/` (React app)

## Lưu ý:

1. **Port**: Vercel tự động handle, không cần config
2. **API Routes**: Tất cả requests đến `/api/*` sẽ được route đến `api/index.js`
3. **Frontend**: Tất cả routes khác sẽ serve file `index.html` từ `dist/`
4. **Database**: Đảm bảo PostgreSQL server cho phép kết nối từ Vercel IPs

## Test sau khi deploy:

- Frontend: `https://your-app.vercel.app`
- API Health: `https://your-app.vercel.app/api/health`
- API Users: `https://your-app.vercel.app/api/v1/users`

## ⚠️ Auto-Deploy không hoạt động?

Nếu Vercel không tự động deploy khi bạn push code, xem file **`VERCEL_AUTO_DEPLOY.md`** để troubleshoot.

**Các nguyên nhân thường gặp:**
1. Repository chưa được kết nối với Vercel
2. Auto-Deploy chưa được bật trong Settings → Git
3. Đang push vào branch sai (không phải Production Branch)
4. GitHub webhook chưa được setup đúng
5. Build đang fail (kiểm tra logs trong Deployments tab)

