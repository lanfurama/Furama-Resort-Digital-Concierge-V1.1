import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generate } from 'selfsigned';

const certsDir = join(process.cwd(), 'certs');

// Tạo thư mục certs nếu chưa có
if (!existsSync(certsDir)) {
  mkdirSync(certsDir, { recursive: true });
  console.log('✅ Created certs directory');
}

const keyPath = join(certsDir, 'server.key');
const certPath = join(certsDir, 'server.crt');

// Kiểm tra xem certificates đã tồn tại chưa
if (existsSync(keyPath) && existsSync(certPath)) {
  console.log('⚠️  SSL certificates already exist. Skipping generation.');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('   Delete these files if you want to regenerate.\n');
  process.exit(0);
}

console.log('🔐 Generating self-signed SSL certificates for development...');
console.log('   This may take a few moments...\n');

(async () => {
  try {
    // Tạo self-signed certificate với thông tin của Furama Resort
    const attrs = [
      { name: 'C', value: 'VN' },
      { name: 'ST', value: 'Da Nang' },
      { name: 'L', value: 'Da Nang' },
      { name: 'O', value: 'Furama Resort' },
      { name: 'OU', value: 'IT Department' },
      { name: 'CN', value: 'localhost' }
    ];

    const pems = await generate(attrs, {
      keySize: 4096,
      days: 365,
      algorithm: 'sha256'
    });

    // Lưu private key
    writeFileSync(keyPath, pems.private, 'utf8');
    
    // Lưu certificate
    writeFileSync(certPath, pems.cert, 'utf8');
    
    console.log('\n✅ SSL certificates generated successfully!');
    console.log(`   Private Key: ${keyPath}`);
    console.log(`   Certificate: ${certPath}`);
    console.log('\n⚠️  Note: These are self-signed certificates for development only.');
    console.log('   Browser will show security warning - click "Advanced" → "Proceed to localhost"');
    console.log('   For production, use certificates from a trusted CA (e.g., Let\'s Encrypt).\n');
  } catch (error) {
    console.error('\n❌ Error generating SSL certificates:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

