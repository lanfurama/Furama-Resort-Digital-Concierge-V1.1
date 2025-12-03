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
2. Import repository từ GitHub
3. Vercel sẽ tự động detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3. Thêm Environment Variables
Trong Vercel Dashboard → Settings → Environment Variables, thêm:

```
DB_HOST=27.71.229.4
DB_PORT=6243
DB_NAME=furama_resort_digital_concierge
DB_USER=postgres
DB_PASSWORD=Satthuskt321@
NODE_ENV=production
```

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
- API Users: `https://your-app.vercel.app/api/api/v1/users`

**Lưu ý**: Với cấu hình hiện tại, API routes sẽ có path `/api/api/v1/...` vì Vercel route `/api/*` đến `api/index.js` và trong đó lại có `/api/v1`. 

Nếu muốn API path là `/api/v1/...` trực tiếp, cần điều chỉnh routing trong `api/index.js`.

