// Database Migration Runner
// Chạy bằng: npm run db:migrate
import fs from 'fs';
import path from 'path';

console.log('--- EXECUTING MIGRATIONS ---');
const sqlFile = path.resolve('db/migration.sql');
if (fs.existsSync(sqlFile)) {
  console.log(`Đã nạp file migration: ${sqlFile}`);
  console.log('Vui lòng copy nội dung file migration.sql vào Supabase SQL Editor để khởi tạo bảng.');
} else {
  console.error('Không tìm thấy file db/migration.sql');
}

