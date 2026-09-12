import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import { Types } from 'mongoose';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz';

interface OrgDoc {
  _id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  aiQuotaMonthly?: number;
  aiQuotaUsed?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserDoc {
  _id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  organizationIds?: string[];
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OptionDef {
  _id: Types.ObjectId;
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface QuestionDef {
  _id: Types.ObjectId;
  content: string;
  type: string;
  points: number;
  difficulty: string;
  tags: string[];
  explanation: string;
  orderIndex: number;
  options: OptionDef[];
}

interface AnswerDef {
  questionId: Types.ObjectId;
  selectedOptionIds: Types.ObjectId[];
  isCorrect: boolean;
  timeSpentSec: number;
  pointsEarned: number;
}

interface ViolationDef {
  type: string;
  occurredAt: Date;
}

interface AttemptDef {
  _id: Types.ObjectId;
  organizationId: string;
  userId: string;
  quizId: Types.ObjectId;
  quizVersion: number;
  assignmentId?: Types.ObjectId | null;
  questionOrder: Types.ObjectId[];
  status: string;
  score: number;
  totalPoints: number;
  correctCount: number;
  wrongCount: number;
  answers: AnswerDef[];
  violations: ViolationDef[];
  startedAt: Date;
  submittedAt?: Date | null;
  expiresAt: Date;
  durationSec: number;
  createdAt: Date;
  updatedAt: Date;
}

async function seed(): Promise<void> {
  console.log('🌱 Starting rich and comprehensive database seed...');
  console.log(`📡 Connecting to MongoDB at: ${MONGODB_URI}`);

  const conn = await mongoose.connect(MONGODB_URI);
  const db = conn.connection.db;

  if (!db) {
    console.error('❌ MongoDB database connection unavailable');
    process.exit(1);
  }

  const usersCol = db.collection<UserDoc>('users');
  const orgsCol = db.collection<OrgDoc>('organizations');
  const orgMembersCol = db.collection('organization_members');
  const quizzesCol = db.collection('quizzes');
  const versionsCol = db.collection('quiz_versions');
  const classesCol = db.collection('classes');
  const membersCol = db.collection('class_members');
  const assignmentsCol = db.collection('quiz_assignments');
  const attemptsCol = db.collection('exam_attempts');
  const auditLogsCol = db.collection('audit_logs');
  const subsCol = db.collection('subscriptions');
  const paymentsCol = db.collection('payment_transactions');

  // ==========================================
  // 1. Resolve Active Organization
  // ==========================================
  let targetOrg = await orgsCol.findOne({});
  if (!targetOrg) {
    const defaultOrg: OrgDoc = {
      _id: 'org_demo_fullstack_2026',
      name: 'Khoa Công Nghệ Thông Tin - VTI Academy',
      slug: 'vti-cntt',
      logoUrl:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80',
      aiQuotaMonthly: 100000,
      aiQuotaUsed: 12500,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await orgsCol.insertOne(defaultOrg);
    targetOrg = defaultOrg;
  }
  const orgId = String(targetOrg._id);
  console.log(`🏢 Active Organization: ${targetOrg.name} (${orgId})`);

  // ==========================================
  // 2. Resolve Teacher Account
  // ==========================================
  let teacherUser = await usersCol.findOne({ organizationIds: { $in: [orgId] } });
  if (!teacherUser) {
    teacherUser = await usersCol.findOne({});
  }
  if (!teacherUser) {
    const demoTeacher: UserDoc = {
      _id: 'user_teacher_demo_01',
      email: 'teacher.hoang@vti.edu.vn',
      fullName: 'ThS. Nguyễn Việt Hoàng',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TeacherHoang',
      organizationIds: [orgId],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await usersCol.insertOne(demoTeacher);
    teacherUser = demoTeacher;
  }
  const teacherId = String(teacherUser._id);
  console.log(`👨‍🏫 Teacher Account: ${teacherUser.fullName} (${teacherId})`);

  // Ensure teacher is org:admin in organization_members
  await orgMembersCol.updateOne(
    { organizationId: orgId, userId: teacherId },
    {
      $set: {
        role: 'org:admin',
        status: 'active',
        permissions: ['*'],
        updatedAt: new Date(),
      },
      $setOnInsert: {
        _id: new Types.ObjectId(),
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  // ==========================================
  // 3. 25 Realistic Student Accounts
  // ==========================================
  const studentProfiles = [
    { id: 'user_mock_student_01', name: 'Nguyễn Văn An', email: 'an.nguyen@vti.edu.vn' },
    { id: 'user_mock_student_02', name: 'Trần Thị Bình', email: 'binh.tran@vti.edu.vn' },
    { id: 'user_mock_student_03', name: 'Lê Hoàng Cường', email: 'cuong.le@vti.edu.vn' },
    { id: 'user_mock_student_04', name: 'Phạm Minh Đức', email: 'duc.pham@vti.edu.vn' },
    { id: 'user_mock_student_05', name: 'Vũ Thị Hoa', email: 'hoa.vu@vti.edu.vn' },
    { id: 'user_mock_student_06', name: 'Đỗ Tuấn Khang', email: 'khang.do@vti.edu.vn' },
    { id: 'user_mock_student_07', name: 'Ngô Hải Yến', email: 'yen.ngo@vti.edu.vn' },
    { id: 'user_mock_student_08', name: 'Bùi Đức Nam', email: 'nam.bui@vti.edu.vn' },
    { id: 'user_mock_student_09', name: 'Đặng Mai Phương', email: 'phuong.dang@vti.edu.vn' },
    { id: 'user_mock_student_10', name: 'Hoàng Quốc Việt', email: 'viet.hoang@vti.edu.vn' },
    { id: 'user_mock_student_11', name: 'Dương Thành Đạt', email: 'dat.duong@vti.edu.vn' },
    { id: 'user_mock_student_12', name: 'Lý Tiểu My', email: 'my.ly@vti.edu.vn' },
    { id: 'user_mock_student_13', name: 'Trịnh Bảo Ngọc', email: 'ngoc.trinh@vti.edu.vn' },
    { id: 'user_mock_student_14', name: 'Mai Văn Quân', email: 'quan.mai@vti.edu.vn' },
    { id: 'user_mock_student_15', name: 'Đinh Hồng Nhung', email: 'nhung.dinh@vti.edu.vn' },
    { id: 'user_mock_student_16', name: 'Phan Trọng Tấn', email: 'tan.phan@vti.edu.vn' },
    { id: 'user_mock_student_17', name: 'Lâm Khánh Chi', email: 'chi.lam@vti.edu.vn' },
    { id: 'user_mock_student_18', name: 'Võ Đình Trọng', email: 'trong.vo@vti.edu.vn' },
    { id: 'user_mock_student_19', name: 'Hà Kiều Anh', email: 'anh.ha@vti.edu.vn' },
    { id: 'user_mock_student_20', name: 'Chu Quang Huy', email: 'huy.chu@vti.edu.vn' },
    { id: 'user_mock_student_21', name: 'Đoàn Nhật Minh', email: 'minh.doan@vti.edu.vn' },
    { id: 'user_mock_student_22', name: 'Tạ Thùy Linh', email: 'linh.ta@vti.edu.vn' },
    { id: 'user_mock_student_23', name: 'Lương Thế Vinh', email: 'vinh.luong@vti.edu.vn' },
    { id: 'user_mock_student_24', name: 'Cao Thanh Thảo', email: 'thao.cao@vti.edu.vn' },
    { id: 'user_mock_student_25', name: 'Trương Gia Bình', email: 'binh.truong@vti.edu.vn' },
  ];

  // Remove any legacy mock students to avoid email unique collision
  await usersCol.deleteMany({ _id: { $regex: /^user_student_/ } });

  for (const s of studentProfiles) {
    await usersCol.updateOne(
      { email: s.email },
      {
        $set: {
          fullName: s.name,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
          organizationIds: [orgId],
          status: 'active',
          updatedAt: new Date(),
        },
        $setOnInsert: { _id: s.id, email: s.email, createdAt: new Date() },
      },
      { upsert: true },
    );

    await orgMembersCol.updateOne(
      { organizationId: orgId, userId: s.id },
      {
        $set: {
          role: 'org:member',
          status: 'active',
          permissions: ['exam:take', 'exam:read'],
          updatedAt: new Date(),
        },
        $setOnInsert: {
          _id: new Types.ObjectId(),
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
  console.log(`🎓 Seeded 25 Student accounts and memberships`);

  // ==========================================
  // 4. Create 5 Realistic Quizzes
  // ==========================================
  const quiz1Questions: QuestionDef[] = [
    {
      _id: new Types.ObjectId('66e400000000000000000101'),
      content:
        'Trong TypeScript, từ khóa nào được sử dụng để tạo kiểu dữ liệu mới dựa trên việc kết hợp các trường từ type hiện có?',
      type: 'single_choice',
      points: 2,
      difficulty: 'medium',
      tags: ['typescript', 'generics'],
      explanation:
        'Mapped types và utility types như Pick, Omit sử dụng keyof và mapped syntax để biến đổi kiểu.',
      orderIndex: 0,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000001a1'),
          content: 'type Mapped<T> = { [K in keyof T]: T[K] }',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001a2'),
          content: 'interface Combined extends T',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001a3'),
          content: 'declare module "type"',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001a4'),
          content: 'enum CombineType { A, B }',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000102'),
      content: 'Toán tử satisfies trong TypeScript 4.9 có tác dụng gì?',
      type: 'single_choice',
      points: 2,
      difficulty: 'hard',
      tags: ['typescript', 'type-checking'],
      explanation:
        'satisfies kiểm tra xem giá trị có khớp type không mà không làm thay đổi kiểu suy luận cụ thể của biến.',
      orderIndex: 1,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000001b1'),
          content: 'Validate type khớp với schema mà vẫn giữ nguyên inferred type gốc',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001b2'),
          content: 'Ép kiểu cưỡng chế runtime giống như `as unknown as Type`',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001b3'),
          content: 'Tự động convert kiểu dữ liệu tại runtime khi compile sang JS',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001b4'),
          content: 'Tạo class instance mới từ interface',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000103'),
      content:
        'Khác biệt chính giữa Type Alias (`type`) và Interface (`interface`) trong TypeScript là gì?',
      type: 'single_choice',
      points: 2,
      difficulty: 'easy',
      tags: ['typescript', 'fundamentals'],
      explanation:
        'Interface có khả năng Declaration Merging (khai báo nhiều lần cùng tên tự gộp lại), còn Type Alias thì không.',
      orderIndex: 2,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000001c1'),
          content: 'Interface hỗ trợ declaration merging, type alias thì không',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001c2'),
          content: 'Type alias chạy nhanh hơn interface tại runtime',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001c3'),
          content: 'Interface chỉ dùng cho function, không dùng cho object',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001c4'),
          content: 'Type alias bắt buộc phải export, interface thì không',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000104'),
      content: 'Trong generic `function identity<T>(arg: T): T`, ký hiệu `T` đại diện cho điều gì?',
      type: 'single_choice',
      points: 2,
      difficulty: 'easy',
      tags: ['typescript', 'generics'],
      explanation:
        'T là type variable (tham số kiểu), đại diện cho kiểu dữ liệu sẽ được xác định cụ thể khi gọi hàm.',
      orderIndex: 3,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000001d1'),
          content: 'Type variable lưu giữ kiểu dữ liệu cụ thể do caller truyền vào',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001d2'),
          content: 'Biến toàn cục runtime lưu trữ giá trị của tham số',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001d3'),
          content: 'Từ khóa viết tắt của kiểu dữ liệu chuỗi (Text)',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001d4'),
          content: 'Một object decorator bắt buộc trong class',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000105'),
      content: 'Kiểu `never` trong TypeScript đại diện cho điều gì?',
      type: 'single_choice',
      points: 2,
      difficulty: 'medium',
      tags: ['typescript', 'advanced'],
      explanation:
        'never biểu thị giá trị không bao giờ xảy ra (hàm ném lỗi vĩnh viễn, vòng lặp vô tận, hoặc exhaustive type checking).',
      orderIndex: 4,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000001e1'),
          content: 'Tập hợp rỗng, kiểu của giá trị không bao giờ xảy ra',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001e2'),
          content: 'Giá trị null hoặc undefined',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001e3'),
          content: 'Một biến có thể gán bất kỳ giá trị nào giống `any`',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000001e4'),
          content: 'Kiểu trả về của hàm async',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
  ];

  const quiz2Questions: QuestionDef[] = [
    {
      _id: new Types.ObjectId('66e400000000000000000201'),
      content: 'Trong Next.js App Router, mặc định tất cả components trong thư mục app/ là gì?',
      type: 'single_choice',
      points: 2,
      difficulty: 'easy',
      tags: ['nextjs', 'react-server-components'],
      explanation:
        'Mọi component trong App Router mặc định là React Server Component (RSC) trừ khi khai báo directive "use client".',
      orderIndex: 0,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000002a1'),
          content: 'React Server Components (RSC)',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002a2'),
          content: 'Client Components với hydration tự động',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002a3'),
          content: 'Edge API Routes',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002a4'),
          content: 'Static HTML template',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000202'),
      content:
        'Để kích hoạt Client-side state (`useState`, `useEffect`) trong Next.js App Router, ta dùng chỉ thị nào ở đầu file?',
      type: 'single_choice',
      points: 2,
      difficulty: 'easy',
      tags: ['nextjs', 'client-components'],
      explanation:
        'Directive `"use client"` đánh dấu ranh giới giữa server component và client bundle.',
      orderIndex: 1,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000002b1'),
          content: "'use client'",
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002b2'),
          content: "'client side'",
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002b3'),
          content: "'use react'",
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002b4'),
          content: "'use browser'",
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000203'),
      content: 'Server Action trong Next.js 15 được đánh dấu bằng chỉ thị nào?',
      type: 'single_choice',
      points: 2,
      difficulty: 'medium',
      tags: ['nextjs', 'server-actions'],
      explanation:
        'Chỉ thị `"use server"` đặt ở đầu file hoặc đầu async function định nghĩa hàm Server Action.',
      orderIndex: 2,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000002c1'),
          content: "'use server'",
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002c2'),
          content: "'server action'",
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002c3'),
          content: "'use backend'",
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002c4'),
          content: "'action server'",
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000204'),
      content:
        'Hàm nào dùng để kích hoạt revalidation dữ liệu theo tag trong Next.js caching layer?',
      type: 'single_choice',
      points: 2,
      difficulty: 'medium',
      tags: ['nextjs', 'caching'],
      explanation:
        'revalidateTag(tag) xóa cache và nạp dữ liệu mới cho các fetch request có gắn tag tương ứng.',
      orderIndex: 3,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000002d1'),
          content: 'revalidateTag(tag)',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002d2'),
          content: 'clearCache(tag)',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002d3'),
          content: 'refreshTag(tag)',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002d4'),
          content: 'reloadPath(tag)',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000205'),
      content:
        'Ưu điểm lớn nhất của việc render React Server Components so với SSR truyền thống là gì?',
      type: 'single_choice',
      points: 2,
      difficulty: 'hard',
      tags: ['nextjs', 'performance'],
      explanation:
        'RSC không gửi JavaScript bundle của server component về client, giúp giảm đáng kể bundle size.',
      orderIndex: 4,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000002e1'),
          content: 'Zero bundle size cho server component, giảm tải JavaScript cho client',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002e2'),
          content: 'Có thể sử dụng onClick và onChange trực tiếp trên server',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002e3'),
          content: 'Không cần web server Node.js',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000002e4'),
          content: 'Tự động lưu trữ dữ liệu vào LocalStorage',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
  ];

  const quiz3Questions: QuestionDef[] = [
    {
      _id: new Types.ObjectId('66e400000000000000000301'),
      content:
        'Trong MongoDB, stage nào trong aggregation pipeline được dùng để join 2 collections với nhau?',
      type: 'single_choice',
      points: 2,
      difficulty: 'easy',
      tags: ['mongodb', 'aggregation'],
      explanation: '$lookup thực hiện left outer join với một collection khác trong cùng database.',
      orderIndex: 0,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000003a1'),
          content: '$lookup',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003a2'),
          content: '$join',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003a3'),
          content: '$merge',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003a4'),
          content: '$populate',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000302'),
      content:
        'Compound Index `{ status: 1, createdAt: -1 }` có thể phục vụ hiệu quả cho query nào?',
      type: 'single_choice',
      points: 2,
      difficulty: 'medium',
      tags: ['mongodb', 'indexing'],
      explanation:
        'Theo nguyên tắc tiền tố (prefix), query có trường `status` và sắp xếp theo `createdAt` tận dụng tốt index này.',
      orderIndex: 1,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000003b1'),
          content: 'find({ status: "active" }).sort({ createdAt: -1 })',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003b2'),
          content: 'find({ createdAt: -1 }) không có status',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003b3'),
          content: 'find({ title: "abc" })',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003b4'),
          content: 'Chỉ dùng cho câu lệnh deleteOne',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000303'),
      content: 'Chỉ số TTL (Time To Live) trong MongoDB được thiết lập dựa trên loại trường nào?',
      type: 'single_choice',
      points: 2,
      difficulty: 'medium',
      tags: ['mongodb', 'ttl-index'],
      explanation:
        'TTL index chỉ hoạt động trên trường kiểu Date và tự động xóa document sau expireAfterSeconds.',
      orderIndex: 2,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000003c1'),
          content: 'Trường kiểu Date (ISODate)',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003c2'),
          content: 'Trường kiểu String lưu timestamp',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003c3'),
          content: 'Trường số nguyên Number',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003c4'),
          content: 'Bất kỳ trường boolean nào mang giá trị true',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000304'),
      content:
        'Trong Mongoose, phương thức `.lean()` mang lại lợi ích gì lớn nhất cho read queries?',
      type: 'single_choice',
      points: 2,
      difficulty: 'easy',
      tags: ['mongodb', 'mongoose'],
      explanation:
        '.lean() trả về plain JavaScript object thay vì Mongoose document nặng nề, tăng tốc độ và tiết kiệm RAM.',
      orderIndex: 3,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000003d1'),
          content: 'Bỏ qua khởi tạo Mongoose Document, trả về POJO giúp tối ưu bộ nhớ',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003d2'),
          content: 'Tự động mã hóa dữ liệu khi gửi qua mạng',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003d3'),
          content: 'Bắt buộc truy vấn phải trả về lỗi nếu không có dữ liệu',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003d4'),
          content: 'Tự động khóa document tránh race condition',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
    {
      _id: new Types.ObjectId('66e400000000000000000305'),
      content:
        'Phương pháp nào tối ưu nhất để phân trang dữ liệu hàng triệu records trong MongoDB?',
      type: 'single_choice',
      points: 2,
      difficulty: 'hard',
      tags: ['mongodb', 'pagination'],
      explanation:
        'Cursor-based / Keyset pagination (`_id < lastId`) có độ phức tạp O(1) so với skip() tốn O(N).',
      orderIndex: 4,
      options: [
        {
          _id: new Types.ObjectId('66e4000000000000000003e1'),
          content: 'Keyset / Keyset pagination sử dụng trường index `_id` hoặc timestamp',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003e2'),
          content: 'Dùng `.skip(1000000).limit(20)`',
          isCorrect: false,
          orderIndex: 1,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003e3'),
          content: 'Tải toàn bộ records về RAM rồi slice trên NodeJS',
          isCorrect: false,
          orderIndex: 2,
        },
        {
          _id: new Types.ObjectId('66e4000000000000000003e4'),
          content: 'Dùng regular expression filter',
          isCorrect: false,
          orderIndex: 3,
        },
      ],
    },
  ];

  const quizDefs = [
    {
      id: new Types.ObjectId('66e200000000000000000001'),
      title: 'TypeScript & Type System Chuyên Sâu',
      description:
        'Kiểm tra kiến thức Mapped Types, Generics, Type Narrowing và Satisfies Operator.',
      timeLimitSec: 1800,
      status: 'published',
      version: 2,
      questions: quiz1Questions,
    },
    {
      id: new Types.ObjectId('66e200000000000000000002'),
      title: 'Next.js 15 & React Server Components',
      description:
        'Đánh giá kiến thức kiến trúc App Router, Server Actions, Caching và Streaming SSR.',
      timeLimitSec: 2400,
      status: 'published',
      version: 1,
      questions: quiz2Questions,
    },
    {
      id: new Types.ObjectId('66e200000000000000000003'),
      title: 'MongoDB Aggregation Pipeline & Indexing',
      description:
        'Chuyên đề thiết kế chỉ mục, tối ưu hóa câu truy vấn, aggregation stages và performance.',
      timeLimitSec: 1800,
      status: 'published',
      version: 1,
      questions: quiz3Questions,
    },
    {
      id: new Types.ObjectId('66e200000000000000000004'),
      title: 'DevOps & Docker Containerization Cơ Bản',
      description: 'Đề thi bản nháp chuẩn bị kiểm tra giữa kỳ module triển khai hệ thống.',
      timeLimitSec: 1500,
      status: 'draft',
      version: 1,
      questions: quiz1Questions.slice(0, 3),
    },
  ];

  for (const q of quizDefs) {
    await quizzesCol.updateOne(
      { _id: q.id },
      {
        $set: {
          organizationId: orgId,
          title: q.title,
          description: q.description,
          timeLimitSec: q.timeLimitSec,
          status: q.status,
          version: q.version,
          questions: q.questions,
          questionCount: q.questions.length,
          updatedAt: new Date(),
          deletedAt: null,
        },
        $setOnInsert: {
          createdBy: teacherId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    // Freeze snapshot in quiz_versions for published quizzes
    if (q.status === 'published') {
      await versionsCol.updateOne(
        { quizId: q.id, version: q.version },
        {
          $set: {
            organizationId: orgId,
            snapshot: {
              title: q.title,
              description: q.description,
              timeLimitSec: q.timeLimitSec,
              questions: q.questions,
            },
          },
          $setOnInsert: {
            _id: new Types.ObjectId(),
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );

      // Add a historic v1 snapshot for Quiz 1 to demonstrate version history sheet
      if (q.version === 2) {
        await versionsCol.updateOne(
          { quizId: q.id, version: 1 },
          {
            $set: {
              organizationId: orgId,
              snapshot: {
                title: `${q.title} (Draft Initial)`,
                description: 'Bản sơ khai ban đầu trước khi bổ sung câu hỏi nâng cao',
                timeLimitSec: 1200,
                questions: q.questions.slice(0, 3),
              },
            },
            $setOnInsert: {
              _id: new Types.ObjectId(),
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          { upsert: true },
        );
      }
    }
  }
  console.log(`📚 Seeded 4 Quizzes with frozen version history`);

  // ==========================================
  // 5. Create 4 Classrooms & Memberships
  // ==========================================
  const classDefs = [
    {
      id: new Types.ObjectId('66e100000000000000000001'),
      name: 'Lớp Lập Trình Web Fullstack (Next.js & NestJS) - K21',
      description:
        'Chuyên đề NestJS, Next.js App Router, MongoDB, TailwindCSS & Realtime Socket.IO',
      activeStudentIds: studentProfiles.slice(0, 10).map((s) => s.id),
      pendingStudentIds: [] as string[],
    },
    {
      id: new Types.ObjectId('66e100000000000000000002'),
      name: 'Lớp Cấu Trúc Dữ Liệu & Giải Thuật Ứng Dụng - K22',
      description:
        'Môn nền tảng: Cây nhị phân, đồ thị Dijkstra, Quy hoạch động và tối ưu thời gian chạy',
      activeStudentIds: studentProfiles.slice(5, 17).map((s) => s.id),
      pendingStudentIds: [] as string[],
    },
    {
      id: new Types.ObjectId('66e100000000000000000003'),
      name: 'Lớp Cơ Sở Dữ Liệu Chuyên Sâu & MongoDB - K21',
      description:
        'Thiết kế cơ sở dữ liệu phân tán, Sharding, Replica Sets, và indexing chiến lược',
      activeStudentIds: studentProfiles.slice(12, 22).map((s) => s.id),
      pendingStudentIds: [] as string[],
    },
    {
      id: new Types.ObjectId('66e100000000000000000004'),
      name: 'Lớp DevOps, Docker & CI/CD Pipelines - K22',
      description: 'Thực hành Dockerize ứng dụng web, cấu hình GitHub Actions và Kubernetes deploy',
      activeStudentIds: studentProfiles.slice(18, 22).map((s) => s.id),
      pendingStudentIds: studentProfiles.slice(22, 25).map((s) => s.id), // 3 Pending Join Requests!
    },
  ];

  for (const c of classDefs) {
    await classesCol.updateOne(
      { _id: c.id },
      {
        $set: {
          organizationId: orgId,
          name: c.name,
          description: c.description,
          memberCount: c.activeStudentIds.length,
          status: 'active',
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdBy: teacherId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    // Active students
    for (const sId of c.activeStudentIds) {
      await membersCol.updateOne(
        { classId: c.id, userId: sId },
        {
          $set: {
            organizationId: orgId,
            role: 'student',
            status: 'active',
            joinedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }

    // Pending student join requests
    for (const pId of c.pendingStudentIds) {
      await membersCol.updateOne(
        { classId: c.id, userId: pId },
        {
          $set: {
            organizationId: orgId,
            role: 'student',
            status: 'pending',
            joinedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }
  }
  console.log(`🏫 Seeded 4 Classrooms with active students and pending join requests`);

  // ==========================================
  // 6. Create 5 Assignments across Classrooms
  // ==========================================
  const now = new Date();
  const pastThreeDays = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const nextSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const pastTenDays = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const pastTwoDays = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const assignmentDefs = [
    {
      id: new Types.ObjectId('66e500000000000000000001'),
      classId: classDefs[0].id,
      quizId: quizDefs[0].id, // TypeScript
      quizVersion: 2,
      startAt: pastThreeDays,
      dueAt: nextSevenDays,
      allowLateSubmit: true,
    },
    {
      id: new Types.ObjectId('66e500000000000000000002'),
      classId: classDefs[0].id,
      quizId: quizDefs[1].id, // Next.js
      quizVersion: 1,
      startAt: pastThreeDays,
      dueAt: nextSevenDays,
      allowLateSubmit: false,
    },
    {
      id: new Types.ObjectId('66e500000000000000000003'),
      classId: classDefs[1].id,
      quizId: quizDefs[0].id, // TypeScript in Class 2
      quizVersion: 2,
      startAt: pastThreeDays,
      dueAt: nextSevenDays,
      allowLateSubmit: true,
    },
    {
      id: new Types.ObjectId('66e500000000000000000004'),
      classId: classDefs[2].id,
      quizId: quizDefs[2].id, // MongoDB Aggregation
      quizVersion: 1,
      startAt: pastTenDays,
      dueAt: pastTwoDays, // Past due / closed assessment
      allowLateSubmit: false,
    },
    {
      id: new Types.ObjectId('66e500000000000000000005'),
      classId: classDefs[0].id,
      quizId: quizDefs[2].id, // Unlimited Practice Mode
      quizVersion: 1,
      startAt: null,
      dueAt: null,
      allowLateSubmit: true,
    },
  ];

  for (const a of assignmentDefs) {
    await assignmentsCol.updateOne(
      { _id: a.id },
      {
        $set: {
          organizationId: orgId,
          classId: a.classId,
          quizId: a.quizId,
          quizVersion: a.quizVersion,
          startAt: a.startAt,
          dueAt: a.dueAt,
          allowLateSubmit: a.allowLateSubmit,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          assignedBy: teacherId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
  console.log(`📋 Seeded 5 Assignments (Active, Closed, and Unlimited Practice)`);

  // ==========================================
  // 7. Seed Exam Attempts (~45-50 attempts)
  // ==========================================
  // Helper to generate answers matching desired score percentage
  function generateAnswers(questions: QuestionDef[], targetPct: number): AnswerDef[] {
    const totalQuestions = questions.length;
    const correctTargetCount = Math.round((targetPct / 100) * totalQuestions);

    return questions.map((q, idx) => {
      const isCorrect = idx < correctTargetCount;
      const correctOption = q.options.find((o) => o.isCorrect) || q.options[0];
      const wrongOption = q.options.find((o) => !o.isCorrect) || q.options[1] || q.options[0];

      return {
        questionId: q._id,
        selectedOptionIds: [isCorrect ? correctOption._id : wrongOption._id],
        isCorrect,
        timeSpentSec: 25 + Math.floor(Math.random() * 45),
        pointsEarned: isCorrect ? q.points : 0,
      };
    });
  }

  // Clear existing mock attempts for clean rerun
  await attemptsCol.deleteMany({ organizationId: orgId });

  const attemptsToInsert: AttemptDef[] = [];

  // 7.1 Teacher Practice History (3 attempts so "My Practice History" is populated!)
  const teacherHistoryScores = [100, 80, 60];
  for (let i = 0; i < teacherHistoryScores.length; i++) {
    const scorePct = teacherHistoryScores[i];
    const answers = generateAnswers(quiz1Questions, scorePct);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const totalPoints = quiz1Questions.reduce((acc, q) => acc + q.points, 0);
    const score = answers.reduce((acc, a) => acc + a.pointsEarned, 0);

    attemptsToInsert.push({
      _id: new Types.ObjectId(),
      organizationId: orgId,
      userId: teacherId,
      quizId: quizDefs[i % 2].id,
      quizVersion: 1,
      assignmentId: null, // Practice mode
      questionOrder: quiz1Questions.map((q) => q._id),
      status: 'submitted',
      score,
      totalPoints,
      correctCount,
      wrongCount,
      answers,
      violations:
        i === 1
          ? [{ type: 'tab_switch', occurredAt: new Date(now.getTime() - 2 * 60 * 1000) }]
          : [],
      startedAt: new Date(now.getTime() - (2 + i) * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - (2 + i) * 60 * 60 * 1000 + 480 * 1000),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      durationSec: 480 + i * 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 7.2 Class 1 - Assignment 1 (TypeScript) -> 10 students
  const c1Students = studentProfiles.slice(0, 10);
  const c1Scores = [100, 100, 80, 80, 80, 60, 60, 40, 40, 20];
  for (let i = 0; i < c1Students.length; i++) {
    const student = c1Students[i];
    const scorePct = c1Scores[i];
    const answers = generateAnswers(quiz1Questions, scorePct);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const totalPoints = quiz1Questions.reduce((acc, q) => acc + q.points, 0);
    const score = answers.reduce((acc, a) => acc + a.pointsEarned, 0);
    const isForced = i === 8; // Auto-submitted by timer

    const violations: ViolationDef[] = [];
    if (i === 6) {
      violations.push({ type: 'tab_switch', occurredAt: new Date(now.getTime() - 15 * 60 * 1000) });
      violations.push({
        type: 'window_blur',
        occurredAt: new Date(now.getTime() - 12 * 60 * 1000),
      });
    }
    if (i === 8) {
      violations.push({
        type: 'fullscreen_exit',
        occurredAt: new Date(now.getTime() - 8 * 60 * 1000),
      });
    }

    attemptsToInsert.push({
      _id: new Types.ObjectId(),
      organizationId: orgId,
      userId: student.id,
      quizId: quizDefs[0].id,
      quizVersion: 2,
      assignmentId: assignmentDefs[0].id,
      questionOrder: quiz1Questions.map((q) => q._id),
      status: isForced ? 'force_submitted' : 'submitted',
      score,
      totalPoints,
      correctCount,
      wrongCount,
      answers,
      violations,
      startedAt: new Date(now.getTime() - (40 + i * 5) * 60 * 1000),
      submittedAt: new Date(now.getTime() - (15 + i * 5) * 60 * 1000),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      durationSec: 320 + i * 40,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 7.3 Class 1 - Assignment 2 (Next.js) -> 8 students
  const c1Assignment2Scores = [100, 80, 80, 60, 60, 40, 40, 20];
  for (let i = 0; i < 8; i++) {
    const student = c1Students[i];
    const scorePct = c1Assignment2Scores[i];
    const answers = generateAnswers(quiz2Questions, scorePct);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const totalPoints = quiz2Questions.reduce((acc, q) => acc + q.points, 0);
    const score = answers.reduce((acc, a) => acc + a.pointsEarned, 0);

    attemptsToInsert.push({
      _id: new Types.ObjectId(),
      organizationId: orgId,
      userId: student.id,
      quizId: quizDefs[1].id,
      quizVersion: 1,
      assignmentId: assignmentDefs[1].id,
      questionOrder: quiz2Questions.map((q) => q._id),
      status: 'submitted',
      score,
      totalPoints,
      correctCount,
      wrongCount,
      answers,
      violations:
        i === 3
          ? [{ type: 'fullscreen_exit', occurredAt: new Date(now.getTime() - 20 * 60 * 1000) }]
          : [],
      startedAt: new Date(now.getTime() - (50 + i * 4) * 60 * 1000),
      submittedAt: new Date(now.getTime() - (25 + i * 4) * 60 * 1000),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      durationSec: 400 + i * 35,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 7.4 Class 2 - Assignment 3 (TypeScript) -> 10 students
  const c2Students = studentProfiles.slice(5, 15);
  const c2Scores = [100, 100, 80, 80, 60, 60, 60, 40, 40, 20];
  for (let i = 0; i < c2Students.length; i++) {
    const student = c2Students[i];
    const scorePct = c2Scores[i];
    const answers = generateAnswers(quiz1Questions, scorePct);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const totalPoints = quiz1Questions.reduce((acc, q) => acc + q.points, 0);
    const score = answers.reduce((acc, a) => acc + a.pointsEarned, 0);

    attemptsToInsert.push({
      _id: new Types.ObjectId(),
      organizationId: orgId,
      userId: student.id,
      quizId: quizDefs[0].id,
      quizVersion: 2,
      assignmentId: assignmentDefs[2].id,
      questionOrder: quiz1Questions.map((q) => q._id),
      status: i === 9 ? 'force_submitted' : 'submitted',
      score,
      totalPoints,
      correctCount,
      wrongCount,
      answers,
      violations:
        i === 4
          ? [{ type: 'tab_switch', occurredAt: new Date(now.getTime() - 30 * 60 * 1000) }]
          : [],
      startedAt: new Date(now.getTime() - (60 + i * 3) * 60 * 1000),
      submittedAt: new Date(now.getTime() - (30 + i * 3) * 60 * 1000),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      durationSec: 380 + i * 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 7.5 Class 3 - Assignment 4 (MongoDB Aggregation - Closed Exam) -> 8 students
  const c3Students = studentProfiles.slice(12, 20);
  const c3Scores = [100, 80, 80, 60, 60, 40, 40, 20];
  for (let i = 0; i < c3Students.length; i++) {
    const student = c3Students[i];
    const scorePct = c3Scores[i];
    const answers = generateAnswers(quiz3Questions, scorePct);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const totalPoints = quiz3Questions.reduce((acc, q) => acc + q.points, 0);
    const score = answers.reduce((acc, a) => acc + a.pointsEarned, 0);

    attemptsToInsert.push({
      _id: new Types.ObjectId(),
      organizationId: orgId,
      userId: student.id,
      quizId: quizDefs[2].id,
      quizVersion: 1,
      assignmentId: assignmentDefs[3].id,
      questionOrder: quiz3Questions.map((q) => q._id),
      status: 'submitted',
      score,
      totalPoints,
      correctCount,
      wrongCount,
      answers,
      violations: [],
      startedAt: new Date(pastThreeDays.getTime() - i * 60 * 60 * 1000),
      submittedAt: new Date(pastThreeDays.getTime() - i * 60 * 60 * 1000 + 450 * 1000),
      expiresAt: new Date(pastThreeDays.getTime() + 60 * 60 * 1000),
      durationSec: 450 + i * 25,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 7.6 Unlimited Practice Mode Attempts in Class 1 -> 5 students
  const practiceStudents = studentProfiles.slice(0, 5);
  for (let i = 0; i < practiceStudents.length; i++) {
    const student = practiceStudents[i];
    const answers = generateAnswers(quiz3Questions, 80);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const totalPoints = quiz3Questions.reduce((acc, q) => acc + q.points, 0);
    const score = answers.reduce((acc, a) => acc + a.pointsEarned, 0);

    attemptsToInsert.push({
      _id: new Types.ObjectId(),
      organizationId: orgId,
      userId: student.id,
      quizId: quizDefs[2].id,
      quizVersion: 1,
      assignmentId: assignmentDefs[4].id,
      questionOrder: quiz3Questions.map((q) => q._id),
      status: 'submitted',
      score,
      totalPoints,
      correctCount,
      wrongCount,
      answers,
      violations: [],
      startedAt: new Date(now.getTime() - (120 + i * 15) * 60 * 1000),
      submittedAt: new Date(now.getTime() - (95 + i * 15) * 60 * 1000),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      durationSec: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await attemptsCol.insertMany(attemptsToInsert);
  console.log(
    `🎯 Seeded ${attemptsToInsert.length} Exam Attempts (3 Practice attempts for Teacher + 41 Student attempts)`,
  );

  // ==========================================
  // 8. Seed Audit Logs (12 realistic actions)
  // ==========================================
  await auditLogsCol.deleteMany({ orgId });
  const auditActions = [
    {
      action: 'organization.created',
      method: 'POST',
      path: '/api/v1/organizations',
      statusCode: 201,
    },
    { action: 'quiz.create', method: 'POST', path: '/api/v1/quizzes', statusCode: 201 },
    {
      action: 'quiz.publish',
      method: 'POST',
      path: '/api/v1/quizzes/66e200000000000000000001/publish',
      statusCode: 200,
    },
    {
      action: 'quiz.update',
      method: 'PUT',
      path: '/api/v1/quizzes/66e200000000000000000001',
      statusCode: 200,
    },
    { action: 'class.create', method: 'POST', path: '/api/v1/classes', statusCode: 201 },
    {
      action: 'class.assignment.create',
      method: 'POST',
      path: '/api/v1/classes/66e100000000000000000001/assignments',
      statusCode: 201,
    },
    {
      action: 'exam_attempt.start',
      method: 'POST',
      path: '/api/v1/exam-attempts/start',
      statusCode: 200,
    },
    {
      action: 'exam_attempt.submit',
      method: 'POST',
      path: '/api/v1/exam-attempts/submit',
      statusCode: 200,
    },
    {
      action: 'class.member.approve',
      method: 'POST',
      path: '/api/v1/classes/66e100000000000000000004/approve',
      statusCode: 200,
    },
    {
      action: 'subscription.upgrade',
      method: 'POST',
      path: '/api/v1/subscriptions/upgrade',
      statusCode: 200,
    },
  ];

  const auditDocs = auditActions.map((item, idx) => ({
    _id: new Types.ObjectId(),
    action: item.action,
    resourceType: item.action.split('.')[0],
    resourceId: String(new Types.ObjectId()),
    userId: teacherId,
    orgId,
    method: item.method,
    path: item.path,
    durationMs: 40 + idx * 8,
    statusCode: item.statusCode,
    metadata: { note: 'Auto-generated seed audit log' },
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    traceId: `trace_${Date.now()}_${idx}`,
    timestamp: new Date(Date.now() - (10 - idx) * 3600 * 1000),
  }));

  await auditLogsCol.insertMany(auditDocs);
  console.log(`🛡️ Seeded ${auditDocs.length} Audit Trail logs`);

  // ==========================================
  // 9. Seed Active Pro Subscription & VietQR Payments
  // ==========================================
  await subsCol.updateOne(
    { organizationId: orgId },
    {
      $set: {
        plan: 'pro',
        status: 'active',
        currentPeriodStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  await paymentsCol.deleteMany({ organizationId: orgId });
  await paymentsCol.insertMany([
    {
      _id: new Types.ObjectId(),
      transactionId: 'VTI_TXN_982341',
      organizationId: orgId,
      gateway: 'sepay',
      amount: 199000,
      targetPlan: 'pro',
      status: 'success',
      refundStatus: 'none',
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      _id: new Types.ObjectId(),
      transactionId: 'VTI_TXN_982342',
      organizationId: orgId,
      gateway: 'sepay',
      amount: 199000,
      targetPlan: 'pro',
      status: 'success',
      refundStatus: 'none',
      createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log(`💳 Seeded Subscription (Pro Plan) and VietQR Transaction History`);

  console.log('✨ ALL SEED DATA GENERATED AND COMMITTED TO MONGODB SUCCESSFULLY!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
