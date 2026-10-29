// Database Migration Runner
// Chạy bằng: npm run db:migrate
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

const envFile = path.resolve('.env');
let connectionString = process.env.DATABASE_URL;

if (!connectionString && fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const match = envContent.match(/DATABASE_URL=([^\r\n]+)/);
  if (match) connectionString = match[1].trim();
}

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
  console.log('⚠️ DATABASE_URL chưa có mật khẩu thực tế trong file .env');
  console.log('👉 Vui lòng thay thế [YOUR-PASSWORD] bằng mật khẩu database Supabase của bạn.');
  console.log('👉 Hoặc copy toàn bộ nội dung file db/migration.sql dán vào Supabase SQL Editor và bấm Run.');
  process.exit(0);
}

console.log('🚀 Đang kết nối tới Supabase qua connection string...');
const sql = postgres(connectionString);

try {
  const migrationSql = fs.readFileSync(path.resolve('db/migration.sql'), 'utf8');
  await sql.unsafe(migrationSql);
  console.log('✅ Chạy migration thành công! Toàn bộ 13 bảng và dữ liệu mẫu đã được khởi tạo trên Supabase.');
} catch (err) {
  console.error('❌ Lỗi khi chạy migration:', err.message);
} finally {
  await sql.end();
}
