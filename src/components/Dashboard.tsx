import React from "react";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, HelpCircle, Lock, BookOpen, Star, MessageCircleQuestion, CheckCircle, Ticket, LogOut, Trophy, Flame, Bell, Target, ArrowLeft, Video, Bot, Users, Activity, User as UserIcon, Wallet, ArrowUpRight, ArrowDownLeft, Smartphone, CreditCard, PiggyBank, RefreshCw, Send, Sparkles, Loader2, DollarSign, Check, History, Award, Edit2, Edit3, Save, X, Clock, Trash2, Plus , Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import AdminPanel from './AdminPanel';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, getDocs, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TeacherClasses from './TeacherClasses';
import TeacherAnalytics from "./TeacherAnalytics";
import StudentCourses from './StudentCourses';
import StudentBadges from './StudentBadges';
import FAQSection from "./FAQSection";
import ProfileSection from "./ProfileSection";
import SmartAssistant from './SmartAssistant';
import ComprehensiveExamBuilder from './ComprehensiveExamBuilder';
import StudentExamTaking from './StudentExamTaking';
import InteractiveSchedule from './InteractiveSchedule';
import LuxuriousLoader from './LuxuriousLoader';
import QuickNotes from './QuickNotes';
import LiveClassroom from './LiveClassroom';

const MOCK_TEACHER_STATS = [
  { id: 1, title: 'إجمالي الطلاب', value: '1,240', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 2, title: 'المشاهدات اليوم', value: '342', icon: Activity, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 3, title: 'الرصيد المتاح', value: '4,500 ج.م', icon: Ticket, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
];

const MOCK_PARENT_STATS = [
  { id: 1, title: 'مستوى الطالب', value: '85%', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 2, title: 'آخر الدرجات', value: '18/20', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 3, title: 'نسبة الحضور', value: '95%', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [activationStatus, setActivationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [code, setCode] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quizzes & Exams State
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuizReview, setSelectedQuizReview] = useState<any>(null);
  const [selectedSubmissionReview, setSelectedSubmissionReview] = useState<any>(null);
  const [quizzesFilter, setQuizzesFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [teacherSelectedQuiz, setTeacherSelectedQuiz] = useState<any>(null);

  // Comprehensive/General Standalone Exams States
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [continueLearningItem, setContinueLearningItem] = useState<any>(null);
  const [loadingContinueLearning, setLoadingContinueLearning] = useState(false);
  const [quizTabType, setQuizTabType] = useState<'lesson' | 'comprehensive'>('lesson');
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examTimeLimit, setExamTimeLimit] = useState(30);
  const [examCourseId, setExamCourseId] = useState('');
  const [examQuestions, setExamQuestions] = useState<any[]>([
    { id: 'q_1', text: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1, explanation: '' }
  ]);
  const [savingExam, setSavingExam] = useState(false);

  // Student taking comprehensive exam states
  const [activeTakingExam, setActiveTakingExam] = useState<any>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [examCurrentQuestionIdx, setExamCurrentQuestionIdx] = useState(0);
  const [examSelectedAnswers, setExamSelectedAnswers] = useState<Record<string, number>>({});
  const [examTimeLeft, setExamTimeLeft] = useState<number | null>(null); // in seconds
  const [submittingExam, setSubmittingExam] = useState(false);
  const [starsReloadTrigger, setStarsReloadTrigger] = useState(0);
  const [showExamResultModal, setShowExamResultModal] = useState(false);
  const [examResultSubmission, setExamResultSubmission] = useState<any>(null);
  const examTimerRef = React.useRef<any>(null);
  const examStartTimeRef = React.useRef<number>(0);

  // Wallet & Transactions States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [linkedStudent, setLinkedStudent] = useState<any>(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'vodafone' | 'instapay' | 'bank'>('vodafone');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(false);

  // Dynamic Teacher & Parent Stats States
  const [teacherStudentsCount, setTeacherStudentsCount] = useState(0);
  const [teacherViewsCount, setTeacherViewsCount] = useState(0);
  const [teacherCoursesCount, setTeacherCoursesCount] = useState(0);
  const [loadingTeacherStats, setLoadingTeacherStats] = useState(false);
  const [teacherChartData, setTeacherChartData] = useState<any[]>([]);
  const [teacherEnrollmentTrend, setTeacherEnrollmentTrend] = useState<any[]>([]);

  const [parentStats, setParentStats] = useState({
    level: '0%',
    coursesCount: 0,
    attendance: '0%'
  });
  const [loadingParentStats, setLoadingParentStats] = useState(false);

  // Stars / Points State
  const [starsCount, setStarsCount] = useState<number>(0);
  const [loadingStars, setLoadingStars] = useState(false);
  const [dashboardLeaderboard, setDashboardLeaderboard] = useState<any[]>([]);
  const [loadingDashboardLeaderboard, setLoadingDashboardLeaderboard] = useState(true);

  // Quick Notes Integration
  const [quickNotesCount, setQuickNotesCount] = useState(0);
  const [miniNoteContent, setMiniNoteContent] = useState('');
  const [miniNoteCourseId, setMiniNoteCourseId] = useState('general');
  const [savingMiniNote, setSavingMiniNote] = useState(false);
  const [subscribingLeague, setSubscribingLeague] = useState(false);

  useEffect(() => {
    if (!userData?.id || userData.role !== 'student') return;
    const q = query(collection(db, 'quick_notes'), where('userId', '==', userData.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuickNotesCount(snapshot.size);
    }, (err) => {
      console.warn("Failed to listen to quick notes count:", err);
    });
    return () => unsubscribe();
  }, [userData]);

  const handleMiniNoteSave = async () => {
    if (!miniNoteContent.trim()) {
      toast.error('الرجاء كتابة نص الملاحظة السريعة');
      return;
    }
    setSavingMiniNote(true);
    try {
      const selectedCourse = coursesList.find(c => c.id === miniNoteCourseId);
      const courseTitle = miniNoteCourseId === 'general' ? 'ملاحظات عامة' : (selectedCourse?.title || 'كورس دراسي');

      await addDoc(collection(db, 'quick_notes'), {
        userId: userData.id,
        content: miniNoteContent.trim(),
        courseId: miniNoteCourseId,
        courseTitle: courseTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('تم حفظ الملاحظة السريعة وتزامنها سحابياً! ✨');
      setMiniNoteContent('');
      setMiniNoteCourseId('general');
    } catch (err) {
      console.error("Error saving mini note:", err);
      toast.error("فشل في حفظ الملاحظة السريعة");
    } finally {
      setSavingMiniNote(false);
    }
  };

  const handleJoinLeague = async () => {
    if (!userData?.id) return;
    if (starsCount < 500) {
      toast.error('عذراً، رصيدك من النجوم غير كافٍ للاشتراك (تحتاج إلى 500 نجمة) 🌟');
      return;
    }

    setSubscribingLeague(true);
    try {
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, {
        leagueJoined: true
      });
      
      // Success toast notifications
      toast.success('تم خصم 500 نجمة بنجاح من رصيدك! 🌟');
      toast.success('مبارك! تم اشتراكك في دوري Teachland بنجاح وانضمامك للمنافسة! 🏆✨', {
        duration: 5000,
        icon: '🎉'
      });
      
      setUserData({ ...userData, leagueJoined: true });
    } catch (err) {
      console.error("Error joining league:", err);
      toast.error("فشل في الاشتراك بالدوري، يرجى المحاولة لاحقاً");
    } finally {
      setSubscribingLeague(false);
    }
  };

  const renderLeaderboardTable = () => (
    <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
               <Trophy className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
            </div>
            <div>
               <h3 className="text-lg font-black text-gray-900 dark:text-white">جدول الترتيب العام</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400">محدث بشكل فوري بناءً على نشاط الطلاب</p>
            </div>
         </div>
         <div className="text-left font-bold text-xs text-gray-500 dark:text-gray-400">
            {dashboardLeaderboard.length.toLocaleString('ar-EG')} منافس نشط
         </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
         {loadingDashboardLeaderboard ? (
            [1, 2, 3, 4].map((num) => (
               <div key={num} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-[#0D0D12]/50 animate-pulse">
                  <div className="flex items-center gap-4">
                     <div className="w-6 h-6 bg-gray-200 dark:bg-[#2D2D3D] rounded animate-pulse"></div>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-[#2D2D3D] rounded-full animate-pulse"></div>
                        <div className="w-32 h-4 bg-gray-200 dark:bg-[#2D2D3D] rounded animate-pulse"></div>
                     </div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 dark:bg-[#2D2D3D] rounded animate-pulse"></div>
               </div>
            ))
         ) : dashboardLeaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
               <Sparkles className="w-10 h-10 text-yellow-500 mx-auto mb-3 animate-pulse" />
               <p className="font-bold text-base text-gray-900 dark:text-white">كن أول من يتصدر دوري Teachland! 🏆</p>
               <p className="text-xs mt-1">ابدأ بدراسة كورساتك الآن وتجميع النقاط لتظهر هنا</p>
            </div>
         ) : (
            dashboardLeaderboard.map((student, index) => {
               const pos = index + 1;
               return (
                  <div 
                     key={student.id} 
                     className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01] ${
                        student.current 
                           ? 'bg-gradient-to-r from-[#00B4D8]/10 to-[#0077B6]/5 dark:from-[#D4AF37]/10 dark:to-[#B8860B]/5 border-2 border-[#00B4D8] dark:border-[#D4AF37] shadow-md' 
                           : 'bg-gray-50 dark:bg-[#0D0D12] border border-gray-100 dark:border-transparent'
                     }`}
                  >
                     <div className="flex items-center gap-4">
                        <span className={`font-black w-8 text-center text-sm ${student.current ? 'text-[#00B4D8] dark:text-[#D4AF37]' : 'text-gray-500 dark:text-gray-400'}`}>
                           {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`}
                        </span>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#0077B6] dark:text-[#D4AF37] rounded-full flex items-center justify-center font-black text-sm uppercase">
                              {student.name.charAt(0)}
                           </div>
                           <div>
                              <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                                 {student.name}
                                 {student.current && (
                                    <span className="text-[10px] bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-2 py-0.5 rounded-full font-black animate-pulse">أنت</span>
                                 )}
                              </span>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">طالب بالثانوية العامة</p>
                           </div>
                        </div>
                     </div>
                     <div className="font-black text-sm flex items-center gap-1.5 text-gray-900 dark:text-white">
                        <span className="text-[#0077B6] dark:text-[#D4AF37]">{(student.points || 0).toLocaleString('ar-EG')}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                     </div>
                  </div>
               );
            })
         )}
      </div>
    </div>
  );

    // Fetch Quizzes, Submissions and Courses
  useEffect(() => {
    const fetchQuizzesAndSubmissions = async () => {
      if (!userData?.id || (activeTab !== 'quizzes' && activeTab !== 'league')) return;
      setLoadingQuizzes(true);
      try {
        // Fetch courses to resolve course names
        const qCourses = userData.role === 'teacher'
          ? query(collection(db, 'courses'), where('teacherId', '==', userData.id))
          : query(collection(db, 'courses'));
        const courseSnap = await getDocs(qCourses);
        const fetchedCourses = courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoursesList(fetchedCourses);

        if (userData.role === 'student') {
          // 1. Fetch all quizzes
          const qQuiz = query(collection(db, 'quizzes'));
          const quizSnap = await getDocs(qQuiz);
          const allQuizzes = quizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // 2. Fetch submissions for this student
          const qSub = query(collection(db, 'quiz_submissions'), where('userId', '==', userData.id));
          const subSnap = await getDocs(qSub);
          const studentSubs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          setQuizzesList(allQuizzes);
          setSubmissionsList(studentSubs);
        } else if (userData.role === 'teacher') {
          // 1. Fetch quizzes created by this teacher
          const qQuiz = query(collection(db, 'quizzes'), where('createdBy', '==', userData.id));
          const quizSnap = await getDocs(qQuiz);
          const teacherQuizzes = quizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // 2. Fetch all submissions for those quizzes
          const qSub = query(collection(db, 'quiz_submissions'));
          const subSnap = await getDocs(qSub);
          const allSubs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          setQuizzesList(teacherQuizzes);
          setSubmissionsList(allSubs);
        } else if (userData.role === 'parent' && linkedStudent?.id) {
          // 1. Fetch submissions for the linked student
          const qSub = query(collection(db, 'quiz_submissions'), where('userId', '==', linkedStudent.id));
          const subSnap = await getDocs(qSub);
          const studentSubs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // 2. Fetch quizzes
          const qQuiz = query(collection(db, 'quizzes'));
          const quizSnap = await getDocs(qQuiz);
          const allQuizzes = quizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          setQuizzesList(allQuizzes);
          setSubmissionsList(studentSubs);
        }
      } catch (err) {
        console.error("Error fetching quizzes or submissions:", err);
        toast.error("فشل تحميل البيانات التفاعلية للاختبارات");
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchQuizzesAndSubmissions();
  }, [activeTab, userData, linkedStudent]);

  // Student Exam Timer useEffect
  useEffect(() => {
    if (examStarted && examTimeLeft !== null && examTimeLeft > 0) {
      examTimerRef.current = setInterval(() => {
        setExamTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(examTimerRef.current);
            setTimeout(() => {
              handleAutoSubmitExam();
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    };
  }, [examStarted, examTimeLeft]);

  // Auto submit when time is up
  const handleAutoSubmitExam = () => {
    toast.error('انتهى وقت الامتحان! سيتم تسليم إجاباتك الحالية تلقائياً.');
    handleSubmitExam();
  };

  // Submit standalone / comprehensive exam
  const handleSubmitExam = async (answersOverride?: Record<string, number>) => {
    if (!activeTakingExam || !userData) return;
    setSubmittingExam(true);
    
    try {
      const finalAnswers = answersOverride || examSelectedAnswers;
      const questionsList = activeTakingExam.questions || [];
      
      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;
      
      questionsList.forEach((q: any) => {
        const selected = finalAnswers[q.id];
        const pts = Number(q.points) || 1;
        totalPoints += pts;
        if (selected !== undefined && selected === q.correctOptionIndex) {
          correctCount += 1;
          earnedPoints += pts;
        }
      });
      
      const percentScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = percentScore >= 50;
      
      const submissionId = `${userData.id}_${activeTakingExam.id}`;
      const submissionData = {
        id: submissionId,
        userId: userData.id,
        userName: userData.name || 'طالب',
        quizId: activeTakingExam.id,
        courseId: activeTakingExam.courseId || '',
        lessonId: 'comprehensive', // mark as comprehensive
        score: percentScore,
        totalPoints,
        correctAnswers: correctCount,
        totalQuestions: questionsList.length,
        answers: finalAnswers,
        submittedAt: new Date().toISOString(),
        passed
      };
      
      await setDoc(doc(db, 'quiz_submissions', submissionId), submissionData);
      
      setSubmissionsList(prev => {
        const filtered = prev.filter(s => s.id !== submissionId);
        return [submissionData, ...filtered];
      });
      
      setStarsReloadTrigger(prev => prev + 1);
      
      setExamResultSubmission(submissionData);
      setShowExamResultModal(true);
      setExamStarted(false);
      setActiveTakingExam(null);
      toast.success('تم تسليم الامتحان بنجاح! 🎉');
    } catch (err) {
      console.error("Error submitting exam:", err);
      toast.error("فشل تسليم الامتحان، الرجاء المحاولة مرة أخرى.");
    } finally {
      setSubmittingExam(false);
    }
  };

  // Helper actions for standalone / comprehensive exam builder (Teacher)
  const handleAddExamQuestion = () => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setExamQuestions(prev => [
      ...prev,
      { id: newId, text: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1, explanation: '' }
    ]);
  };

  const handleRemoveExamQuestion = (index: number) => {
    if (examQuestions.length <= 1) {
      toast.error('يجب أن يحتوي الامتحان على سؤال واحد على الأقل.');
      return;
    }
    setExamQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExamQuestionField = (index: number, field: string, value: any) => {
    setExamQuestions(prev => prev.map((q, i) => {
      if (i === index) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleUpdateExamQuestionOption = (qIndex: number, optIndex: number, value: string) => {
    setExamQuestions(prev => prev.map((q, i) => {
      if (i === qIndex) {
        const newOpts = [...q.options];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleSaveExamByTeacher = async () => {
    if (!examTitle.trim()) {
      toast.error('يرجى إدخال عنوان الامتحان الشامل.');
      return;
    }
    
    for (let i = 0; i < examQuestions.length; i++) {
      const q = examQuestions[i];
      if (!q.text.trim()) {
        toast.error(`يرجى كتابة نص السؤال رقم ${i + 1}`);
        return;
      }
      for (let o = 0; o < q.options.length; o++) {
        if (!q.options[o].trim()) {
          toast.error(`يرجى كتابة الخيار رقم ${o + 1} للسؤال رقم ${i + 1}`);
          return;
        }
      }
    }
    
    setSavingExam(true);
    try {
      const examId = editingExamId || `comprehensive_${Date.now()}`;
      const examData = {
        id: examId,
        title: examTitle.trim(),
        description: examDesc.trim(),
        timeLimit: Number(examTimeLimit) || 0,
        courseId: examCourseId || 'all',
        questions: examQuestions,
        isComprehensive: true,
        createdBy: userData.id,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'quizzes', examId), examData);
      
      setQuizzesList(prev => {
        const filtered = prev.filter(q => q.id !== examId);
        return [examData, ...filtered];
      });
      
      toast.success(editingExamId ? 'تم تعديل الامتحان الشامل بنجاح! ✏️' : 'تم إنشاء وتفعيل الامتحان الشامل بنجاح! 🎉');
      setIsCreatingExam(false);
      setEditingExamId(null);
      // Reset fields
      setExamTitle('');
      setExamDesc('');
      setExamTimeLimit(30);
      setExamCourseId('');
      setExamQuestions([
        { id: 'q_1', text: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1, explanation: '' }
      ]);
    } catch (err) {
      console.error("Error saving exam:", err);
      toast.error("فشل حفظ الامتحان الشامل، يرجى المحاولة مرة أخرى.");
    } finally {
      setSavingExam(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الامتحان الشامل نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'quizzes', examId));
      setQuizzesList(prev => prev.filter(q => q.id !== examId));
      if (teacherSelectedQuiz?.id === examId) {
        setTeacherSelectedQuiz(null);
      }
      toast.success('تم حذف الامتحان الشامل بنجاح.');
    } catch (err) {
      console.error("Error deleting exam:", err);
      toast.error("فشل حذف الامتحان.");
    }
  };

  // Fetch and calculate stars dynamically based on user activity
  useEffect(() => {
    const fetchStars = async () => {
      if (!userData?.id) return;
      setLoadingStars(true);
      try {
        if (userData.role === 'student') {
          // 1. Enrolled courses (200 points each)
          const qCourses = query(
            collection(db, 'courses'),
            where('enrolledStudentIds', 'array-contains', userData.id)
          );
          const snapshotCourses = await getDocs(qCourses);
          const enrolledCount = snapshotCourses.size;

          // 2. Course Progress interactions (150 points each)
          const qProgress = query(
            collection(db, 'course_progress'),
            where('userId', '==', userData.id)
          );
          const snapshotProgress = await getDocs(qProgress);
          const progressCount = snapshotProgress.size;

          // 3. Exam Submissions points (Comprehensive/League exams)
          const qSubmissions = query(
            collection(db, 'quiz_submissions'),
            where('userId', '==', userData.id),
            where('lessonId', '==', 'comprehensive')
          );
          const snapshotSubmissions = await getDocs(qSubmissions);
          let examPoints = 0;
          snapshotSubmissions.forEach(doc => {
            const subData = doc.data();
            const score = Number(subData.score) || 0;
            // Reward 3 points per 1% score (max 300 points per exam)
            examPoints += Math.round(score * 3);
          });

          // Stars = (Enrolled * 200) + (Progress * 150) + ExamPoints + 500 (Base/Welcome gift) - 500 if joined league
          const totalStars = (enrolledCount * 200) + (progressCount * 150) + examPoints + 500 - (userData?.leagueJoined ? 500 : 0);
          setStarsCount(totalStars);
          try {
            await updateDoc(doc(db, 'users', userData.id), { points: totalStars });
          } catch (e) {
            console.warn("Failed to update student points in background:", e);
          }
        } else if (userData.role === 'parent' && linkedStudent?.id) {
          // Parent views the linked student's stars
          const qCourses = query(
            collection(db, 'courses'),
            where('enrolledStudentIds', 'array-contains', linkedStudent.id)
          );
          const snapshotCourses = await getDocs(qCourses);
          const enrolledCount = snapshotCourses.size;

          const qProgress = query(
            collection(db, 'course_progress'),
            where('userId', '==', linkedStudent.id)
          );
          const snapshotProgress = await getDocs(qProgress);
          const progressCount = snapshotProgress.size;

          // Exam Submissions points for linked student
          const qSubmissions = query(
            collection(db, 'quiz_submissions'),
            where('userId', '==', linkedStudent.id),
            where('lessonId', '==', 'comprehensive')
          );
          const snapshotSubmissions = await getDocs(qSubmissions);
          let examPoints = 0;
          snapshotSubmissions.forEach(doc => {
            const subData = doc.data();
            const score = Number(subData.score) || 0;
            examPoints += Math.round(score * 3);
          });

          const totalStars = (enrolledCount * 200) + (progressCount * 150) + examPoints + 500 - (linkedStudent?.leagueJoined ? 500 : 0);
          setStarsCount(totalStars);
        } else if (userData.role === 'teacher') {
          // Teacher reputation stars = Enrolled students across all their courses * 100 + coursesCount * 300 + 1000 base
          const qCourses = query(
            collection(db, 'courses'),
            where('teacherId', '==', userData.id)
          );
          const snapshotCourses = await getDocs(qCourses);
          const fetchedCourses = snapshotCourses.docs.map(doc => doc.data());
          const totalEnrolled = fetchedCourses.reduce((acc, course) => acc + (course.enrolledStudents || 0), 0);
          const coursesCount = fetchedCourses.length;

          const totalStars = (totalEnrolled * 100) + (coursesCount * 300) + 1000;
          setStarsCount(totalStars);
          try {
            await updateDoc(doc(db, 'users', userData.id), { points: totalStars });
          } catch (e) {
            console.warn("Failed to update teacher points in background:", e);
          }
        }
      } catch (err) {
        console.error("Error calculating dynamic stars:", err);
      } finally {
        setLoadingStars(false);
      }
    };

    fetchStars();
  }, [userData, linkedStudent, starsReloadTrigger]);

  // Fetch real and precise Continue Learning item for Student
  useEffect(() => {
    if (!userData || userData.role !== 'student') return;

    const fetchContinueLearning = async () => {
      setLoadingContinueLearning(true);
      try {
        // Query course progress
        const qProgress = query(
          collection(db, 'course_progress'),
          where('userId', '==', userData.id)
        );
        const progressSnap = await getDocs(qProgress);
        let progressDocs: any[] = [];
        progressSnap.forEach(doc => {
          progressDocs.push({ id: doc.id, ...doc.data() });
        });

        // Sort by lastWatchedAt desc
        progressDocs.sort((a, b) => {
          const dateA = a.lastWatchedAt ? new Date(a.lastWatchedAt).getTime() : 0;
          const dateB = b.lastWatchedAt ? new Date(b.lastWatchedAt).getTime() : 0;
          return dateB - dateA;
        });

        let targetProgress = progressDocs[0];
        let targetCourseId = targetProgress?.courseId;
        let targetLessonId = targetProgress?.lastWatchedLessonId;

        // If no progress docs exist, try to find a course they are enrolled in and suggest starting it!
        if (!targetProgress) {
          const qEnrolled = query(
            collection(db, 'courses'),
            where('enrolledStudentIds', 'array-contains', userData.id)
          );
          const enrolledSnap = await getDocs(qEnrolled);
          if (!enrolledSnap.empty) {
            const firstCourseDoc = enrolledSnap.docs[0];
            targetCourseId = firstCourseDoc.id;
          }
        }

        if (targetCourseId) {
          // Fetch Course details
          const courseDoc = await getDoc(doc(db, 'courses', targetCourseId));
          if (courseDoc.exists()) {
            const courseData = courseDoc.data();
            
            // Fetch Lessons of this course
            const qLessons = query(
              collection(db, 'lessons'),
              where('courseId', '==', targetCourseId)
            );
            const lessonsSnap = await getDocs(qLessons);
            let lessonsList: any[] = [];
            lessonsSnap.forEach(ldoc => {
              lessonsList.push({ id: ldoc.id, ...ldoc.data() });
            });
            lessonsList.sort((a, b) => (a.order || 0) - (b.order || 0));

            if (lessonsList.length > 0) {
              // Find matching lesson
              let matchingLesson = targetLessonId 
                ? lessonsList.find(l => l.id === targetLessonId) 
                : lessonsList[0];
              
              if (!matchingLesson) {
                matchingLesson = lessonsList[0];
              }

              // Get progress of matching lesson
              let percent = 0;
              let timeRemainingText = "ابدأ التعلم الآن";
              
              if (targetProgress && targetProgress.lessonProgress && targetProgress.lessonProgress[matchingLesson.id]) {
                const prog = targetProgress.lessonProgress[matchingLesson.id];
                percent = prog.percent || 0;
                const secondsLeft = (prog.duration || 0) - (prog.currentTime || 0);
                if (percent >= 98) {
                  timeRemainingText = "تم إكمال الدرس بنجاح 🌟";
                } else if (secondsLeft <= 60) {
                  timeRemainingText = "متبقي أقل من دقيقة واحدة";
                } else {
                  timeRemainingText = `متبقي ${Math.round(secondsLeft / 60)} دقائق`;
                }
              }

              setContinueLearningItem({
                courseId: targetCourseId,
                courseTitle: courseData.title,
                courseSubject: courseData.subject || "عام",
                lessonId: matchingLesson.id,
                lessonTitle: matchingLesson.title,
                lessonOrder: matchingLesson.order || 1,
                percent: percent,
                timeRemainingText: timeRemainingText,
                videoUrl: matchingLesson.videoUrl || ""
              });
              setLoadingContinueLearning(false);
              return;
            }
          }
        }

        setContinueLearningItem(null);
      } catch (error) {
        console.error("Error fetching continue learning data:", error);
        setContinueLearningItem(null);
      } finally {
        setLoadingContinueLearning(false);
      }
    };

    fetchContinueLearning();
  }, [userData]);

  // Fetch dynamic stats for teachers
  useEffect(() => {
    if (userData?.role === 'teacher' && userData?.id) {
      const fetchTeacherStats = async () => {
        setLoadingTeacherStats(true);
        try {
          const qCourses = query(collection(db, 'courses'), where('teacherId', '==', userData.id));
          const snapshotCourses = await getDocs(qCourses);
          const fetchedCourses = snapshotCourses.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          setTeacherCoursesCount(fetchedCourses.length);
          
          const totalEnrolled = fetchedCourses.reduce((acc, course) => acc + (course.enrolledStudents || 0), 0);
          setTeacherStudentsCount(totalEnrolled);

          let totalViews = 0;
          const coursesChartData: any[] = [];
          for (const course of fetchedCourses) {
            const qLessons = query(collection(db, 'lessons'), where('courseId', '==', course.id));
            const snapshotLessons = await getDocs(qLessons);
            let views = 0;
            snapshotLessons.forEach(lessonDoc => {
              views += (lessonDoc.data().views || 0);
            });
            totalViews += views;

            coursesChartData.push({
              name: course.title || 'كورس غير مسمى',
              students: course.enrolledStudents || 0,
              views: views
            });
          }
          setTeacherViewsCount(totalViews);
          setTeacherChartData(coursesChartData);

          // Fetch enrollment notifications to build the trend
          const qNotifs = query(
            collection(db, 'notifications'),
            where('userId', '==', userData.id),
            where('type', '==', 'enrollment')
          );
          const snapshotNotifs = await getDocs(qNotifs);
          
          // Let's group notifications by day
          const enrollmentsByDay: { [key: string]: number } = {};
          
          // Pre-populate last 7 days with 0 to make a nice chart even if empty
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
            enrollmentsByDay[dateStr] = 0;
          }

          snapshotNotifs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.createdAt) {
              const dateStr = new Date(data.createdAt).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
              if (enrollmentsByDay[dateStr] !== undefined) {
                enrollmentsByDay[dateStr] += 1;
              } else {
                enrollmentsByDay[dateStr] = 1;
              }
            }
          });

          // Convert to chart format
          const trendData = Object.keys(enrollmentsByDay).map(date => ({
            date,
            'الاشتراكات': enrollmentsByDay[date]
          }));
          setTeacherEnrollmentTrend(trendData);

        } catch (err) {
          console.error("Error fetching teacher stats:", err);
        } finally {
          setLoadingTeacherStats(false);
        }
      };
      fetchTeacherStats();
    }
  }, [userData]);

  // Fetch dynamic stats for parents
  useEffect(() => {
    if (userData?.role === 'parent' && linkedStudent?.id) {
      const fetchParentStats = async () => {
        setLoadingParentStats(true);
        try {
          const qCourses = query(
            collection(db, 'courses'),
            where('enrolledStudentIds', 'array-contains', linkedStudent.id)
          );
          const snapshotCourses = await getDocs(qCourses);
          const enrolledCount = snapshotCourses.size;

          const qProgress = query(
            collection(db, 'course_progress'),
            where('userId', '==', linkedStudent.id)
          );
          const snapshotProgress = await getDocs(qProgress);
          const progressCount = snapshotProgress.size;

          const levelVal = enrolledCount > 0 
            ? Math.min(100, Math.round((progressCount / enrolledCount) * 100)) 
            : 0;

          let attendanceVal = 0;
          if (progressCount > 0) {
            attendanceVal = Math.min(100, 85 + progressCount * 3);
          } else if (enrolledCount > 0) {
            attendanceVal = 50;
          }

          setParentStats({
            level: `${levelVal}%`,
            coursesCount: enrolledCount,
            attendance: `${attendanceVal}%`
          });
        } catch (err) {
          console.error("Error fetching parent stats:", err);
        } finally {
          setLoadingParentStats(false);
        }
      };
      fetchParentStats();
    } else {
      setParentStats({
        level: '0%',
        coursesCount: 0,
        attendance: '0%'
      });
    }
  }, [userData, linkedStudent]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch transactions list
  const fetchTransactions = async () => {
    if (!userData?.id) return;
    setLoadingTransactions(true);
    try {
      const targetUserId = (userData.role === 'parent' && linkedStudent) ? linkedStudent.id : userData.id;
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", targetUserId)
      );
      const querySnapshot = await getDocs(q);
      const txs: any[] = [];
      querySnapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() });
      });
      // Sort locally to prevent composite index errors
      txs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setTransactions(txs);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch linked student if role is parent
  useEffect(() => {
    if (userData?.role === 'parent' && userData?.studentPhone) {
      const fetchStudent = async () => {
        try {
          const q = query(collection(db, 'users'), where('phone', '==', userData.studentPhone), where('role', '==', 'student'));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const studentDoc = querySnapshot.docs[0];
            setLinkedStudent({ id: studentDoc.id, ...studentDoc.data() });
          } else {
            setLinkedStudent(null);
          }
        } catch (err) {
          console.error("Error fetching linked student:", err);
        }
      };
      fetchStudent();
    } else {
      setLinkedStudent(null);
    }
  }, [userData]);

  // Re-fetch transactions on tab change or user data / linked student change
  useEffect(() => {
    if (activeTab === 'wallet' && userData?.id) {
      fetchTransactions();
    }
  }, [activeTab, userData, linkedStudent]);

  const handleActivate = async (e: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const codeToUse = (customCode || code).trim().toUpperCase();
    if (!codeToUse || !userData?.id) return;

    setActivationStatus('idle');
    try {
      // Determine charge amount based on the code entered
      let amount = 0;
      if (codeToUse === 'TF-1234-5678-9012') {
        amount = 150;
      } else if (codeToUse === 'TF-100-2026') {
        amount = 100;
      } else if (codeToUse === 'TF-200-2026') {
        amount = 200;
      } else if (codeToUse === 'TF-500-2026') {
        amount = 500;
      } else {
        // Support any generic code pattern TF-[amount]-XXXX where amount is a number
        const parts = codeToUse.split('-');
        if (parts.length >= 2 && parts[0] === 'TF') {
          const parsedVal = Number(parts[1]);
          if (!isNaN(parsedVal) && parsedVal > 0 && parsedVal <= 1000) {
            amount = parsedVal;
          }
        }
      }

      if (amount <= 0) {
        setActivationStatus('error');
        toast.error('الكود غير صحيح أو منتهي الصلاحية');
        return;
      }

      const isParent = userData.role === 'parent';
      const targetUser = isParent ? linkedStudent : userData;

      if (isParent && !linkedStudent) {
        toast.error('يرجى ربط حساب الطالب أولاً لتتمكن من الشحن له');
        return;
      }

      // Check if code was already used by this user
      const usedCheckQ = query(
        collection(db, "transactions"),
        where("userId", "==", targetUser.id),
        where("codeUsed", "==", codeToUse)
      );
      const usedCheckSnap = await getDocs(usedCheckQ);
      if (!usedCheckSnap.empty) {
        setActivationStatus('error');
        toast.error('عذراً، هذا الكود تم استخدامه مسبقاً!');
        return;
      }

      const targetRef = doc(db, "users", targetUser.id);
      const targetSnap = await getDoc(targetRef);
      const currentBalance = targetSnap.exists() ? (Number(targetSnap.data()?.balance) || 0) : 0;
      const newBalance = currentBalance + amount;

      // Update balance in Firestore
      await updateDoc(targetRef, {
        balance: newBalance
      });

      // Record transaction
      await addDoc(collection(db, "transactions"), {
        userId: targetUser.id,
        chargedBy: userData.id,
        type: "charge",
        amount: amount,
        codeUsed: codeToUse,
        description: `شحن رصيد عبر الكود ${codeToUse}` + (isParent ? ` (بواسطة ولي الأمر)` : ''),
        createdAt: new Date().toISOString()
      });

      // Update local states
      if (isParent) {
        setLinkedStudent({ ...linkedStudent, balance: newBalance });
      } else {
        setUserData({ ...userData, balance: newBalance });
      }

      setActivationStatus('success');
      setCode('');
      toast.success(`تم شحن رصيد بقيمة ${amount} ج.م بنجاح! 🎉`);

      // Refresh transactions list
      fetchTransactions();
    } catch (err) {
      console.error("Error activating code:", err);
      setActivationStatus('error');
      toast.error('حدث خطأ أثناء الشحن، يرجى المحاولة لاحقاً');
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.id || !payoutAmount) return;

    const amount = Number(payoutAmount);
    const currentBalance = Number(userData.balance) || 0;

    if (isNaN(amount) || amount <= 0) {
      toast.error('يرجى إدخال مبلغ سحب صحيح');
      return;
    }

    if (amount > currentBalance) {
      toast.error('عذراً، المبلغ المطلوب أكبر من رصيدك المتاح!');
      return;
    }

    if (!payoutDetails.trim()) {
      toast.error('يرجى إدخال تفاصيل وسيلة السحب');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const newBalance = currentBalance - amount;

      // Update teacher balance in Firestore
      await updateDoc(doc(db, "users", userData.id), {
        balance: newBalance
      });

      const methodNames = {
        vodafone: 'فودافون كاش',
        instapay: 'إنستاباي (InstaPay)',
        bank: 'تحويل بنكي'
      };

      // Add payout transaction
      await addDoc(collection(db, "transactions"), {
        userId: userData.id,
        type: "payout",
        amount: -amount,
        status: "pending",
        method: payoutMethod,
        payoutDetails: payoutDetails,
        description: `طلب سحب أرباح عبر ${methodNames[payoutMethod]} (${payoutDetails})`,
        createdAt: new Date().toISOString()
      });

      // Update local state
      setUserData({ ...userData, balance: newBalance });
      setPayoutAmount('');
      setPayoutDetails('');
      setShowPayoutForm(false);
      toast.success('تم تقديم طلب سحب الأرباح بنجاح! جاري معالجة المعاملة 💸');

      // Refresh transactions
      fetchTransactions();
    } catch (err) {
      console.error("Error submitting payout:", err);
      toast.error('حدث خطأ أثناء تقديم الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  useEffect(() => {
    if (!userData?.id) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userData.id)
    );
    let isInitialLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      // Sort locally to prevent composite index errors
      notifs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setNotifications(notifs);
      if (!isInitialLoad) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (data.type === "enrollment") {
               toast.success(`${data.title}\n${data.message}`, {
                 icon: '🎉',
                 style: {
                   borderRadius: '10px',
                   background: '#1A1A24',
                   color: '#fff',
                 },
               });
            } else if (data.type === "league_exam_alert") {
               toast.error(`${data.title}\n${data.message}`, {
                 icon: '⏰',
                 duration: 10000,
                 style: {
                   borderRadius: '16px',
                   background: '#1A1A24',
                   color: '#fff',
                   border: '1px solid #D4AF37'
                 },
               });
            }
          }
        });
      }
      isInitialLoad = false;
    });
    return () => unsubscribe();
  }, [userData]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return <LuxuriousLoader fullScreen size="lg" />;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white flex flex-col md:flex-row font-sans selection:bg-primary/30 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-[#1A1A24] border-l border-gray-200 dark:border-[#2D2D3D] flex flex-col shrink-0 shadow-sm z-10 hidden md:flex h-full overflow-hidden">
        <div className="h-20 border-b border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                T
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent select-none inline-block py-1 px-0.5 leading-normal">Teachland</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
          {(userData?.role === 'admin' ? [
            { id: 'home', label: 'الرئيسية', icon: Target },
            { id: 'admin', label: 'لوحة الإدارة', icon: Shield },
            { id: 'analytics', label: 'التقارير والإحصائيات', icon: Flame },
            { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
          ] : userData?.role === 'teacher' ? [
            { id: 'home', label: 'الرئيسية', icon: Target },
            { id: 'classes', label: 'فصولي', icon: Users },
            { id: 'quizzes', label: 'الاختبارات', icon: Award },
            { id: 'schedule', label: 'الجدول الدراسي', icon: Clock },
            { id: 'live', label: 'حصص لايف', icon: Video },
            { id: 'analytics', label: 'التقارير', icon: Flame },
            { id: 'wallet', label: 'المحفظة', icon: Ticket },
            { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
          ] : userData?.role === 'parent' ? [
            { id: 'home', label: 'الرئيسية', icon: Target },
            { id: 'quizzes', label: 'اختبارات الطالب', icon: Award },
            { id: 'schedule', label: 'الجدول الدراسي', icon: Clock },
            { id: 'reports', label: 'تقارير الطالب', icon: Flame },
            { id: 'wallet', label: 'محفظة الطالب', icon: Ticket },
            { id: 'messages', label: 'تواصل مع المعلمين', icon: Users },
            { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
          ] : [
            { id: 'home', label: 'الرئيسية', icon: Target },
            { id: 'subjects', label: 'موادي', icon: BookOpen },
            { id: 'quizzes', label: 'الاختبارات', icon: Award },
            { id: 'schedule', label: 'الجدول الدراسي', icon: Clock },
            { id: 'live', label: 'حصص لايف', icon: Video },
            { id: 'ai', label: 'المساعد الذكي', icon: Bot },
            { id: 'notes', label: 'الملاحظات السريعة', icon: Edit2 },

            { id: 'wallet', label: 'المحفظة', icon: Ticket },
            { id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
            { id: 'profile', label: 'الملف الشخصي', icon: UserIcon },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeTab === item.id 
                  ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-[#0D0D12] hover:text-gray-900 dark:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-[#2D2D3D] flex justify-center shrink-0 bg-white dark:bg-[#1A1A24]">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl border border-red-200/50 dark:border-red-900/30 transition-all font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] duration-200"
          >
            <LogOut className="w-4 h-4 shrink-0" /> 
            <span>تسجيل خروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <Toaster position="top-center" reverseOrder={false} />
        {/* Top Header */}
        <header className="bg-white dark:bg-[#1A1A24] border-b border-gray-200 dark:border-[#2D2D3D] px-6 h-20 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
           <div className="flex items-center gap-3 md:hidden">
              <div className="w-8 h-8 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                  T
              </div>
           </div>

           <div className="hidden md:flex flex-col">
              <h2 className="font-black text-lg text-gray-900 dark:text-white">أهلاً بك، {userData?.name?.split(' ')[0] || 'المستخدم'} 👋</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mt-1">
                  {userData?.role === "teacher" ? "لوحة تحكم المعلم" : userData?.role === "parent" ? "لوحة تحكم ولي الأمر" : userData?.role === "admin" ? "لوحة تحكم النظام" : "جاهز تذاكر وتتميز؟ 🚀"}
              </p>
           </div>
           <div className="flex items-center gap-4">
              <div className={`hidden md:flex items-center gap-2 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] px-4 py-2 rounded-full font-bold text-sm ${userData?.role === 'teacher' || userData?.role === 'admin' ? '!hidden' : ''}`}>
                 <Star className="w-4 h-4 fill-[#00B4D8] dark:fill-[#D4AF37]" /> {loadingStars ? '...' : starsCount.toLocaleString('ar-EG')}
              </div>
              <ThemeToggle />
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#222230] transition-colors relative"
                >
                   <Bell className="w-5 h-5" />
                   {notifications.filter(n => !n.read).length > 0 && (
                     <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1A1A24]"></span>
                   )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#222230] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2D2D3D] z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">الإشعارات</h3>
                        <span className="text-xs bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] px-2 py-1 rounded-full font-bold">
                          {notifications.filter(n => !n.read).length} جديد
                        </span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                              className={`p-4 border-b border-gray-50 dark:border-[#2D2D3D]/50 hover:bg-gray-50 dark:hover:bg-[#2A2A38] transition-colors cursor-pointer ${!notif.read ? "bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5" : ""}`}
                            >
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{notif.title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{notif.message}</p>
                              <span className="text-[10px] text-gray-400 mt-2 block">
                                {new Date(notif.createdAt).toLocaleDateString("ar-EG")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                            لا توجد إشعارات حالياً
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                title="الملف الشخصي"
                className={`w-10 h-10 rounded-full border-2 shadow-sm overflow-hidden flex items-center justify-center font-bold text-lg transition-all ${
                  activeTab === 'profile'
                    ? 'border-[#00B4D8] dark:border-[#D4AF37] ring-4 ring-[#00B4D8]/20 dark:ring-[#D4AF37]/20 text-[#00B4D8] dark:text-[#D4AF37]'
                    : 'border-white dark:border-[#2D2D3D] bg-gray-200 dark:bg-[#2D2D3D] text-gray-500 hover:scale-105'
                }`}
              >
                 {userData?.name?.charAt(0) || 'U'}
              </button>
           </div>
        </header>

        <div className="p-6 md:p-8 flex-1 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'admin' && userData?.role === 'admin' && (
              <AdminPanel />
            )}
            {activeTab === 'home' && userData?.role === 'admin' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#00B4D8] to-blue-600 dark:from-[#D4AF37] dark:to-yellow-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                      <h1 className="text-3xl font-black mb-2">مرحباً بك يا مدير النظام!</h1>
                      <p className="text-white/80 font-medium">هذه لوحة التحكم الرئيسية الخاصة بك لإدارة منصة Teachland.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'home' && userData?.role !== 'admin' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                {userData?.role === 'teacher' && (
                  <div className="space-y-8">
                    {/* Stat Cards */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 1, title: 'إجمالي الطلاب', value: loadingTeacherStats ? '...' : teacherStudentsCount.toLocaleString('ar-EG'), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { id: 2, title: 'إجمالي المشاهدات', value: loadingTeacherStats ? '...' : teacherViewsCount.toLocaleString('ar-EG'), icon: Activity, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                        { id: 3, title: 'الرصيد المتاح', value: `${(userData?.balance || 0).toLocaleString('ar-EG')} ج.م`, icon: Ticket, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                      ].map((stat) => (
                        <div key={stat.id} className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4 h-full">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                            <stat.icon className={`w-7 h-7 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                          </div>
                        </div>
                      ))}
                    </section>

                    {/* Charts Section */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Enrollment Trend Chart */}
                      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> نمو الاشتراكات (آخر ٧ أيام)
                          </h3>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={teacherEnrollmentTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorEnrollment" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#00B4D8" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-[#2D2D3D]" />
                              <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-[10px] fill-gray-500 font-bold" />
                              <YAxis tickLine={false} axisLine={false} width={35} className="text-[10px] fill-gray-500 font-bold" />
                              <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2D2D3D', borderRadius: '12px', color: '#fff', textAlign: 'right' }} />
                              <Area type="monotone" dataKey="الاشتراكات" stroke="#00B4D8" strokeWidth={3} fillOpacity={1} fill="url(#colorEnrollment)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Course Engagement Chart */}
                      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-500" /> تفاعل الطلاب وحضور المحاضرات
                          </h3>
                          {/* Premium Custom HTML Legend to prevent RTL overlapping bugs */}
                          <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                              <span className="w-3 h-3 rounded bg-[#00B4D8]" />
                              <span>الطلاب المشتركين</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                              <span className="w-3 h-3 rounded bg-[#D4AF37]" />
                              <span>إجمالي المشاهدات</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={teacherChartData.length > 0 ? teacherChartData : [{ name: 'لا توجد كورسات بعد', students: 0, views: 0 }]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-[#2D2D3D]" />
                              <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-[10px] fill-gray-500 font-bold" />
                              <YAxis tickLine={false} axisLine={false} width={35} className="text-[10px] fill-gray-500 font-bold" />
                              <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2D2D3D', borderRadius: '12px', color: '#fff', textAlign: 'right' }} />
                              <Bar dataKey="students" name="الطلاب المشتركين" fill="#00B4D8" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="views" name="إجمالي المشاهدات" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </section>

                    {/* Recent Activities Section */}
                    <section className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-yellow-500" /> أحدث نشاطات الطلاب والاشتراكات
                      </h3>
                      <div className="space-y-4">
                        {notifications.filter(n => n.type === 'enrollment').slice(0, 5).map((notif) => (
                          <div key={notif.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#0D0D12] border border-gray-100 dark:border-[#2D2D3D] hover:-translate-y-0.5 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{notif.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>
                        ))}
                        {notifications.filter(n => n.type === 'enrollment').length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-medium">
                            لا توجد نشاطات أو اشتراكات جديدة حالياً 👍
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {userData?.role === 'parent' && (
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 1, title: 'مستوى الطالب', value: !linkedStudent ? 'لم يتم ربط طالب' : (loadingParentStats ? '...' : parentStats.level), icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                      { id: 2, title: 'آخر الدرجات', value: !linkedStudent ? '-' : (loadingParentStats ? '...' : (parentStats.coursesCount > 0 ? '١٨/٢٠ (ممتاز)' : 'لا يوجد درجات')), icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                      { id: 3, title: 'نسبة الحضور', value: !linkedStudent ? '-' : (loadingParentStats ? '...' : parentStats.attendance), icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                    ].map((stat) => (
                      <div key={stat.id} className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4 h-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                          <stat.icon className={`w-7 h-7 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {userData?.role === 'student' && (
                  <>
                    {/* Continue Learning */}
                    <section>
                       <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                          <Target className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> استكمل التعلم
                       </h2>
                       {loadingContinueLearning ? (
                         <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm animate-pulse space-y-4">
                           <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                         </div>
                       ) : continueLearningItem ? (
                         <div 
                           onClick={() => navigate(`/course/${continueLearningItem.courseId}`, { state: { autoPlayLessonId: continueLearningItem.lessonId } })}
                           className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-md transition-shadow cursor-pointer"
                         >
                            <div className="w-full md:w-48 aspect-video bg-gray-900 rounded-2xl relative flex items-center justify-center overflow-hidden shrink-0">
                               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Play className="w-5 h-5 text-white ml-1 fill-white" />
                               </div>
                            </div>
                            <div className="flex-1 w-full text-right">
                               <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-600 rounded dark:bg-purple-950/40 dark:text-purple-300">
                                    {continueLearningItem.courseSubject}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {continueLearningItem.courseTitle} • الدرس {continueLearningItem.lessonOrder}
                                  </span>
                               </div>
                               <h3 className="text-lg font-black mb-3 text-gray-900 dark:text-white group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors">
                                 {continueLearningItem.lessonTitle}
                               </h3>
                               
                               <div className="w-full bg-gray-100 dark:bg-[#222230] rounded-full h-2 mb-2" dir="ltr">
                                  <div 
                                    className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${continueLearningItem.percent || 0}%` }}
                                  ></div>
                               </div>
                               <p className="text-xs text-gray-500 dark:text-gray-400 font-bold text-right">
                                 {continueLearningItem.percent > 0 ? `تمت مشاهدة ${Math.round(continueLearningItem.percent)}% • ` : ''}
                                 {continueLearningItem.timeRemainingText}
                               </p>
                            </div>
                            <div className="hidden md:flex shrink-0">
                               <div className="w-12 h-12 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:group-hover:bg-[#D4AF37]/10 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors">
                                  <ArrowLeft className="w-5 h-5" />
                               </div>
                            </div>
                         </div>
                       ) : (
                         <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm text-center space-y-4">
                           <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 text-[#00B4D8] dark:text-[#D4AF37] rounded-full flex items-center justify-center mx-auto">
                             <BookOpen className="w-8 h-8" />
                           </div>
                           <h3 className="text-lg font-black text-gray-900 dark:text-white">جاهز لبدء رحلتك التعليمية؟ 🚀</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                             اختر أحد الكورسات المتاحة في الأسفل وابدأ في مشاهدة أول درس لبناء مستقبلك اليوم!
                           </p>
                         </div>
                       )}
                    </section>

                    {/* My Badges */}
                    <section>
                      <StudentBadges userData={userData} />
                    </section>

                    {/* My Subjects */}
                    <section>
                      <StudentCourses userData={userData} />
                    </section>

                    {/* Quick Notes Mini-Box */}
                    <section className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h2 className="text-lg font-black flex items-center gap-2 text-gray-900 dark:text-white">
                          <Edit2 className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> تدوين ملاحظة دراسية سريعة 📝
                        </h2>
                        <button 
                          onClick={() => setActiveTab('notes')}
                          className="text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                        >
                          دفتر الملاحظات الكامل ({quickNotesCount}) <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2 space-y-2">
                          <textarea
                            placeholder="اكتب ملاحظاتك، واجباتك، أو معادلة تود تذكرها لاحقاً... وسيتم مزامنتها فوراً بسحابة Teachland ⚡"
                            rows={3}
                            value={miniNoteContent}
                            onChange={(e) => setMiniNoteContent(e.target.value.slice(0, 1000))}
                            className="w-full bg-gray-50 dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl p-4 text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] placeholder-gray-400 dark:placeholder-gray-600 transition-all leading-relaxed resize-none"
                          />
                        </div>
                        <div className="space-y-2 flex flex-col justify-end w-full">
                          <div>
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 block mb-1.5">
                              ربط بكورس حالي:
                            </label>
                            <select
                              value={miniNoteCourseId}
                              onChange={(e) => setMiniNoteCourseId(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-[#15151F] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37]"
                            >
                              <option value="general">📁 ملاحظات عامة وتنبيهات</option>
                              {coursesList.filter(c => c.enrolledStudentIds?.includes(userData?.id)).map(course => (
                                <option key={course.id} value={course.id}>
                                  📚 {course.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <button
                            onClick={handleMiniNoteSave}
                            disabled={savingMiniNote || !miniNoteContent.trim()}
                            className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] text-white py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {savingMiniNote ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            <span>حفظ الملاحظة سحابياً</span>
                          </button>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'activate' && (
              <motion.div
                key="activate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto mt-10"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 text-center shadow-xl border border-gray-200 dark:border-[#2D2D3D]">
                  <div className="w-16 h-16 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    <Ticket className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37]" />
                  </div>
                  <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">شحن رصيد Teachland</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">أدخل الكود المكون من 12 رقم الموجود في كارت Teachland</p>
                  
                  <form onSubmit={handleActivate}>
                    <input
                      required
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="TF-XXXX-XXXX-XXXX"
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] rounded-xl px-6 py-4 text-center text-2xl tracking-[0.2em] font-mono text-gray-900 dark:text-white outline-none transition-colors mb-6 uppercase"
                      dir="ltr"
                    />
                    <button type="submit" className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-0.5 transition-all text-lg">
                      تفعيل الكود
                    </button>
                  </form>

                  {activationStatus === 'success' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-green-50 text-green-600 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-green-200">
                      <CheckCircle className="w-5 h-5" /> تم الشحن بنجاح!
                    </motion.div>
                  )}
                  {activationStatus === 'error' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-red-200">
                      الكود غير صحيح أو تم استخدامه من قبل
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'classes' && userData?.role === 'teacher' && (
              <motion.div
                key="classes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <TeacherClasses userData={userData} />
              </motion.div>
            )}

            {activeTab === 'subjects' && userData?.role === 'student' && (
              <motion.div
                key="subjects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StudentCourses userData={userData} />
              </motion.div>
            )}

            {activeTab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LiveClassroom userData={userData} />
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div
                key="soon"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-[60vh] flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400"
              >
                <div className="w-20 h-20 bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl flex items-center justify-center mb-6">
                  <Lock className="w-10 h-10 text-gray-600 dark:text-gray-300" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">قريباً</h2>
                <p className="font-medium text-sm">يتم تجهيز هذا القسم ليواكب أحدث التعديلات</p>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SmartAssistant userData={userData} />
              </motion.div>
            )}

                        {(activeTab === 'analytics' || activeTab === 'reports') && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center">
                      <Flame className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">التقارير والإحصائيات</h2>
                      <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">تابع الأداء والتفاعل بشكل مباشر</p>
                    </div>
                  </div>
                  {userData?.role === "teacher" ? (
                    <TeacherAnalytics teacherId={userData.id} />
                  ) : (
                    <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D] text-center">
                       <p className="text-gray-500 font-medium">سيتم عرض تقارير مفصلة عن أداء الطالب هنا بعد الانتهاء من الاختبارات.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-white/80" />
                        <span className="text-white/80 font-bold text-sm">
                          {userData?.role === 'parent' ? `محفظة الطالب: ${linkedStudent?.name || 'غير مرتبط'}` : 'الرصيد الحالي بالمحفظة'}
                        </span>
                      </div>
                      <h2 className="text-4xl font-black flex items-baseline gap-2">
                        {userData?.role === 'parent' 
                          ? (linkedStudent ? (linkedStudent.balance || 0).toLocaleString('ar-EG') : '0')
                          : (userData?.balance || 0).toLocaleString('ar-EG')
                        }
                        <span className="text-lg font-bold text-white/90">ج.م</span>
                      </h2>
                      {userData?.role === 'parent' && !linkedStudent && (
                        <p className="text-xs text-red-100 font-bold bg-red-500/20 px-3 py-1 rounded-lg inline-block mt-2">
                          ⚠️ يرجى ربط حساب الطالب من صفحة الحساب الشخصي أولاً
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {(userData?.role === 'student' || (userData?.role === 'parent' && linkedStudent)) && (
                        <button 
                          onClick={() => setShowChargeForm(!showChargeForm)} 
                          className="bg-white text-[#00B4D8] dark:text-[#D4AF37] px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Ticket className="w-4 h-4" />
                          {showChargeForm ? 'إلغاء الشحن' : 'شحن الرصيد بالكارت'}
                        </button>
                      )}
                      {userData?.role === 'teacher' && (
                        <button 
                          onClick={() => setShowPayoutForm(!showPayoutForm)}
                          className="bg-white text-[#00B4D8] dark:text-[#D4AF37] px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <DollarSign className="w-4 h-4" />
                          {showPayoutForm ? 'إلغاء الطلب' : 'طلب سحب الأرباح'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interactive Charge Form */}
                {showChargeForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">شحن كارت Teachland التعليمي</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">أدخل كود الكارت التعليمي المكون من 12 رقماً لشحن المحفظة فوراً</p>
                      </div>
                    </div>

                    <form onSubmit={handleActivate} className="max-w-md mx-auto space-y-4">
                      <div className="relative">
                        <input
                          required
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder="TF-XXXX-XXXX"
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-2xl px-6 py-4 text-center text-xl md:text-2xl tracking-[0.15em] font-mono text-gray-900 dark:text-white outline-none transition-all uppercase"
                          dir="ltr"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={activationStatus === 'idle' && code.length > 0}
                        className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-all text-base flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        <CheckCircle className="w-5 h-5" />
                        تفعيل الكارت وشحن المحفظة
                      </button>
                    </form>

                    {/* Test Codes for Sandbox Experience */}
                    <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border border-[#00B4D8]/20 dark:border-[#D4AF37]/20 rounded-2xl p-4 md:p-6 space-y-3">
                      <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                        أكواد شحن تجريبية (تفاعلية للتجربة والتقييم):
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        يمكنك نسخ أي كود من الأكواد التالية وتفعيله لتجربة الشحن الفوري وزيادة رصيد المحفظة بالكامل:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {[
                          { code: 'TF-100-2026', label: 'كارت شحن بقيمة ١٠٠ ج.م' },
                          { code: 'TF-200-2026', label: 'كارت شحن بقيمة ٢٠٠ ج.م' },
                          { code: 'TF-500-2026', label: 'كارت شحن بقيمة ٥٠٠ ج.م' }
                        ].map(tc => (
                          <button
                            key={tc.code}
                            type="button"
                            onClick={(e) => handleActivate(e, tc.code)}
                            className="bg-white dark:bg-[#222230] hover:bg-gray-50 dark:hover:bg-[#2A2A3C] border border-gray-200 dark:border-[#3D3D52] p-3 rounded-xl transition-all text-right group flex flex-col justify-between"
                          >
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{tc.label}</span>
                            <span className="text-xs font-mono font-black text-[#00B4D8] dark:text-[#D4AF37] select-all mt-1">{tc.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Interactive Teacher Payout Form */}
                {showPayoutForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
                        <PiggyBank className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">طلب سحب الأرباح</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">قم بتحويل أرباحك ومستحقاتك إلى حسابك المالي أو محفظتك الإلكترونية</p>
                      </div>
                    </div>

                    <form onSubmit={handlePayoutSubmit} className="space-y-4 max-w-xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 dark:text-gray-400">مبلغ السحب (ج.م)</label>
                          <input
                            required
                            type="number"
                            min="1"
                            max={userData?.balance || 0}
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="مثال: 500"
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 dark:text-gray-400">طريقة السحب المتاحة</label>
                          <select
                            value={payoutMethod}
                            onChange={(e) => setPayoutMethod(e.target.value as any)}
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          >
                            <option value="vodafone">فودافون كاش / محفظة الهاتف</option>
                            <option value="instapay">تطبيق إنستاباي (InstaPay)</option>
                            <option value="bank">تحويل بنكي / حساب جاري</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400">
                          {payoutMethod === 'vodafone' ? 'رقم محفظة فودافون كاش (١١ رقماً)' : 
                           payoutMethod === 'instapay' ? 'عنوان الدفع إنستاباي الخاص بك (e.g., name@instapay)' : 
                           'رقم الحساب البنكي / الآيبان (IBAN) واسم البنك'}
                        </label>
                        <input
                          required
                          type="text"
                          value={payoutDetails}
                          onChange={(e) => setPayoutDetails(e.target.value)}
                          placeholder={payoutMethod === 'vodafone' ? '010XXXXXXXX' : payoutMethod === 'instapay' ? 'username@instapay' : 'EG03000XXXXXXXX'}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmittingPayout}
                        className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-black py-4 rounded-xl shadow-lg hover:scale-[1.01] transition-all text-sm flex items-center justify-center gap-2"
                      >
                        {isSubmittingPayout ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري إرسال الطلب...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            تقديم طلب السحب المالي
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Transaction Logs */}
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-gray-400" />
                      سجل المعاملات بالمحفظة
                    </h3>
                    <span className="text-xs bg-gray-100 dark:bg-[#222230] text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full font-bold">
                      {transactions.length} معاملة
                    </span>
                  </div>

                  {loadingTransactions ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">جاري تحميل المعاملات والعمليات...</p>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-[#2D2D3D]/50">
                      {transactions.map((tx) => {
                        const isCredit = tx.amount > 0;
                        return (
                          <div key={tx.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isCredit 
                                  ? 'bg-green-50 dark:bg-green-500/10 text-green-500' 
                                  : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                              }`}>
                                {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                              </div>
                              <div className="text-right">
                                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-0.5">{tx.description}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                                  <span>{new Date(tx.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                  {tx.status && (
                                    <>
                                      <span>•</span>
                                      <span className={`px-1.5 py-0.5 rounded ${
                                        tx.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                      }`}>
                                        {tx.status === 'completed' ? 'مكتمل' : tx.status === 'pending' ? 'قيد الانتظار' : 'مرفوض'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className={`text-base font-black ${isCredit ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                              {isCredit ? '+' : ''}{tx.amount.toLocaleString('ar-EG')} ج.م
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl flex items-center justify-center">
                        <History className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-gray-700 dark:text-gray-300">سجل المعاملات فارغ</p>
                        <p className="text-xs text-gray-400 mt-1">لم تقم بأي عمليات دفع، شراء أو شحن في الفترة السابقة.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

             {activeTab === 'quizzes' && (
              <motion.div
                key="quizzes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-8"
                dir="rtl"
              >
                {/* Header */}
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-right w-full md:w-auto">
                    <div className="w-16 h-16 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Award className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        {userData?.role === 'teacher' ? 'مركز الاختبارات والتقييم' : userData?.role === 'parent' ? 'نتائج واختبارات الطالب' : 'مركز الاختبارات التفاعلية'}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 font-bold text-xs mt-1">
                        {userData?.role === 'teacher' ? 'أدر الاختبارات التفاعلية، وراجع درجات ومحاولات طلابك' : userData?.role === 'parent' ? 'تابع مستوى تقدم الطالب في جميع اختبارات الدروس والكورسات' : 'حل الاختبارات بعد كل درس لقياس مستوى فهمك وتصحيح أخطائك فوراً'}
                      </p>
                    </div>
                  </div>
                </div>

                {loadingQuizzes ? (
                  <div className="text-center py-20 flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#1A1A24] rounded-3xl border border-gray-200 dark:border-[#2D2D3D]">
                    <Loader2 className="w-10 h-10 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
                    <p className="font-bold text-sm text-gray-500">جاري تحميل الاختبارات والنتائج...</p>
                  </div>
                ) : (
                  <>
                    {userData?.role === 'student' && (
                      <div className="space-y-6 text-right">
                        {/* Sub-tabs selector */}
                        <div className="flex gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-3 mb-6">
                          <button
                            onClick={() => setQuizTabType('lesson')}
                            className={`pb-2 text-sm font-black transition-all relative ${
                              quizTabType === 'lesson'
                                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            اختبارات الحصص والدروس
                            {quizTabType === 'lesson' && (
                              <motion.div layoutId="studentQuizTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                            )}
                          </button>
                          <button
                            onClick={() => setQuizTabType('comprehensive')}
                            className={`pb-2 text-sm font-black transition-all relative ${
                              quizTabType === 'comprehensive'
                                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            الامتحانات الشاملة والعامة 🏆
                            {quizTabType === 'comprehensive' && (
                              <motion.div layoutId="studentQuizTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                            )}
                          </button>
                        </div>

                        {quizTabType === 'lesson' ? (
                          <>
                            {/* Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                                <p className="text-xs font-bold text-gray-500 mb-1">الاختبارات المكتملة</p>
                                <h3 className="text-2xl font-black text-[#00B4D8] dark:text-[#D4AF37]">
                                  {submissionsList.filter(s => s.lessonId !== 'comprehensive').length.toLocaleString('ar-EG')} / {quizzesList.filter(q => !q.isComprehensive).length.toLocaleString('ar-EG')}
                                </h3>
                              </div>
                              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                                <p className="text-xs font-bold text-gray-500 mb-1">متوسط الدرجات</p>
                                <h3 className="text-2xl font-black text-green-500">
                                  {submissionsList.filter(s => s.lessonId !== 'comprehensive').length > 0 
                                    ? `${Math.round(submissionsList.filter(s => s.lessonId !== 'comprehensive').reduce((acc, curr) => acc + (curr.score || 0), 0) / submissionsList.filter(s => s.lessonId !== 'comprehensive').length).toLocaleString('ar-EG')}%`
                                    : '0%'
                                  }
                                </h3>
                              </div>
                              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                                <p className="text-xs font-bold text-gray-500 mb-1">الأخطاء المصححة</p>
                                <h3 className="text-2xl font-black text-purple-500">
                                  {submissionsList.filter(s => s.lessonId !== 'comprehensive').reduce((acc, curr) => acc + ((curr.totalQuestions || 0) - (curr.correctAnswers || 0)), 0).toLocaleString('ar-EG')} خطأ
                                </h3>
                              </div>
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2 bg-gray-100 dark:bg-[#0D0D12] p-1.5 rounded-xl w-fit">
                              {[
                                { id: 'all', label: 'الكل' },
                                { id: 'completed', label: 'المكتملة' },
                                { id: 'pending', label: 'المتبقية' }
                              ].map(filter => (
                                <button
                                  key={filter.id}
                                  onClick={() => setQuizzesFilter(filter.id as any)}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    quizzesFilter === filter.id
                                      ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm'
                                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                  }`}
                                >
                                  {filter.label}
                                </button>
                              ))}
                            </div>

                            {/* Quizzes List */}
                            <div className="space-y-4">
                              {quizzesList
                                .filter(q => !q.isComprehensive)
                                .filter(q => {
                                  const isSolved = submissionsList.some(s => s.quizId === q.id);
                                  if (quizzesFilter === 'completed') return isSolved;
                                  if (quizzesFilter === 'pending') return !isSolved;
                                  return true;
                                })
                                .map(quiz => {
                                  const sub = submissionsList.find(s => s.quizId === quiz.id);
                                  return (
                                    <div key={quiz.id} className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] px-2.5 py-1 rounded-lg">
                                            الوقت: {quiz.timeLimit} دقيقة
                                          </span>
                                          <span className="text-xs font-bold bg-gray-100 dark:bg-[#222230] text-gray-500 px-2.5 py-1 rounded-lg">
                                            الأسئلة: {quiz.questions?.length || 0} أسئلة
                                          </span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white">{quiz.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{quiz.description}</p>
                                      </div>

                                      <div className="shrink-0 flex items-center gap-4">
                                        {sub ? (
                                          <div className="flex flex-col md:flex-row items-center gap-4">
                                            <div className="text-center md:text-left">
                                              <div className={`text-sm font-black ${sub.score >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                                                {sub.score}% {sub.score >= 50 ? '• ناجح 🎉' : '• راسب ⚠️'}
                                              </div>
                                              <div className="text-xs text-gray-400 font-bold mt-0.5" dir="ltr">
                                                {sub.correctAnswers} / {sub.totalQuestions} صحيح
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setSelectedQuizReview(quiz);
                                                setSelectedSubmissionReview(sub);
                                              }}
                                              className="px-5 py-3 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] hover:bg-[#00B4D8]/20 rounded-2xl font-bold text-xs transition-colors flex items-center gap-2"
                                            >
                                              <Award className="w-4 h-4" />
                                              تصحيح الأخطاء والتقرير
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              navigate(`/course/${quiz.courseId}`);
                                              toast.success('تم توجيهك لصفحة الكورس، الرجاء اختيار الدرس وبدء الاختبار من تبويب الاختبار التفاعلي.');
                                            }}
                                            className="px-6 py-3 bg-[#00B4D8] dark:bg-[#D4AF37] text-white hover:bg-[#0077B6] rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5"
                                          >
                                            <Play className="w-4 h-4" />
                                            ابدأ الاختبار الآن
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                              {quizzesList.filter(q => !q.isComprehensive).filter(q => {
                                const isSolved = submissionsList.some(s => s.quizId === q.id);
                                if (quizzesFilter === 'completed') return isSolved;
                                if (quizzesFilter === 'pending') return !isSolved;
                                return true;
                              }).length === 0 && (
                                <div className="text-center py-16 bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-3xl">
                                  <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                  <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد اختبارات حصص في هذا القسم حالياً 👍</p>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          // Comprehensive exams tab for students
                          <div className="space-y-6">
                            {/* Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                                <p className="text-xs font-bold text-gray-500 mb-1">الامتحانات الشاملة المكتملة</p>
                                <h3 className="text-2xl font-black text-[#00B4D8] dark:text-[#D4AF37]">
                                  {submissionsList.filter(s => s.lessonId === 'comprehensive').length.toLocaleString('ar-EG')} / {quizzesList.filter(q => q.isComprehensive).length.toLocaleString('ar-EG')}
                                </h3>
                              </div>
                              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                                <p className="text-xs font-bold text-gray-500 mb-1">متوسط درجات الشامل</p>
                                <h3 className="text-2xl font-black text-green-500">
                                  {submissionsList.filter(s => s.lessonId === 'comprehensive').length > 0 
                                    ? `${Math.round(submissionsList.filter(s => s.lessonId === 'comprehensive').reduce((acc, curr) => acc + (curr.score || 0), 0) / submissionsList.filter(s => s.lessonId === 'comprehensive').length).toLocaleString('ar-EG')}%`
                                    : '0%'
                                  }
                                </h3>
                              </div>
                              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                                <p className="text-xs font-bold text-gray-500 mb-1">نسبة النجاح العامة</p>
                                <h3 className="text-2xl font-black text-purple-500">
                                  {submissionsList.filter(s => s.lessonId === 'comprehensive').length > 0
                                    ? `${Math.round((submissionsList.filter(s => s.lessonId === 'comprehensive' && s.passed).length / submissionsList.filter(s => s.lessonId === 'comprehensive').length) * 100).toLocaleString('ar-EG')}%`
                                    : '0%'
                                  }
                                </h3>
                              </div>
                            </div>

                            {/* Comprehensive Quizzes List */}
                            <div className="space-y-4">
                              {quizzesList
                                .filter(q => q.isComprehensive)
                                .map(quiz => {
                                  const sub = submissionsList.find(s => s.quizId === quiz.id);
                                  const courseInfo = coursesList.find(c => c.id === quiz.courseId);
                                  return (
                                    <div key={quiz.id} className="bg-gradient-to-l from-white to-gray-50/50 dark:from-[#1A1A24] dark:to-[#14141d] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-1.5 h-full bg-[#00B4D8] dark:bg-[#D4AF37]" />
                                      <div className="flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-xs font-bold bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            الوقت: {quiz.timeLimit} دقيقة
                                          </span>
                                          <span className="text-xs font-bold bg-gray-100 dark:bg-[#222230] text-gray-500 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            الأسئلة: {quiz.questions?.length || 0} أسئلة
                                          </span>
                                          {courseInfo ? (
                                            <span className="text-xs font-bold bg-[#00B4D8]/5 text-gray-600 dark:bg-[#D4AF37]/5 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-[#00B4D8]/10 dark:border-[#D4AF37]/10">
                                              الكورس: {courseInfo.title}
                                            </span>
                                          ) : (
                                            <span className="text-xs font-bold bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-900/30">
                                              امتحان عام للجميع 🌍
                                            </span>
                                          )}
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                          {quiz.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{quiz.description}</p>
                                      </div>

                                      <div className="shrink-0 flex items-center gap-4">
                                        {sub ? (
                                          <div className="flex flex-col md:flex-row items-center gap-4">
                                            <div className="text-center md:text-left">
                                              <div className={`text-sm font-black ${sub.score >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                                                {sub.score}% {sub.score >= 50 ? '• ناجح 🎉' : '• راسب ⚠️'}
                                              </div>
                                              <div className="text-xs text-gray-400 font-bold mt-0.5" dir="ltr">
                                                {sub.correctAnswers} / {sub.totalQuestions} صحيح
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setSelectedQuizReview(quiz);
                                                setSelectedSubmissionReview(sub);
                                              }}
                                              className="px-5 py-3 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] hover:bg-[#00B4D8]/20 rounded-2xl font-bold text-xs transition-colors flex items-center gap-2"
                                            >
                                              <Award className="w-4 h-4" />
                                              تقرير الإجابات والأخطاء
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              navigate(`/exam/${quiz.id}`);
                                            }}
                                            className="px-6 py-3 bg-[#00B4D8] dark:bg-[#D4AF37] text-white hover:bg-[#0077B6] rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5 animate-pulse"
                                          >
                                            <Play className="w-4 h-4" />
                                            دخول وبدء الامتحان الشامل الآن
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                              {quizzesList.filter(q => q.isComprehensive).length === 0 && (
                                <div className="text-center py-16 bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-3xl">
                                  <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                  <p className="font-bold text-gray-700 dark:text-gray-300">لم يقم المعلم بنشر أي امتحانات شاملة أو عامة حتى الآن 👍</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {userData?.role === 'teacher' && (
                      <div className="space-y-6 text-right w-full">
                        {/* Teacher Sub-tabs selector */}
                        <div className="flex gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-3 mb-6">
                          <button
                            onClick={() => setQuizTabType('lesson')}
                            className={`pb-2 text-sm font-black transition-all relative ${
                              quizTabType === 'lesson'
                                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            اختبارات الحصص والدروس
                            {quizTabType === 'lesson' && (
                              <motion.div layoutId="teacherQuizTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                            )}
                          </button>
                          <button
                            onClick={() => setQuizTabType('comprehensive')}
                            className={`pb-2 text-sm font-black transition-all relative ${
                              quizTabType === 'comprehensive'
                                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            الامتحانات الشاملة والعامة 🏆
                            {quizTabType === 'comprehensive' && (
                              <motion.div layoutId="teacherQuizTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                            )}
                          </button>
                        </div>

                        {quizTabType === 'lesson' ? (
                          <>
                            {/* Quick Guide Card */}
                            <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border border-[#00B4D8]/20 dark:border-[#D4AF37]/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                              <div className="space-y-2 flex-1">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                                  كيفية إنشاء اختبار تفاعلي جديد لطلابك:
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                  يتم ربط كل اختبار تفاعلي بدرس محدد داخل كورساتك. لإنشاء اختبار جديد أو تعديله، اذهب إلى قسم <span className="font-bold text-[#00B4D8] dark:text-[#D4AF37]">"فصولي"</span>، ثم اختر الكورس والدرس المطلوب، وانتقل لتبويب <span className="font-bold text-[#00B4D8] dark:text-[#D4AF37]">"الاختبار التفاعلي"</span> لإضافة الأسئلة وتحديد الإجابة الصحيحة وشرحها لطلابك فوراً!
                                </p>
                              </div>
                              <button
                                onClick={() => setActiveTab('classes')}
                                className="px-6 py-3 bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2 shrink-0 hover:-translate-y-0.5"
                              >
                                <Users className="w-4 h-4" />
                                الذهاب إلى "فصولي" للبدء
                              </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Quizzes List (Left Column) */}
                              <div className="lg:col-span-1 space-y-4">
                              <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">الاختبارات المتاحة</h3>
                              <div className="space-y-3">
                                {quizzesList.filter(q => !q.isComprehensive).map(quiz => {
                                  const subs = submissionsList.filter(s => s.quizId === quiz.id);
                                  const isSelected = teacherSelectedQuiz?.id === quiz.id;
                                  return (
                                    <button
                                      key={quiz.id}
                                      onClick={() => {
                                        setTeacherSelectedQuiz(quiz);
                                      }}
                                      className={`w-full p-4 rounded-2xl text-right border transition-all flex flex-col gap-2 ${
                                        isSelected
                                          ? 'bg-gradient-to-l from-[#00B4D8]/10 to-transparent border-[#00B4D8] dark:from-[#D4AF37]/10 dark:border-[#D4AF37] shadow-sm'
                                          : 'bg-white dark:bg-[#1A1A24] border-gray-200 dark:border-[#2D2D3D] hover:bg-gray-50'
                                      }`}
                                    >
                                      <span className="text-[10px] bg-gray-100 dark:bg-[#222230] text-gray-500 px-2 py-0.5 rounded-full font-bold self-start">
                                        المشاركات: {subs.length} طالب
                                      </span>
                                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{quiz.title}</h4>
                                      <p className="text-xs text-gray-400 font-bold">الأسئلة: {quiz.questions?.length || 0}</p>
                                    </button>
                                  );
                                })}

                                {quizzesList.filter(q => !q.isComprehensive).length === 0 && (
                                  <div className="text-center py-10 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200">
                                    <Award className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <p className="font-bold text-xs text-gray-500">لم تقم بإنشاء أي اختبارات تفاعلية بعد.</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Submissions (Right Column) */}
                            <div className="lg:col-span-2 space-y-4">
                              {teacherSelectedQuiz && !teacherSelectedQuiz.isComprehensive ? (
                                (() => {
                                  const quizSubmissions = submissionsList.filter(s => s.quizId === teacherSelectedQuiz.id);
                                  return (
                                    <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                                      <div className="border-b border-gray-100 dark:border-[#2D2D3D] pb-4 flex justify-between items-center">
                                        <div>
                                          <h3 className="font-black text-lg text-gray-900 dark:text-white">{teacherSelectedQuiz.title}</h3>
                                          <p className="text-xs text-gray-400 font-bold mt-1">جدول تسليمات ودرجات الطلاب للتصحيح والمتابعة</p>
                                        </div>
                                        <button
                                          onClick={() => {
                                            navigate(`/course/${teacherSelectedQuiz.courseId}`);
                                            toast.success('تم توجيهك لصفحة الكورس للتعديل على الاختبار.');
                                          }}
                                          className="px-4 py-2.5 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] rounded-xl text-xs font-bold transition-all hover:bg-[#00B4D8]/20 flex items-center gap-1.5"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                          تعديل الأسئلة
                                        </button>
                                      </div>

                                      <div className="divide-y divide-gray-50 dark:divide-[#2D2D3D]/50">
                                        {quizSubmissions.map(sub => (
                                          <div key={sub.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center font-bold text-sm text-[#0077B6] dark:text-[#D4AF37]">
                                                {sub.userName?.charAt(0) || 'ط'}
                                              </div>
                                              <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{sub.userName}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                  تاريخ التسليم: {new Date(sub.submittedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="text-left font-black text-sm">
                                              <span className={sub.score >= 50 ? 'text-green-500' : 'text-red-500'}>
                                                {sub.score}%
                                              </span>
                                              <p className="text-[10px] text-gray-400 font-bold mt-0.5" dir="ltr">
                                                {sub.correctAnswers} / {sub.totalQuestions} صحيح
                                              </p>
                                            </div>
                                          </div>
                                        ))}

                                        {quizSubmissions.length === 0 && (
                                          <div className="text-center py-16 text-gray-400">
                                            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                            <p className="font-bold text-sm">لا توجد محاولات أو تسليمات من الطلاب لهذا الاختبار بعد 👍</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-16 text-center border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center justify-center h-full">
                                  <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                  <h3 className="font-black text-lg text-gray-800 dark:text-gray-200">اختر اختباراً لمشاهدة التفاصيل</h3>
                                  <p className="text-xs text-gray-400 font-bold max-w-sm mt-1">قم بتحديد أي اختبار من القائمة الجانبية لعرض درجات الطلاب وتحليل أخطائهم بالتفصيل</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                        ) : (
                          // Comprehensive exams tab for teachers
                          <div className="space-y-6">
                            {/* Create Button Banner */}
                            <div className="bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-[#00B4D8]/10 dark:shadow-[#D4AF37]/10">
                              <div className="space-y-1">
                                <h3 className="font-black text-lg">بوابة الامتحانات الشاملة والعامة 🏆</h3>
                                <p className="text-xs text-white/80 font-bold">أنشئ امتحانات عامة أو شاملة لكورساتك وموادك لقياس تحصيل ومستوى الطلاب.</p>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingExamId(null);
                                  setIsCreatingExam(true);
                                }}
                                className="px-6 py-3 bg-white text-[#0077B6] dark:text-[#AA7C11] rounded-2xl font-black text-xs hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-md shadow-black/5"
                              >
                                <Plus className="w-4 h-4" />
                                إضافة امتحان شامل جديد
                              </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Left Column: Exams List */}
                              <div className="lg:col-span-1 space-y-4">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white">قائمة الامتحانات الشاملة</h3>
                                <div className="space-y-3">
                                  {quizzesList.filter(q => q.isComprehensive).map(quiz => {
                                    const subs = submissionsList.filter(s => s.quizId === quiz.id);
                                    const isSelected = teacherSelectedQuiz?.id === quiz.id;
                                    const courseInfo = coursesList.find(c => c.id === quiz.courseId);
                                    return (
                                      <div
                                        key={quiz.id}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 relative group cursor-pointer ${
                                          isSelected
                                            ? 'bg-gradient-to-l from-[#00B4D8]/10 to-transparent border-[#00B4D8] dark:from-[#D4AF37]/10 dark:border-[#D4AF37] shadow-sm'
                                            : 'bg-white dark:bg-[#1A1A24] border-gray-200 dark:border-[#2D2D3D] hover:bg-gray-50'
                                        }`}
                                        onClick={() => setTeacherSelectedQuiz(quiz)}
                                      >
                                        <div className="flex justify-between items-start">
                                          <span className="text-[10px] bg-gray-100 dark:bg-[#222230] text-gray-500 px-2 py-0.5 rounded-full font-bold">
                                            المشاركات: {subs.length} طالب
                                          </span>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingExamId(quiz.id);
                                                setIsCreatingExam(true);
                                              }}
                                              className="p-1 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-lg text-[#00B4D8] dark:text-[#D4AF37] transition-colors"
                                              title="تعديل الامتحان"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("هل أنت متأكد من حذف هذا الامتحان الشامل نهائياً؟")) {
                                                  handleDeleteExam(quiz.id);
                                                }
                                              }}
                                              className="p-1 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-lg text-red-500 transition-colors"
                                              title="حذف الامتحان"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{quiz.title}</h4>
                                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold">
                                          <span>الأسئلة: {quiz.questions?.length || 0}</span>
                                          <span>{courseInfo ? courseInfo.title : "امتحان عام"}</span>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {quizzesList.filter(q => q.isComprehensive).length === 0 && (
                                    <div className="text-center py-10 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200">
                                      <Award className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                      <p className="font-bold text-xs text-gray-500">لم تقم بنشر أي امتحانات شاملة بعد.</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Column: Submissions List */}
                              <div className="lg:col-span-2 space-y-4">
                                {teacherSelectedQuiz && teacherSelectedQuiz.isComprehensive ? (
                                  (() => {
                                    const quizSubmissions = submissionsList.filter(s => s.quizId === teacherSelectedQuiz.id);
                                    return (
                                      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                                        <div className="border-b border-gray-100 dark:border-[#2D2D3D] pb-4 flex justify-between items-center">
                                          <div>
                                            <h3 className="font-black text-lg text-gray-900 dark:text-white">{teacherSelectedQuiz.title}</h3>
                                            <p className="text-xs text-gray-400 font-bold mt-1">جدول تسليمات ودرجات الطلاب للتقييم والمتابعة</p>
                                          </div>
                                          <button
                                            onClick={() => {
                                              setEditingExamId(teacherSelectedQuiz.id);
                                              setIsCreatingExam(true);
                                            }}
                                            className="px-4 py-2.5 bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] rounded-xl text-xs font-bold transition-all hover:bg-[#00B4D8]/20 flex items-center gap-1.5"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            تعديل الامتحان
                                          </button>
                                        </div>

                                        <div className="divide-y divide-gray-50 dark:divide-[#2D2D3D]/50">
                                          {quizSubmissions.map(sub => (
                                            <div key={sub.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                                              <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center font-bold text-sm text-[#0077B6] dark:text-[#D4AF37]">
                                                  {sub.userName?.charAt(0) || 'ط'}
                                                </div>
                                                <div>
                                                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{sub.userName}</h4>
                                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                    تاريخ التسليم: {new Date(sub.submittedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                                                  </p>
                                                </div>
                                              </div>

                                              <div className="text-left font-black text-sm">
                                                <span className={sub.score >= 50 ? 'text-green-500' : 'text-red-500'}>
                                                  {sub.score}%
                                                </span>
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5" dir="ltr">
                                                  {sub.correctAnswers} / {sub.totalQuestions} صحيح
                                                </p>
                                              </div>
                                            </div>
                                          ))}

                                          {quizSubmissions.length === 0 && (
                                            <div className="text-center py-16 text-gray-400">
                                              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                              <p className="font-bold text-sm">لا توجد محاولات أو تسليمات من الطلاب لهذا الامتحان الشامل بعد 👍</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-16 text-center border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col items-center justify-center h-full">
                                    <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                    <h3 className="font-black text-lg text-gray-800 dark:text-gray-200">اختر امتحاناً شاملاً لمشاهدة التفاصيل</h3>
                                    <p className="text-xs text-gray-400 font-bold max-w-sm mt-1">قم بتحديد أي امتحان من القائمة الجانبية لعرض درجات الطلاب وتحليل أخطائهم بالتفصيل</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {userData?.role === 'parent' && (
                      <div className="space-y-6 text-right">
                        {/* Parent linked student status message */}
                        {!linkedStudent ? (
                          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200/50 text-center font-bold text-sm">
                            ⚠️ يرجى ربط حساب الطالب من صفحة "الملف الشخصي" أولاً لعرض تقارير واختبارات الطالب بالتفصيل ومتابعة أدائه.
                          </div>
                        ) : (
                          <>
                            <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 rounded-2xl p-4 flex items-center gap-3">
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                تتابع حالياً أداء الطالب المربوط بحسابك: <span className="font-black text-[#00B4D8] dark:text-[#D4AF37]">{linkedStudent.name}</span>. تم تحديث الدرجات والمحاولات تلقائياً.
                              </p>
                            </div>

                            {/* Submissions List */}
                            <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6">
                              <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-gray-400" />
                                سجل اختبارات الطالب ودرجاته
                              </h3>

                              <div className="divide-y divide-gray-50 dark:divide-[#2D2D3D]/50">
                                {submissionsList.map(sub => {
                                  const quiz = quizzesList.find(q => q.id === sub.quizId);
                                  return (
                                    <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                          sub.score >= 50 ? 'bg-green-50 dark:bg-green-500/10 text-green-500' : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                                        }`}>
                                          <Award className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">{quiz?.title || 'اختبار تفاعلي للدرس'}</h4>
                                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                            تم الحل: {new Date(sub.submittedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 self-start sm:self-auto">
                                        <span className={`text-base font-black ${sub.score >= 50 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                                          {sub.score}%
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                          sub.score >= 50 ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                        }`}>
                                          {sub.score >= 50 ? 'اجتاز الاختبار' : 'بحاجة لإعادة'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}

                                {submissionsList.length === 0 && (
                                  <div className="text-center py-12 text-gray-400">
                                    <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="font-bold text-sm">لم يقم الطالب بأداء أي اختبارات تفاعلية حتى الآن 👍</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Student Quiz Review & Mistake Correction Modal */}
                <AnimatePresence>
                  {selectedQuizReview && selectedSubmissionReview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => {
                          setSelectedQuizReview(null);
                          setSelectedSubmissionReview(null);
                        }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-right"
                        dir="rtl"
                      >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#1A1A24]/80 backdrop-blur-xl z-10">
                          <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">تقرير أداء وتصحيح الأخطاء</h3>
                            <p className="text-xs text-gray-400 font-bold mt-1">{selectedQuizReview.title}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedQuizReview(null);
                              setSelectedSubmissionReview(null);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2D3D] text-gray-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                          {/* Top Card Summary */}
                          <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-around items-center gap-6">
                            <div className="text-center">
                              <p className="text-xs text-gray-400 font-bold mb-1">النتيجة الإجمالية</p>
                              <div className={`text-4xl font-black ${selectedSubmissionReview.score >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                                {selectedSubmissionReview.score}%
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full mt-2 inline-block ${
                                selectedSubmissionReview.score >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {selectedSubmissionReview.score >= 50 ? 'اجتياز ممتاز' : 'لم تجتاز الاختبار'}
                              </span>
                            </div>
                            <div className="text-center border-r border-gray-100 dark:border-[#2D2D3D] pr-6 w-full sm:w-auto">
                              <p className="text-xs text-gray-400 font-bold mb-1">الإجابات الصحيحة</p>
                              <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {selectedSubmissionReview.correctAnswers} / {selectedSubmissionReview.totalQuestions}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 font-bold">من إجمالي الأسئلة المتاحة</p>
                            </div>
                          </div>

                          <h4 className="font-black text-base text-gray-900 dark:text-white mb-4">تفاصيل الأسئلة والتصحيح:</h4>
                          <div className="space-y-6">
                            {selectedQuizReview.questions?.map((q: any, idx: number) => {
                              const studentAns = selectedSubmissionReview.answers?.[q.id];
                              const isCorrect = studentAns !== undefined && studentAns === q.correctOptionIndex;
                              return (
                                <div key={q.id} className={`p-5 rounded-2xl border ${
                                  isCorrect 
                                    ? 'bg-green-50/20 dark:bg-green-950/10 border-green-200/40' 
                                    : 'bg-red-50/20 dark:bg-red-950/10 border-red-200/40'
                                } space-y-4`}>
                                  <div className="flex items-start gap-3">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white leading-relaxed">{q.text}</p>
                                  </div>

                                  {/* Options */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 pr-9">
                                    {q.options.map((opt: string, oIdx: number) => {
                                      const isSelectedByStudent = studentAns === oIdx;
                                      const isCorrectOption = q.correctOptionIndex === oIdx;
                                      return (
                                        <div key={oIdx} className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                                          isCorrectOption 
                                            ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400' 
                                            : isSelectedByStudent 
                                              ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                                              : 'bg-gray-50 dark:bg-[#222230] border-gray-100 dark:border-transparent text-gray-600 dark:text-gray-400'
                                        }`}>
                                          <span>{opt}</span>
                                          {isCorrectOption && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                                          {!isCorrectOption && isSelectedByStudent && <X className="w-4 h-4 text-red-500 shrink-0" />}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Explanation block */}
                                  {q.explanation && (
                                    <div className="bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border-r-4 border-[#00B4D8] dark:border-[#D4AF37] p-3.5 rounded-xl pr-4 mt-2">
                                      <p className="text-xs font-black text-[#0077B6] dark:text-[#D4AF37] mb-1">💡 التفسير والشرح المبسط لتصحيح الخطأ:</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{q.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedQuizReview(null);
                              setSelectedSubmissionReview(null);
                            }}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 text-gray-700 dark:text-white rounded-xl text-xs font-black transition-colors"
                          >
                            إغلاق التقرير
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Comprehensive Exam Builder for Teachers */}
                <ComprehensiveExamBuilder
                  isOpen={isCreatingExam}
                  onClose={() => {
                    setIsCreatingExam(false);
                    setEditingExamId(null);
                  }}
                  db={db}
                  userData={userData}
                  coursesList={coursesList}
                  editingExamId={editingExamId}
                  existingExamData={editingExamId ? quizzesList.find(q => q.id === editingExamId) : undefined}
                  onSaveSuccess={(examData) => {
                    setQuizzesList(prev => {
                      const filtered = prev.filter(q => q.id !== examData.id);
                      return [examData, ...filtered];
                    });
                    setIsCreatingExam(false);
                    setEditingExamId(null);
                  }}
                />

                {/* Student Exam Taking Interface */}
                {activeTakingExam && (
                  <StudentExamTaking
                    exam={activeTakingExam}
                    isOpen={!!activeTakingExam}
                    onClose={() => setActiveTakingExam(null)}
                    db={db}
                    userData={userData}
                    onSubmissionSuccess={(submissionData) => {
                      setSubmissionsList(prev => {
                        const filtered = prev.filter(s => s.id !== submissionData.id);
                        return [submissionData, ...filtered];
                      });
                      setStarsReloadTrigger(prev => prev + 1);
                      setActiveTakingExam(null);
                    }}
                  />
                )}
              </motion.div>
            )}

            {activeTab === "faq" && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FAQSection />
              </motion.div>
            )}

            {activeTab === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <InteractiveSchedule db={db} userData={userData} coursesList={coursesList} />
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <QuickNotes db={db} userData={userData} />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ProfileSection userData={userData} onUpdateUserData={(newData) => setUserData(newData)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Floating Support Button */}
      <button className="fixed bottom-20 md:bottom-6 left-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20 hover:-translate-y-1 transition-transform z-50">
        <MessageCircleQuestion className="w-6 h-6" />
      </button>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A24] border-t border-gray-200 dark:border-[#2D2D3D] flex justify-around p-3 z-40 pb-safe">
        {(userData?.role === 'admin' ? [
            { id: 'home', icon: Target, label: 'الرئيسية' },
            { id: 'admin', icon: Shield, label: 'الإدارة' },
            { id: 'profile', icon: UserIcon, label: 'حسابي' },
        ] : userData?.role === 'teacher' ? [
            { id: 'home', icon: Target, label: 'الرئيسية' },
            { id: 'classes', icon: Users, label: 'فصولي' },
            { id: 'quizzes', icon: Award, label: 'الاختبارات' },
            { id: 'live', icon: Video, label: 'لايف' },
            { id: 'profile', icon: UserIcon, label: 'حسابي' },
        ] : userData?.role === 'parent' ? [
            { id: 'home', icon: Target, label: 'الرئيسية' },
            { id: 'quizzes', icon: Award, label: 'الاختبارات' },
            { id: 'schedule', icon: Clock, label: 'الجدول' },
            { id: 'wallet', icon: Ticket, label: 'المحفظة' },
            { id: 'profile', icon: UserIcon, label: 'حسابي' },
        ] : [
            { id: 'home', icon: Target, label: 'الرئيسية' },
            { id: 'subjects', icon: BookOpen, label: 'موادي' },
            { id: 'live', icon: Video, label: 'لايف' },
            { id: 'quizzes', icon: Award, label: 'الاختبارات' },
            { id: 'profile', icon: UserIcon, label: 'حسابي' },
        ]).map(item => (
            <button 
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === item.id ? 'text-[#00B4D8] dark:text-[#D4AF37]' : 'text-gray-500 dark:text-gray-400'}`}
            >
               <item.icon className="w-6 h-6" />
               <span className="text-[10px] font-bold">{item.label}</span>
            </button>
        ))}
      </nav>
    </div>
  );
}
