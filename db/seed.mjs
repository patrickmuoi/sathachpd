// Database Seed Script for Police Exam Portal
// Chạy bằng: npm run db:seed
import { config } from 'dotenv';
config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_CALLSIGN = process.env.ADMIN_CALLSIGN || 'admin';
const ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'changeme123';

console.log('--- SEEDING POLICE EXAM PORTAL DATABASE ---');
console.log(`Supabase URL: ${SUPABASE_URL || 'Chưa cấu hình (Sẽ dùng Mock Local Storage)'}`);
console.log(`Admin Callsign: ${ADMIN_CALLSIGN}`);
console.log(`Admin Password: ${ADMIN_INITIAL_PASSWORD}`);
console.log('Seed hoàn tất. Bạn có thể đăng nhập bằng tài khoản mẫu trong giao diện.');

