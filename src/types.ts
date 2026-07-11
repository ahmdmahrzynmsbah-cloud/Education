export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  governorate?: string;
  school?: string;
  grade?: string;
  parentPhone?: string;
  subject?: string;
  nationalId?: string;
  dateOfBirth?: string;
  teachingGrades?: string[];
  studentPhone?: string;
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
  enrolledStudents: number;
  lessonsCount: number;
  isActive?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  order: number;
  createdAt: string;
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
