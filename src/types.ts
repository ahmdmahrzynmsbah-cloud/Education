export interface PlatformSettings {
  platformName: string;
  logoChar: string;
  logoUrl?: string; // NEW!
  heroTitle: string;
  heroSubtitle: string;
  showGradesSection: boolean;
  showSubjectsSection: boolean;
  showFeaturesSection: boolean;
  showFaqSection: boolean;
  gradesTitle: string;
  gradesSubtitle: string;
  subjectsTitle: string;
  subjectsSubtitle: string;
  faqTitle: string;
  faqSubtitle: string;
  vodafoneCashNumber: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  email?: string;
  governorate?: string;
  school?: string;
  grade?: string;
  parentPhone?: string;
  subject?: string;
  nationalId?: string;
  dateOfBirth?: string;
  teachingGrades?: string[];
  studentPhone?: string;
  balance?: number;
  createdAt?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  grade: string;
  subject: string;
  price: number;
  teacherId: string;
  teacherName: string;
  imageUrl: string;
  createdAt: string;
  views?: number;
  enrolledStudents: number;
  enrolledStudentIds?: string[];
  suspendedStudentIds?: string[];
  lessonsCount: number;
  isActive?: boolean;
  status?: 'published' | 'draft' | 'under_review';
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  bunnyVideoId?: string;
  order: number;
  createdAt: string;
  views?: number;
  durationInSeconds?: number;
}

export interface Lecture {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  isUnlocked: boolean;
  videoUrl?: string;
}

export interface Code {
  id: string;
  code: string;
  isActive: boolean;
  assignedTo?: string;
  expiresAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  views?: number;
  type: 'enrollment' | 'system' | 'live_stream';
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  teacherRating?: number;
  contentRating?: number;
  comment: string;
  createdAt: string;
  isPrivate?: boolean;
  likesCount?: number;
  likedUserIds?: string[];
  replies?: {
    id: string;
    userId: string;
    userName: string;
    userRole?: string;
    comment: string;
    createdAt: string;
  }[];
}

export interface LessonNote {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  content: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  description?: string;
  questions: Question[];
  timeLimit?: number; // in minutes (0 or undefined for no limit)
  createdBy: string;
  createdAt: string;
  isHidden?: boolean;
}

export interface QuizSubmission {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  courseId: string;
  lessonId: string;
  score: number; // percentage or points
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  submittedAt: string;
  passed: boolean;
  infractionsCount?: number;
  cheatedViolation?: boolean;
}

export interface QuickNote {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  focusMinutes: number;
  createdAt: string;
}

export interface LiveMaterial {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'image' | 'other';
  uploadedAt: string;
}

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  status: 'scheduled' | 'live' | 'ended';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  viewerCount: number;
  whiteboardData?: string; // Base64 or serialized stroke data for real-time sync
  pinnedMessage?: LiveChatMessage | null;
  materials?: LiveMaterial[];
  isScreenSharing?: boolean;
  sharedScreenType?: 'presentation' | 'code' | 'whiteboard';
  isWhiteboardActive?: boolean;
  activeSlideIndex?: number;
  voiceBroadcastText?: string;
  voiceBroadcastTime?: string;
  recordedUrl?: string;
  recordingSummary?: string;
}

export interface LiveChatMessage {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
}

export interface LivePoll {
  id: string;
  streamId: string;
  question: string;
  options: string[];
  votes: Record<string, number>; // e.g. "0": 10, "1": 15
  votedUserIds?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface LiveHandRaise {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  message?: string;
  createdAt: string;
  resolved: boolean;
}

