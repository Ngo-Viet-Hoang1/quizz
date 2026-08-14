export type UserRole = 'Guest' | 'Participant' | 'Creator' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  isLocked?: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimitSeconds: number;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  questionCount: number;
  creatorName: string;
  creatorId: string;
  plays: number;
  rating: number;
  coverImage: string;
  questions: QuizQuestion[];
  isReported?: boolean;
  reportReason?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  creatorId: string;
  creatorName: string;
  quizId: string;
  quizTitle: string;
  participantsCount: number;
  status: 'Waiting' | 'In Progress' | 'Finished';
  participants: { id: string; name: string; avatar: string; score?: number }[];
}

export interface Exam {
  id: string;
  title: string;
  quizId: string;
  creatorId: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  maxAttempts: number;
  passPercentage: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  participantName: string;
  score: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: string;
}

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Nguyễn Văn A (Học viên)',
    email: 'student@example.com',
    password: '123456',
    role: 'Participant',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    isLocked: false,
  },
  {
    id: 'usr-2',
    name: 'Trần Thị B (Tác giả)',
    email: 'creator@example.com',
    password: '123456',
    role: 'Creator',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    isLocked: false,
  },
  {
    id: 'usr-3',
    name: 'Lê Minh C (Quản trị viên)',
    email: 'admin@quizapp.com',
    password: '123456',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    isLocked: false,
  },
  {
    id: 'usr-4',
    name: 'Phạm Đức D (Spammer)',
    email: 'spammer@example.com',
    password: '123456',
    role: 'Participant',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isLocked: true,
  },
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'qz-1',
    title: 'Kiến Thức Lập Trình Next.js & React 19',
    description:
      'Bộ câu hỏi trắc nghiệm chuyên sâu về Next.js App Router, React Server Components và State Management.',
    category: 'Lập trình',
    questionCount: 5,
    creatorName: 'Trần Thị B (Tác giả)',
    creatorId: 'usr-2',
    plays: 1420,
    rating: 4.9,
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600',
    createdAt: '2026-08-10',
    questions: [
      {
        id: 'q1',
        text: 'Thư mục mặc định chứa các trang trong Next.js App Router là gì?',
        options: ['pages/', 'src/app/', 'routes/', 'views/'],
        correctOptionIndex: 1,
        timeLimitSeconds: 30,
        points: 100,
      },
      {
        id: 'q2',
        text: 'React Component nào mặc định chạy trên Server trong App Router?',
        options: ['Client Component', 'Server Component', 'Hybrid Component', 'Static Component'],
        correctOptionIndex: 1,
        timeLimitSeconds: 20,
        points: 100,
      },
      {
        id: 'q3',
        text: 'Directive nào dùng để biến một component thành Client Component?',
        options: ["'use client'", "'use browser'", "'use react'", "'client side'"],
        correctOptionIndex: 0,
        timeLimitSeconds: 25,
        points: 100,
      },
      {
        id: 'q4',
        text: 'TanStack Query dùng để quản lý loại state nào?',
        options: ['UI State', 'Server State', 'Global Form State', 'Cookie State'],
        correctOptionIndex: 1,
        timeLimitSeconds: 20,
        points: 100,
      },
      {
        id: 'q5',
        text: 'Phương thức nào trong Next.js giúp revalidate dữ liệu?',
        options: ['revalidatePath()', 'refreshRoute()', 'reloadPage()', 'clearCache()'],
        correctOptionIndex: 0,
        timeLimitSeconds: 30,
        points: 100,
      },
    ],
  },
  {
    id: 'qz-2',
    title: 'Tiếng Anh Giao Tiếp Công Sở (B2 - C1)',
    description: 'Thử thách vốn từ vựng và cấu trúc ngữ pháp Tiếng Anh doanh nghiệp chuyên nghiệp.',
    category: 'Ngoại ngữ',
    questionCount: 4,
    creatorName: 'Nguyễn Văn A (Học viên)',
    creatorId: 'usr-1',
    plays: 890,
    rating: 4.8,
    coverImage: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600',
    createdAt: '2026-08-12',
    questions: [
      {
        id: 'q21',
        text: 'Choose the correct idiom: "Let us get down to ______."',
        options: ['work', 'business', 'action', 'talk'],
        correctOptionIndex: 1,
        timeLimitSeconds: 20,
        points: 100,
      },
      {
        id: 'q22',
        text: 'Meaning of "touch base":',
        options: ['Play baseball', 'Briefly contact someone', 'Base on facts', 'Touch the floor'],
        correctOptionIndex: 1,
        timeLimitSeconds: 20,
        points: 100,
      },
      {
        id: 'q23',
        text: 'Synonym of "feasible":',
        options: ['Impossible', 'Practicable / Doable', 'Difficult', 'Expensive'],
        correctOptionIndex: 1,
        timeLimitSeconds: 20,
        points: 100,
      },
      {
        id: 'q24',
        text: 'Complete: "I look forward to ______ from you."',
        options: ['hear', 'hearing', 'heard', 'be heard'],
        correctOptionIndex: 1,
        timeLimitSeconds: 15,
        points: 100,
      },
    ],
  },
  {
    id: 'qz-3',
    title: 'Đố Vui Lịch Sử & Văn Hóa Việt Nam',
    description:
      'Những câu hỏi đố vui kiến thức chung về văn hóa, lịch sử và danh lam thắng cảnh Việt Nam.',
    category: 'Văn hóa',
    questionCount: 3,
    creatorName: 'Trần Thị B (Tác giả)',
    creatorId: 'usr-2',
    plays: 2310,
    rating: 4.95,
    coverImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
    isReported: true,
    reportReason: 'Nội dung câu hỏi số 2 cần kiểm tra lại nguồn tham khảo',
    createdAt: '2026-08-01',
    questions: [
      {
        id: 'q31',
        text: 'Thành phố nào nổi tiếng với tên gọi "Thành phố sương mù"?',
        options: ['Sapa', 'Đà Lạt', 'Tam Đảo', 'Bà Nà'],
        correctOptionIndex: 1,
        timeLimitSeconds: 15,
        points: 100,
      },
      {
        id: 'q32',
        text: 'Triều đại nhà Trần trong lịch sử Việt Nam nổi tiếng với chiến công chống quân nào?',
        options: ['Quân Nguyên Mông', 'Quân Minh', 'Quân Thanh', 'Quân Nam Hán'],
        correctOptionIndex: 0,
        timeLimitSeconds: 20,
        points: 100,
      },
      {
        id: 'q33',
        text: 'Vịnh Hạ Long thuộc tỉnh nào của Việt Nam?',
        options: ['Hải Phòng', 'Quảng Ninh', 'Nam Định', 'Thái Bình'],
        correctOptionIndex: 1,
        timeLimitSeconds: 15,
        points: 100,
      },
    ],
  },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'rm-101',
    code: '884920',
    name: 'Phòng Thi Thử Lập Trình Frontend 2026',
    creatorId: 'usr-2',
    creatorName: 'Trần Thị B (Tác giả)',
    quizId: 'qz-1',
    quizTitle: 'Kiến Thức Lập Trình Next.js & React 19',
    participantsCount: 4,
    status: 'Waiting',
    participants: [
      {
        id: 'p1',
        name: 'Hoàng Nam',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      },
      {
        id: 'p2',
        name: 'Thanh Hà',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      },
      {
        id: 'p3',
        name: 'Minh Tuấn',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      },
      {
        id: 'p4',
        name: 'Ngọc Mai',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
      },
    ],
  },
  {
    id: 'rm-102',
    code: '120593',
    name: 'Thi Đố Vui Tiếng Anh Nhóm B2',
    creatorId: 'usr-1',
    creatorName: 'Nguyễn Văn A (Học viên)',
    quizId: 'qz-2',
    quizTitle: 'Tiếng Anh Giao Tiếp Công Sở (B2 - C1)',
    participantsCount: 2,
    status: 'In Progress',
    participants: [
      {
        id: 'p5',
        name: 'Đức Anh',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      },
      {
        id: 'p6',
        name: 'Quỳnh Trang',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      },
    ],
  },
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'ex-1',
    title: 'Bài Kiểm Tra Đánh Giá Năng Lực React/NextJS Q3-2026',
    quizId: 'qz-1',
    creatorId: 'usr-2',
    timeLimitMinutes: 15,
    totalQuestions: 5,
    maxAttempts: 2,
    passPercentage: 80,
  },
  {
    id: 'ex-2',
    title: 'Kiểm Tra Đầu Vào Tiếng Anh Thương Mại',
    quizId: 'qz-2',
    creatorId: 'usr-1',
    timeLimitMinutes: 10,
    totalQuestions: 4,
    maxAttempts: 1,
    passPercentage: 75,
  },
];

export const INITIAL_RESULTS: ExamResult[] = [
  {
    id: 'res-1',
    examId: 'ex-1',
    examTitle: 'Bài Kiểm Tra Đánh Giá Năng Lực React/NextJS Q3-2026',
    participantName: 'Nguyễn Văn A (Học viên)',
    score: 500,
    totalScore: 500,
    percentage: 100,
    passed: true,
    timeSpentSeconds: 145,
    completedAt: '2026-08-14 10:15',
  },
  {
    id: 'res-2',
    examId: 'ex-2',
    examTitle: 'Kiểm Tra Đầu Vào Tiếng Anh Thương Mại',
    participantName: 'Hoàng Nam',
    score: 300,
    totalScore: 400,
    percentage: 75,
    passed: true,
    timeSpentSeconds: 210,
    completedAt: '2026-08-14 11:30',
  },
];
