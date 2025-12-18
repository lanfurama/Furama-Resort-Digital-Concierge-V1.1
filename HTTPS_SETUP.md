# HTTPS Support Setup Guide

Hướng dẫn thiết lập và sử dụng HTTPS cho Furama Resort Digital Concierge.

## Tổng quan

Hệ thống đã được tích hợp hỗ trợ HTTPS để bảo mật kết nối giữa client và server. HTTPS có thể được kích hoạt cho cả môi trường development và production.

## Tính năng

- ✅ Hỗ trợ HTTPS với SSL/TLS certificates
- ✅ Tự động generate self-signed certificates cho development
- ✅ HTTP to HTTPS redirect (tùy chọn)
- ✅ Cấu hình linh hoạt qua environment variables
- ✅ Hỗ trợ custom certificate paths

## Cài đặt

### 1. Generate SSL Certificates (Development)

Để tạo self-signed certificates cho development:

```bash
npm run generate-ssl
```

Lệnh này sẽ tạo:
- `certs/server.key` - Private key
- `certs/server.crt` - Certificate

**Lưu ý**: 
- Script sử dụng package `selfsigned` - không cần cài đặt OpenSSL
- Self-signed certificates chỉ dùng cho development
- Trình duyệt sẽ hiển thị cảnh báo bảo mật, bạn cần click "Advanced" → "Proceed to localhost" để tiếp tục

### 2. Cấu hình Environment Variables

Thêm các biến sau vào file `.env`:

```env
# Bật HTTPS
ENABLE_HTTPS=true

# Port cho HTTPS (mặc định: 3443)
HTTPS_PORT=3443

# Redirect HTTP sang HTTPS (tùy chọn)
HTTPS_REDIRECT=true

# Custom certificate paths (tùy chọn, mặc định: certs/server.key và certs/server.crt)
# SSL_KEY_PATH=certs/server.key
# SSL_CERT_PATH=certs/server.crt
```

### 3. Chạy Server với HTTPS

#### Development mode:
```bash
npm run dev:https
```

#### Windows:
```bash
npm run dev:https:win
```

Server sẽ chạy tại: `https://localhost:3443`

## Production Setup

### Sử dụng Let's Encrypt (Khuyến nghị)

1. Cài đặt Certbot:
```bash
# Ubuntu/Debian
sudo apt-get install certbot

# macOS
brew install certbot
```

2. Tạo certificates:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Cấu hình trong `.env`:
```env
ENABLE_HTTPS=true
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
HTTPS_PORT=443
HTTPS_REDIRECT=true
```

### Sử dụng Custom Certificates

1. Đặt certificates vào thư mục `certs/` hoặc đường dẫn tùy chỉnh
2. Cấu hình paths trong `.env`:
```env
ENABLE_HTTPS=true
SSL_KEY_PATH=/path/to/your/private.key
SSL_CERT_PATH=/path/to/your/certificate.crt
```

## Cấu trúc Files

```
.
├── server.js                    # Main server file với HTTPS support
├── scripts/
│   └── generate-ssl-certs.js    # Script generate self-signed certificates
├── certs/                       # Thư mục chứa SSL certificates
│   ├── .gitkeep
│   ├── server.key              # Private key (không commit vào git)
│   └── server.crt              # Certificate (không commit vào git)
└── .env                         # Environment variables
```

## Security Best Practices

1. **Development**: Sử dụng self-signed certificates được generate tự động
2. **Production**: Luôn sử dụng certificates từ trusted CA (Let's Encrypt, etc.)
3. **Never commit**: Không bao giờ commit private keys hoặc certificates vào git
4. **HTTPS Redirect**: Bật `HTTPS_REDIRECT=true` trong production để force HTTPS
5. **Port Configuration**: Sử dụng port 443 cho production HTTPS

## Troubleshooting

### Lỗi: "certificates not found"
- Chạy `npm run generate-ssl` để tạo certificates
- Kiểm tra paths trong `.env` có đúng không

### Lỗi: "OpenSSL not found"
- Script hiện tại sử dụng package `selfsigned` - không cần OpenSSL
- Nếu gặp lỗi, chạy `npm install` để đảm bảo dependencies đã được cài đặt

### Browser warning về self-signed certificate
- Đây là hành vi bình thường với self-signed certificates
- Click "Advanced" → "Proceed to localhost" để tiếp tục
- Chỉ xảy ra trong development, production dùng trusted certificates

### Port đã được sử dụng
- Thay đổi `HTTPS_PORT` trong `.env`
- Hoặc dừng process đang sử dụng port đó

## API Endpoints

Sau khi bật HTTPS, tất cả endpoints sẽ chạy trên HTTPS:

- API Base: `https://localhost:3443/api/v1`
- Health Check: `https://localhost:3443/health`
- Frontend: `https://localhost:3443`

## Tắt HTTPS

Để tắt HTTPS và quay lại HTTP:

1. Đặt `ENABLE_HTTPS=false` trong `.env` (hoặc xóa dòng này)
2. Chạy server bình thường: `npm run dev`

Server sẽ chạy tại: `http://localhost:3000`

## Notes

- HTTPS chỉ hoạt động khi không chạy trên Vercel (Vercel tự động xử lý HTTPS)
- Self-signed certificates chỉ dùng cho development
- Production nên sử dụng Let's Encrypt hoặc certificates từ trusted CA

