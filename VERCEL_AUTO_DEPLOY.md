# Hướng dẫn Setup Auto-Deploy trên Vercel

## ⚠️ QUAN TRỌNG: Repository là Private

Nếu repository của bạn là **PRIVATE**, Vercel cần được cấp quyền truy cập GitHub. Xem phần **"Setup cho Private Repository"** bên dưới.

## Vấn đề: Vercel không tự động deploy khi push code

Có thể do một trong các nguyên nhân sau:

## ✅ Giải pháp:

### 1. Kiểm tra Repository đã được kết nối chưa

**Bước 1:** Vào [Vercel Dashboard](https://vercel.com/dashboard)

**Bước 2:** Kiểm tra xem project của bạn có trong danh sách không:
- Nếu **CHƯA CÓ**: Cần import repository từ GitHub
- Nếu **ĐÃ CÓ**: Kiểm tra settings

### 2. Import Repository (Nếu chưa có)

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Chọn **"Import Git Repository"**
4. Chọn repository từ GitHub của bạn
5. Vercel sẽ tự động detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click **"Deploy"**

### 3. Kiểm tra Auto-Deploy Settings

**Bước 1:** Vào project trên Vercel Dashboard

**Bước 2:** Click vào **"Settings"** tab

**Bước 3:** Vào **"Git"** section, kiểm tra:

✅ **Production Branch**: Phải là branch bạn đang push (thường là `main` hoặc `master`)

✅ **Auto-Deploy**: Phải được bật (ON)

✅ **Pull Request Comments**: Có thể bật để comment trên PR

✅ **Deploy Hooks**: Kiểm tra xem có webhook nào không

### 4. Kiểm tra GitHub Integration

**Bước 1:** Vào **Settings** → **Git**

**Bước 2:** Kiểm tra **"Connected Git Repository"**:
- Phải hiển thị đúng repository của bạn
- Nếu không đúng, click **"Disconnect"** và connect lại

**Bước 3:** Kiểm tra **"Deploy Hooks"**:
- Vercel tự động tạo webhook trên GitHub
- Nếu không có, có thể GitHub integration chưa được setup đúng

### 5. Kiểm tra GitHub Webhook (Nếu cần)

**Bước 1:** Vào GitHub repository của bạn

**Bước 2:** Vào **Settings** → **Webhooks**

**Bước 3:** Kiểm tra xem có webhook từ Vercel không:
- URL: `https://api.vercel.com/v1/integrations/github/...`
- Events: `push`, `pull_request`

**Bước 4:** Nếu không có webhook:
- Vercel sẽ tự động tạo khi bạn import repository
- Nếu không có, thử disconnect và reconnect repository trên Vercel

### 6. Kiểm tra Branch được push

**Quan trọng:** Vercel chỉ auto-deploy branch được set làm **Production Branch**

**Kiểm tra:**
1. Vào Vercel Dashboard → Project → Settings → Git
2. Xem **"Production Branch"** là branch nào
3. Đảm bảo bạn đang push vào đúng branch đó

**Ví dụ:**
- Nếu Production Branch là `main` → Push vào `main` sẽ auto-deploy
- Nếu push vào `develop` → Sẽ không auto-deploy (trừ khi có Preview Deployment)

### 7. Kiểm tra Build Logs

Nếu auto-deploy không chạy, có thể build đang fail:

**Bước 1:** Vào Vercel Dashboard → Project → **"Deployments"**

**Bước 2:** Xem deployment mới nhất:
- Nếu có deployment nhưng status là **"Error"** → Xem logs để fix lỗi
- Nếu không có deployment mới → Có thể webhook không hoạt động

### 8. Manual Trigger Deploy (Test)

Để test xem Vercel có hoạt động không:

**Bước 1:** Vào Vercel Dashboard → Project

**Bước 2:** Click **"Deployments"** tab

**Bước 3:** Click **"Redeploy"** trên deployment mới nhất

Nếu manual deploy thành công nhưng auto-deploy không hoạt động → Vấn đề là ở GitHub integration

### 9. Reconnect GitHub Repository (Nếu cần)

Nếu các bước trên không giải quyết được:

**Bước 1:** Vào Vercel Dashboard → Project → Settings → Git

**Bước 2:** Click **"Disconnect"** repository

**Bước 3:** Click **"Connect Git Repository"** lại

**Bước 4:** Chọn lại repository và branch

**Bước 5:** Vercel sẽ tự động setup lại webhook

### 10. Kiểm tra Vercel CLI (Alternative)

Nếu GitHub integration không hoạt động, có thể dùng Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

Hoặc setup GitHub Actions để auto-deploy khi push.

## 🔐 Setup cho Private Repository

Nếu repository của bạn là **PRIVATE**, làm theo các bước sau:

### Bước 1: Cấp quyền GitHub cho Vercel

**Cách 1: Khi import repository lần đầu**
1. Vào Vercel Dashboard → Add New Project
2. Chọn "Import Git Repository"
3. Nếu repository là private, Vercel sẽ yêu cầu bạn **authorize GitHub**
4. Click **"Authorize Vercel"** hoặc **"Grant Access"**
5. Chọn quyền truy cập:
   - **Recommended**: Chọn **"All repositories"** hoặc **"Only select repositories"**
   - Nếu chọn "Only select repositories", chọn repository của bạn
6. Click **"Authorize"** hoặc **"Install"**

**Cách 2: Nếu đã import nhưng chưa có quyền**
1. Vào Vercel Dashboard → Project → Settings → Git
2. Nếu thấy warning về permissions, click **"Reconnect"** hoặc **"Update Permissions"**
3. Vercel sẽ redirect đến GitHub để authorize
4. Chọn quyền truy cập và authorize

### Bước 2: Kiểm tra GitHub App Installation

**Trên GitHub:**
1. Vào GitHub repository của bạn
2. Vào **Settings** → **Integrations** → **Installed GitHub Apps**
3. Tìm **"Vercel"** trong danh sách
4. Kiểm tra:
   - ✅ Vercel đã được install
   - ✅ Repository của bạn được chọn trong "Repository access"
   - ✅ Permissions đã được grant

**Nếu không thấy Vercel:**
- Quay lại Vercel và reconnect repository
- Hoặc install Vercel GitHub App manually: https://github.com/apps/vercel

### Bước 3: Kiểm tra Webhook cho Private Repository

**Trên GitHub:**
1. Vào repository → **Settings** → **Webhooks**
2. Tìm webhook từ Vercel (URL: `https://api.vercel.com/v1/integrations/github/...`)
3. Kiểm tra:
   - ✅ Status: Active (green)
   - ✅ Events: `push`, `pull_request`
   - ✅ SSL verification: Enabled

**Nếu không có webhook:**
- Vercel sẽ tự động tạo khi bạn authorize GitHub
- Nếu không có, thử reconnect repository trên Vercel

### Bước 4: Test với Private Repository

Sau khi setup xong:

```bash
# Push code lên private repository
git add .
git commit -m "Test auto-deploy"
git push origin main
```

**Kiểm tra trên Vercel:**
1. Vào Vercel Dashboard → Project → **Deployments**
2. Sau vài giây, bạn sẽ thấy deployment mới được tạo tự động
3. Nếu không thấy, kiểm tra:
   - GitHub webhook có hoạt động không (Settings → Webhooks → Recent Deliveries)
   - Vercel logs có lỗi gì không

### Troubleshooting cho Private Repository

**Lỗi: "Repository not found" hoặc "Access denied"**
- **Giải pháp**: Reconnect repository và authorize GitHub lại

**Lỗi: "Webhook delivery failed"**
- **Giải pháp**: 
  1. Kiểm tra GitHub App permissions
  2. Xóa webhook cũ và reconnect repository
  3. Đảm bảo repository không bị archive

**Lỗi: "Build failed" nhưng code đúng**
- **Giải pháp**: 
  1. Kiểm tra Environment Variables đã được set chưa
  2. Kiểm tra Build Command và Output Directory
  3. Xem build logs để tìm lỗi cụ thể

## ✅ Checklist để Auto-Deploy hoạt động:

**Cho Private Repository:**
- [ ] Vercel đã được authorize trên GitHub (GitHub App installed)
- [ ] Repository được chọn trong GitHub App permissions
- [ ] GitHub webhook đã được tạo và active
- [ ] Webhook có quyền truy cập private repository

**Cho tất cả Repository:**
- [ ] Repository đã được import vào Vercel
- [ ] Production Branch được set đúng (main/master)
- [ ] Auto-Deploy được bật trong Settings → Git
- [ ] Đang push vào đúng branch (Production Branch)
- [ ] Build command và output directory đúng
- [ ] Environment variables đã được set
- [ ] Không có lỗi trong build logs

## 🔍 Debug Commands:

```bash
# Kiểm tra git remote
git remote -v

# Kiểm tra branch hiện tại
git branch

# Push và xem logs
git push origin main
```

## 📝 Lưu ý:

1. **Preview Deployments**: Vercel tự động tạo preview cho mỗi PR, nhưng chỉ auto-deploy production branch khi merge
2. **Build Time**: Nếu build quá lâu (>60s), có thể cần upgrade plan
3. **Rate Limits**: Free plan có giới hạn số lần deploy/ngày

## 🆘 Nếu vẫn không hoạt động:

1. Kiểm tra Vercel Status: https://www.vercel-status.com/
2. Xem Vercel Logs: Dashboard → Project → Deployments → Click vào deployment → View Logs
3. Contact Vercel Support: support@vercel.com

