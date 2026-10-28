// Mock API & In-Memory Store for immediate local development and demonstration
// Giúp website chạy hoàn chỉnh, tương tác đầy đủ không cần chờ cấu hình Supabase
import type {
  User,
  Rank,
  Exam,
  ExamAssignment,
  Attempt,
  Answer,
  Certificate,
  CertificateRequest,
  UserCertificate,
  Appeal,
  AntiCheatEvent,
  Department,
} from './types';

// Danh mục các Sở Cảnh Sát (Departments)
export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'sasp',
    code: 'SASP',
    name: 'San Andreas State Police',
    short_name: 'Cảnh Sát Tiểu Bang SASP',
    logo: '/sasplogo.png',
    description: 'Lực lượng Cảnh sát Tiểu bang San Andreas có thẩm quyền giám sát liên hạt và quản lý toàn bang.',
    badge_color: 'from-blue-900 to-indigo-950',
  },
  {
    id: 'bcso',
    code: 'BCSO',
    name: "Blaine County Sheriff's Office",
    short_name: 'Cảnh Sát Trưởng Hạt BCSO',
    logo: '/sherifflogo.png',
    description: 'Văn phòng Cảnh sát Trưởng Hạt Blaine quản lý an ninh trật tự, tuần tra khu vực nông thôn và sa mạc.',
    badge_color: 'from-amber-800 to-yellow-950',
  },
  {
    id: 'lspd',
    code: 'LSPD',
    name: 'Los Santos Police Department',
    short_name: 'Cảnh Sát Thành Phố LSPD',
    logo: '/lspd.png',
    description: 'Sở Cảnh sát Thành phố Los Santos phụ trách an ninh trật tự, tuần tra nội đô, khu trung tâm thương mại và đô thị.',
    badge_color: 'from-blue-800 to-slate-900',
  },
];

// Initial Ranks seed phân theo từng Sở
export const INITIAL_RANKS: Rank[] = [
  // --- SASP Ranks (San Andreas State Police) ---
  { id: 'rank-sasp-1', name: 'State Trooper', level: 1, can_grade: false, department_id: 'sasp' },
  { id: 'rank-sasp-2', name: 'Senior Trooper', level: 2, can_grade: false, department_id: 'sasp' },
  { id: 'rank-sasp-3', name: 'Corporal', level: 3, can_grade: false, department_id: 'sasp' },
  { id: 'rank-sasp-4', name: 'Sergeant', level: 4, can_grade: false, department_id: 'sasp' },
  { id: 'rank-sasp-5', name: 'Lieutenant', level: 5, can_grade: false, department_id: 'sasp' },
  { id: 'rank-sasp-6', name: 'Captain', level: 6, can_grade: true, department_id: 'sasp' },
  { id: 'rank-sasp-7', name: 'Major', level: 7, can_grade: true, department_id: 'sasp' },
  { id: 'rank-sasp-10', name: 'Colonel / Superintendent', level: 10, can_grade: true, department_id: 'sasp' },

  // --- BCSO Ranks (Blaine County Sheriff's Office) ---
  { id: 'rank-bcso-1', name: 'Deputy Sheriff', level: 1, can_grade: false, department_id: 'bcso' },
  { id: 'rank-bcso-2', name: 'Senior Deputy', level: 2, can_grade: false, department_id: 'bcso' },
  { id: 'rank-bcso-3', name: 'Corporal', level: 3, can_grade: false, department_id: 'bcso' },
  { id: 'rank-bcso-4', name: 'Sergeant', level: 4, can_grade: false, department_id: 'bcso' },
  { id: 'rank-bcso-5', name: 'Lieutenant', level: 5, can_grade: false, department_id: 'bcso' },
  { id: 'rank-bcso-6', name: 'Captain', level: 6, can_grade: true, department_id: 'bcso' },
  { id: 'rank-bcso-9', name: 'Undersheriff', level: 9, can_grade: true, department_id: 'bcso' },
  { id: 'rank-bcso-10', name: 'Sheriff', level: 10, can_grade: true, department_id: 'bcso' },

  // --- LSPD Ranks (Los Santos Police Department) ---
  { id: 'rank-lspd-1', name: 'Police Officer I', level: 1, can_grade: false, department_id: 'lspd' },
  { id: 'rank-lspd-2', name: 'Police Officer II', level: 2, can_grade: false, department_id: 'lspd' },
  { id: 'rank-lspd-3', name: 'Police Officer III', level: 3, can_grade: false, department_id: 'lspd' },
  { id: 'rank-lspd-4', name: 'Sergeant I', level: 4, can_grade: false, department_id: 'lspd' },
  { id: 'rank-lspd-5', name: 'Sergeant II', level: 5, can_grade: false, department_id: 'lspd' },
  { id: 'rank-lspd-6', name: 'Lieutenant', level: 6, can_grade: true, department_id: 'lspd' },
  { id: 'rank-lspd-7', name: 'Captain', level: 7, can_grade: true, department_id: 'lspd' },
  { id: 'rank-lspd-8', name: 'Commander', level: 8, can_grade: true, department_id: 'lspd' },
  { id: 'rank-lspd-9', name: 'Deputy Chief', level: 9, can_grade: true, department_id: 'lspd' },
  { id: 'rank-lspd-10', name: 'Chief of Police', level: 10, can_grade: true, department_id: 'lspd' },
];

// Initial Users seed (Mật khẩu mặc định demo: 123456)
export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    callsign: 'admin',
    full_name: 'SQ: Jack Takaheshi',
    rank_id: 'rank-sasp-10',
    rank: INITIAL_RANKS[7],
    roles: ['ADMIN', 'GRADER', 'OFFICER'],
    department_id: 'sasp',
    is_active: true,
    duty_note: 'Phụ trách đào tạo và sát hạch nghiệp vụ toàn tiểu bang (SASP & BCSO & LSPD).',
    created_at: '2026-01-01T08:00:00Z',
  },
];

// Certificates
export const INITIAL_CERTS: Certificate[] = [
  {
    id: 'cert-1',
    name: 'Sử dụng Vũ khí Quân dụng Cấp 1',
    description: 'Kỹ năng tác chiến, an toàn xạ kích súng ngắn tiêu chuẩn và súng trường carbine.',
    is_active: true,
  },
  {
    id: 'cert-2',
    name: 'Sơ cấp cứu & Cứu nạn Hiện trường',
    description: 'Kỹ thuật hồi sinh tim phổi CPR, cầm máu dập xung, cứu người bị nạn khi có vũ lực.',
    is_active: true,
  },
  {
    id: 'cert-3',
    name: 'Kỹ thuật Điều tra Hiện trường Vụ án',
    description: 'Bảo vệ dấu vết hình sự, thu thập mẫu vật chứng và lập biên bản tố tụng.',
    is_active: true,
  },
  {
    id: 'cert-4',
    name: 'Lái xe Đặc chủng & Truy đuổi Địa hình BCSO',
    description: 'Kỹ năng điều khiển phương tiện tuần tra trên địa hình sa mạc, đồi núi cát sỏi Hạt Blaine.',
    is_active: true,
  },
  {
    id: 'cert-5',
    name: 'Chặn bắt Tốc độ cao Cao tốc SASP',
    description: 'Chiến thuật chặn bắt PIT maneuver tốc độ cao trên hệ thống đường cao tốc liên bang.',
    is_active: true,
  },
];

// Exams phân loại theo từng Sở Cảnh Sát (all / sasp / bcso)
export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'Kiểm tra Pháp luật & Quy tắc Thi hành Công vụ Cơ bản (Chung toàn lực lượng)',
    type: 'general',
    department_id: 'all',
    duration_minutes: 45,
    pass_score: 5,
    status: 'published',
    created_by: 'user-admin',
    created_at: '2026-03-01T08:00:00Z',
    questions: [
      {
        id: 'q-1',
        exam_id: 'exam-1',
        order_index: 1,
        type: 'mcq',
        text: 'Khi phát hiện đối tượng điều khiển phương tiện có dấu hiệu say xỉn và lạng lách trên đường phố, biện pháp đầu tiên tổ tuần tra phải thực hiện là gì?',
        points: 2,
        options: [
          { id: 'opt-1', text: 'Bật còi ưu tiên, phát loa yêu cầu đối tượng dừng xe vào lề đường an toàn' },
          { id: 'opt-2', text: 'Lập tức nổ súng chỉ thiên cảnh cáo đối tượng' },
          { id: 'opt-3', text: 'Tông xe đặc chủng chặn đầu phương tiện của đối tượng' },
          { id: 'opt-4', text: 'Ghi hình lại và bỏ qua không xử lý' },
        ],
        correct_option_id: 'opt-1',
        grader_note: 'Căn cứ Điều 12 Quy trình tuần tra kiểm soát giao thông đường bộ.',
        min_words: 0,
      },
      {
        id: 'q-2',
        exam_id: 'exam-1',
        order_index: 2,
        type: 'mcq',
        text: 'Thời hạn tối đa tạm giữ người theo thủ tục hành chính trong trường hợp cần ngăn chặn hành vi gây rối là bao lâu?',
        points: 2,
        options: [
          { id: 'opt-5', text: '12 giờ' },
          { id: 'opt-6', text: '24 giờ (trường hợp đặc biệt không quá 48 giờ)' },
          { id: 'opt-7', text: '72 giờ' },
          { id: 'opt-8', text: '7 ngày' },
        ],
        correct_option_id: 'opt-6',
        grader_note: 'Luật Xử lý vi phạm hành chính hiện hành.',
        min_words: 0,
      },
      {
        id: 'q-3',
        exam_id: 'exam-1',
        order_index: 3,
        type: 'true_false_explain',
        text: 'Cán bộ chiến sĩ được phép tự ý kiểm tra hành chính nơi ở của công dân vào ban đêm mà không cần có mặt của đại diện chính quyền địa phương hoặc người chứng kiến.',
        points: 3,
        correct_boolean: false,
        grader_note: 'Đáp án: SAI. Căn cứ Bộ luật Tố tụng Hình sự: Khám xét chỗ ở không được bắt đầu vào ban đêm trừ trường hợp khẩn cấp, và bắt buộc phải có đại diện chính quyền cơ sở hoặc người chứng kiến.',
        min_words: 20,
      },
      {
        id: 'q-4',
        exam_id: 'exam-1',
        order_index: 4,
        type: 'essay',
        text: 'Đồng chí hãy trình bày các bước giải quyết tình huống khi một đối tượng cầm hung khí đe dọa người dân tại nơi công cộng. Nêu rõ nguyên tắc sử dụng vũ lực và phương án bảo vệ nạn nhân.',
        points: 3,
        grader_note: 'Tiêu chí chấm: 1. Đánh giá tính chất đe dọa (1đ); 2. Lập vành đai cô lập, thuyết phục đối tượng (1đ); 3. Nguyên tắc phòng vệ chính đáng và dùng vũ lực tối thiểu cần thiết để vô hiệu hóa (1đ). Tối thiểu 20 từ.',
        min_words: 20,
      },
    ],
  },
  {
    id: 'exam-2',
    title: 'Sát hạch Thăng cấp SASP: Sĩ quan lên Senior Trooper',
    type: 'promotion',
    department_id: 'sasp',
    target_rank_id: 'rank-sasp-2',
    duration_minutes: 60,
    pass_score: 6,
    status: 'published',
    created_by: 'user-admin',
    created_at: '2026-03-05T08:00:00Z',
    questions: [
      {
        id: 'q-2-1',
        exam_id: 'exam-2',
        order_index: 1,
        type: 'mcq',
        text: 'Đặc quyền và thẩm quyền pháp lý của lực lượng Cảnh sát Tiểu bang (SASP) so với cảnh sát hạt là gì?',
        points: 4,
        options: [
          { id: 'opt-2-1', text: 'Có thẩm quyền giám sát, phối hợp và chỉ huy liên hạt trên toàn bộ bang San Andreas' },
          { id: 'opt-2-2', text: 'Chỉ được hoạt động trong phạm vi nội ô thành phố' },
          { id: 'opt-2-3', text: 'Không được phép thực hiện tuần tra cao tốc' },
        ],
        correct_option_id: 'opt-2-1',
        grader_note: 'Thẩm quyền của San Andreas State Police.',
        min_words: 0,
      },
      {
        id: 'q-2-2',
        exam_id: 'exam-2',
        order_index: 2,
        type: 'essay',
        text: 'Phân tích quy trình tổ chức kiểm soát trật tự giao thông trên tuyến cao tốc liên bang và xử lý tình huống xe nghi phạm vượt quá 150 km/h.',
        points: 6,
        grader_note: 'Đảm bảo an toàn luồng giao thông, thông báo trạm thu phí và phối hợp bẫy đinh (Spike strips).',
        min_words: 30,
      },
    ],
  },
  {
    id: 'exam-3',
    title: 'Sát hạch Nghiệp vụ Tuần tra Nông thôn & Sa mạc (BCSO Sheriff)',
    type: 'general',
    department_id: 'bcso',
    duration_minutes: 50,
    pass_score: 6,
    status: 'published',
    created_by: 'user-sheriff-bcso',
    created_at: '2026-03-08T08:00:00Z',
    questions: [
      {
        id: 'q-3-1',
        exam_id: 'exam-3',
        order_index: 1,
        type: 'mcq',
        text: 'Địa bàn phụ trách quản lý chính của Văn phòng Cảnh sát Trưởng Hạt Blaine (BCSO) bao gồm khu vực nào?',
        points: 4,
        options: [
          { id: 'opt-3-1', text: 'Sandy Shores, Paleto Bay, Grapeseed và toàn bộ khu vực nông thôn Hạt Blaine' },
          { id: 'opt-3-2', text: 'Sân bay quốc tế Los Santos' },
          { id: 'opt-3-3', text: 'Khu vực bến cảng trung tâm Los Santos' },
        ],
        correct_option_id: 'opt-3-1',
        grader_note: 'Khu vực địa lý địa bàn Hạt Blaine.',
        min_words: 0,
      },
      {
        id: 'q-3-2',
        exam_id: 'exam-3',
        order_index: 2,
        type: 'essay',
        text: 'Đồng chí hãy nêu phương án cứu nạn khẩn cấp khi người dân bị mắc kẹt tại hẻm núi Mount Chiliad trong điều kiện thời tiết xấu.',
        points: 6,
        grader_note: 'Triển khai lực lượng cứu nạn BCSO Search and Rescue, sử dụng xe cào cào/trực thăng, thiết lập thông tin liên lạc vệ tinh.',
        min_words: 25,
      },
    ],
  },
  {
    id: 'exam-4',
    title: 'Sát hạch Tác chiến Đô thị & Kiểm soát Trật tự Los Santos (LSPD Metro)',
    type: 'general',
    department_id: 'lspd',
    duration_minutes: 50,
    pass_score: 6,
    status: 'published',
    created_by: 'user-chief-lspd',
    created_at: '2026-03-15T08:00:00Z',
    questions: [
      {
        id: 'q-4-1',
        exam_id: 'exam-4',
        order_index: 1,
        type: 'mcq',
        text: 'Địa bàn tuần tra và trách nhiệm quản lý trật tự công cộng chính của LSPD là khu vực nào?',
        points: 4,
        options: [
          { id: 'opt-4-1', text: 'Toàn bộ nội đô thành phố Los Santos, khu thương mại Downtown, Vinewood và Rockford Hills' },
          { id: 'opt-4-2', text: 'Khu vực sa mạc Sandy Shores và đỉnh núi Chiliad' },
          { id: 'opt-4-3', text: 'Hệ thống đường cao tốc liên hạt nối liền bang San Andreas' },
        ],
        correct_option_id: 'opt-4-1',
        grader_note: 'Địa bàn thẩm quyền của Los Santos Police Department (LSPD).',
        min_words: 0,
      },
      {
        id: 'q-4-2',
        exam_id: 'exam-4',
        order_index: 2,
        type: 'essay',
        text: 'Trình bày quy trình phong tỏa hiện trường và xử lý tình huống cướp ngân hàng có con tin tại trung tâm thành phố Los Santos (Pacific Standard Bank).',
        points: 6,
        grader_note: 'Yêu cầu: Thiết lập vành đai 3 lớp bảo vệ, liên hệ đàm phán con tin, bố trí tổ bắn tỉa và đơn vị đặc nhiệm SWAT/Metro LSPD.',
        min_words: 25,
      },
    ],
  },
];

// Initial Assignments
export const INITIAL_ASSIGNMENTS: ExamAssignment[] = [
  {
    id: 'assign-1',
    exam_id: 'exam-1',
    user_id: 'user-officer-1',
    assigned_by: 'user-admin',
    assigned_at: '2026-03-10T09:00:00Z',
    status: 'assigned',
    exam: INITIAL_EXAMS[0],
  },
  {
    id: 'assign-2',
    exam_id: 'exam-3',
    user_id: 'user-officer-1',
    assigned_by: 'user-sheriff-bcso',
    assigned_at: '2026-03-12T09:00:00Z',
    status: 'assigned',
    exam: INITIAL_EXAMS[2],
  },
  {
    id: 'assign-3',
    exam_id: 'exam-2',
    user_id: 'user-officer-2',
    assigned_by: 'user-admin',
    assigned_at: '2026-03-14T09:00:00Z',
    status: 'assigned',
    exam: INITIAL_EXAMS[1],
  },
];

// Helper to persist in localStorage
const STORAGE_PREFIX = 'police_exam_db_';

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

// Global Memory State initialized with seed or local storage
class MockDatabase {
  departments: Department[] = this.migrateDepartments(getStorage('departments', INITIAL_DEPARTMENTS));
  users: User[] = this.migrateUsers(getStorage('users', INITIAL_USERS));
  passwords: Record<string, string> = getStorage('passwords', { 'user-admin': '123456' });
  ranks: Rank[] = this.migrateRanks(getStorage('ranks', INITIAL_RANKS));
  exams: Exam[] = this.migrateExams(getStorage('exams', INITIAL_EXAMS));
  assignments: ExamAssignment[] = getStorage('assignments', INITIAL_ASSIGNMENTS);
  attempts: Attempt[] = getStorage('attempts', []);
  answers: Answer[] = getStorage('answers', []);
  certificates: Certificate[] = getStorage('certificates', INITIAL_CERTS);
  certRequests: CertificateRequest[] = getStorage('cert_requests', []);
  userCerts: UserCertificate[] = getStorage('user_certs', []);
  appeals: Appeal[] = getStorage('appeals', []);
  antiCheatEvents: AntiCheatEvent[] = getStorage('anticheat_events', []);

  private migrateDepartments(loadedDepts: Department[]): Department[] {
    const merged = [...loadedDepts];
    INITIAL_DEPARTMENTS.forEach((initD) => {
      const idx = merged.findIndex((d) => d.id === initD.id);
      if (idx === -1) {
        merged.push(initD);
      } else {
        merged[idx] = { ...merged[idx], ...initD };
      }
    });
    return merged;
  }

  private migrateUsers(loadedUsers: User[]): User[] {
    // Đảm bảo các user mới (BCSO sheriff, SASP trooper...) luôn có trong danh sách
    const merged = [...loadedUsers];
    INITIAL_USERS.forEach((initU) => {
      const idx = merged.findIndex((u) => u.id === initU.id || u.callsign.toLowerCase() === initU.callsign.toLowerCase());
      if (idx === -1) {
        merged.push(initU);
      } else {
        // Cập nhật department_id nếu chưa có
        if (!merged[idx].department_id) {
          merged[idx].department_id = initU.department_id;
        }
      }
    });
    return merged;
  }

  private migrateRanks(loadedRanks: Rank[]): Rank[] {
    // Đảm bảo có đủ ranks của cả SASP và BCSO
    const merged = [...loadedRanks];
    INITIAL_RANKS.forEach((initR) => {
      const idx = merged.findIndex((r) => r.id === initR.id);
      if (idx === -1) {
        merged.push(initR);
      } else {
        if (!merged[idx].department_id) {
          merged[idx].department_id = initR.department_id;
        }
      }
    });
    return merged;
  }

  private migrateExams(loadedExams: Exam[]): Exam[] {
    const merged = [...loadedExams];
    INITIAL_EXAMS.forEach((initE) => {
      const idx = merged.findIndex((e) => e.id === initE.id);
      if (idx === -1) {
        merged.push(initE);
      } else {
        if (!merged[idx].department_id) {
          merged[idx].department_id = initE.department_id;
        }
      }
    });
    return merged;
  }

  save() {
    setStorage('departments', this.departments);
    setStorage('users', this.users);
    setStorage('passwords', this.passwords);
    setStorage('ranks', this.ranks);
    setStorage('exams', this.exams);
    setStorage('assignments', this.assignments);
    setStorage('attempts', this.attempts);
    setStorage('answers', this.answers);
    setStorage('certificates', this.certificates);
    setStorage('cert_requests', this.certRequests);
    setStorage('user_certs', this.userCerts);
    setStorage('appeals', this.appeals);
    setStorage('anticheat_events', this.antiCheatEvents);
  }
}

export const db = new MockDatabase();
