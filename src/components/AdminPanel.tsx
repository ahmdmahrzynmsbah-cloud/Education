import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Users, BookOpen, Shield, Trash2, Edit2, Loader2, CheckCircle2, 
  Eye, EyeOff, Printer, X, Calendar, User, Mail, Phone, Lock, 
  GraduationCap, Book, AlertTriangle, FileText, Settings, Sparkles, 
  Hash, Award, FileCheck, Check, Activity, ShieldAlert,
  MapPin, School, PhoneCall, Layers, Clock, Search, Filter,
  ArrowUpDown, SlidersHorizontal, RotateCcw, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import AdminVisualStats from './AdminVisualStats';

const formatRegistrationDate = (createdAt: any) => {
  if (!createdAt) return '13/07/2026';
  try {
    if (typeof createdAt === 'string') {
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
      }
    }
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    }
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    }
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    }
  } catch (e) {
    // ignore
  }
  return '13/07/2026';
};

const getMockReportRecords = (role: string, rangeType: 'all' | 'month' | 'custom', monthStr?: string, startStr?: string, endStr?: string) => {
  let allRecords: any[] = [];
  
  if (role === 'teacher') {
    allRecords = [
      { id: 1, type: 'درس تفاعلي', name: 'شرح درس البلاغة المقارنة والنقد المعاصر', details: 'عدد الحاضرين: 15 طالب', date: '2026-07-08', status: 'مكتمل' },
      { id: 2, type: 'تصحيح واجبات', name: 'تصحيح واجب النحو والصرف الدوري الثاني', details: 'عدد الأوراق المصححة: 18 ورقة', date: '2026-07-04', status: 'مكتمل' },
      { id: 3, type: 'إعداد اختبار', name: 'إعداد بنك الأسئلة لمادة اللغة العربية للفصل الصيفي', details: 'عدد الأسئلة: 50 سؤال', date: '2026-06-22', status: 'مكتمل' },
      { id: 4, type: 'ورشة عمل', name: 'محاضرة مراجعة تفاعلية ليلة الامتحان التجريبي', details: 'المدة الزمنية: ساعتان', date: '2026-06-10', status: 'مكتمل' },
      { id: 5, type: 'درس تفاعلي', name: 'شرح معلقة امرؤ القيس والجاهلية الأولى', details: 'عدد الحاضرين: 14 طالب', date: '2026-05-25', status: 'مكتمل' },
      { id: 6, type: 'اجتماع إدارة', name: 'اجتماع مجلس المعلمين الدوري وتنسيق الجداول', details: 'حضور وإعداد التوصيات', date: '2026-05-11', status: 'مكتمل' },
      { id: 7, type: 'تصحيح اختبار', name: 'رصد علامات اختبار منتصف الفصل الثاني للطلاب', details: 'إدخال البيانات لقاعدة البيانات', date: '2026-04-18', status: 'مكتمل' }
    ];
  } else if (role === 'parent') {
    allRecords = [
      { id: 1, type: 'متابعة تقرير', name: 'استعراض التقرير الدراسي التفصيلي للابن أحمد', details: 'حالة حضور ممتازة 100%', date: '2026-07-10', status: 'مكتمل' },
      { id: 2, type: 'نتائج الاختبارات', name: 'الإطلاع على علامات الابن أحمد في مادة الرياضيات', details: 'النتيجة: 90 / 100 (ممتاز)', date: '2026-07-03', status: 'مكتمل' },
      { id: 3, type: 'تواصل مع معلم', name: 'إرسال استفسار للمعلم المشرف م. محمد بخصوص الواجبات', details: 'الحالة: تم الرد والحل', date: '2026-06-28', status: 'مكتمل' },
      { id: 4, type: 'شحن رصيد', name: 'تفعيل قسيمة شحن رصيد الكتب التعليمية ووسائل التدريس', details: 'القيمة المضافة: 500 جنيه مصري', date: '2026-06-15', status: 'مكتمل' },
      { id: 5, type: 'متابعة غياب', name: 'تلقي إشعار التأخر الصباحي التلقائي للطالب أحمد', details: 'تم تبرير الغياب هاتفياً', date: '2026-05-22', status: 'مكتمل' },
      { id: 6, type: 'مجالس أولياء أمور', name: 'حضور مجلس الآباء السنوي الافتراضي لمناقشة الأداء', details: 'المشاركة الفعالة والتصويت', date: '2026-05-02', status: 'مكتمل' },
      { id: 7, type: 'دفع مصروفات', name: 'سداد رسوم اشتراك الفصل الدراسي الصيفي والكتب', details: 'عملية ناجحة وآمنة', date: '2026-04-12', status: 'مكتمل' }
    ];
  } else {
    // Default is student
    allRecords = [
      { id: 1, type: 'اختبار دوري', name: 'اختبار النحو والبلاغة الدوري المقيد', details: 'الدرجة: 96 / 100', date: '2026-07-05', status: 'ممتاز' },
      { id: 2, type: 'امتحان شهري', name: 'الامتحان الشهري الموحد - الجبر وحساب المثلثات', details: 'الدرجة: 90 / 100', date: '2026-07-02', status: 'ممتاز' },
      { id: 3, type: 'اختبار علمي', name: 'اختبار الميكانيكا والكهرباء الحديثة الشامل', details: 'الدرجة: 88 / 100', date: '2026-06-25', status: 'جيد جداً' },
      { id: 4, type: 'واجب منزلي', name: 'تقييم القراءة والكتابة والبحث التعبيري الإبداعي', details: 'الدرجة: 92 / 100', date: '2026-06-18', status: 'ممتاز' },
      { id: 5, type: 'اختبار كيمياء', name: 'اختبار العناصر الانتقالية والتحليل الكيميائي الكلي', details: 'الدرجة: 85 / 100', date: '2026-05-28', status: 'جيد جداً' },
      { id: 6, type: 'اختبار أحياء', name: 'امتحان الوراثة والتطور والخلية النمطية الموسع', details: 'الدرجة: 94 / 100', date: '2026-05-12', status: 'ممتاز' },
      { id: 7, type: 'تقييم عام', name: 'تقييم العصور الوسطى والتضاريس الجغرافية للتاريخ', details: 'الدرجة: 89 / 100', date: '2026-04-20', status: 'جيد جداً' }
    ];
  }

  return allRecords.filter(rec => {
    if (rangeType === 'month' && monthStr) {
      return rec.date.startsWith(monthStr);
    }
    if (rangeType === 'custom') {
      const recTime = new Date(rec.date).getTime();
      const startTime = startStr ? new Date(startStr).getTime() : 0;
      const endTime = endStr ? new Date(endStr).getTime() : Infinity;
      return recTime >= startTime && recTime <= endTime;
    }
    return true; // 'all'
  });
};

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [progressRecords, setProgressRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'parents'>('students');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'active' | 'archived'>('active');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Print Form State / Customization
  const [printDateRange, setPrintDateRange] = useState<'all' | 'month' | 'custom'>('all');
  const [printMonth, setPrintMonth] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [customReportTitle, setCustomReportTitle] = useState('تقرير السجل الدراسي الشامل');
  const [customReportNotes, setCustomReportNotes] = useState('');
  const [showSignatures, setShowSignatures] = useState(true);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch users and progress in parallel
      const [usersSnap, progressSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'course_progress')).catch(err => {
          console.error("Error fetching course progress in background:", err);
          return { docs: [] } as any;
        })
      ]);

      const usersData: any[] = [];
      usersSnap.forEach((document) => {
        const data = document.data();
        let createdAt = data.createdAt;
        if (!createdAt) {
          createdAt = new Date().toISOString();
          // Update in background so the UI doesn't wait or lag
          updateDoc(doc(db, 'users', document.id), { createdAt }).catch(err => {
            console.error("Error auto-populating missing createdAt:", err);
          });
        }
        usersData.push({ id: document.id, ...data, createdAt });
      });
      setUsers(usersData);

      const progressData: any[] = [];
      progressSnap.forEach((doc: any) => {
        progressData.push({ id: doc.id, ...doc.data() });
      });
      setProgressRecords(progressData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessToast = (message: string, type: 'edit' | 'delete', userName?: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-[#1A1A24] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 border-r-4 ${
          type === 'delete' ? 'border-red-500' : 'border-green-500'
        } p-4 transition-all duration-300 ease-out`}
        dir="rtl"
      >
        <div className="flex-1 w-0 flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            type === 'delete' ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : 'bg-green-50 dark:bg-green-950/30 text-green-500'
          }`}>
            {type === 'delete' ? <Trash2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-black text-gray-900 dark:text-white">
              {message}
            </p>
            {userName && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-bold">
                {type === 'delete' ? `الاسم: ${userName}` : `تم تحديث ملف: ${userName}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex border-l border-gray-100 dark:border-gray-800 pl-3 ml-3 self-center shrink-0">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ), { duration: 4000 });
  };

  const confirmDelete = (userId: string) => {
    setUserToDelete(userId);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      const deletedUser = users.find(u => u.id === userToDelete);
      const userName = deletedUser ? deletedUser.name : '';
      await deleteDoc(doc(db, 'users', userToDelete));
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      showSuccessToast('تم حذف حساب الطالب بنجاح من قاعدة البيانات', 'delete', userName);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error('فشل حذف المستخدم. تأكد من الصلاحيات.');
    }
  };

  const handleArchiveToggle = async (user: any, archive: boolean) => {
    try {
      await updateDoc(doc(db, 'users', user.id), { isArchived: archive });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isArchived: archive } : u));
      if (archive) {
        toast.success(`تم أرشفة الطالب ${user.name || ''} بنجاح`);
      } else {
        toast.success(`تم استعادة الطالب ${user.name || ''} بنجاح`);
      }
    } catch (error) {
      console.error("Error toggling archive:", error);
      toast.error('فشل تغيير حالة الأرشفة');
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), editFormData);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editFormData } : u));
      showSuccessToast('تم تعديل بيانات الطالب وحفظها بنجاح', 'edit', editFormData.name || selectedUser.name);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error('فشل تحديث البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Extract unique subjects from teachers for dynamic filter
  const teacherSubjects = Array.from(new Set(
    users
      .filter(u => u.role === 'teacher' && u.subject)
      .map(u => u.subject.trim())
  )) as string[];

  const filteredUsers = users
    .filter(u => {
      if (activeTab === 'students') {
        const isStudent = u.role === 'student' || !u.role;
        if (!isStudent) return false;
        if (studentStatusFilter === 'active') {
          return !u.isArchived;
        } else {
          return u.isArchived === true;
        }
      }
      if (activeTab === 'teachers') return u.role === 'teacher';
      if (activeTab === 'parents') return u.role === 'parent';
      return false;
    })
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = (u.name || '').toLowerCase().includes(query);
      const emailMatch = (u.email || '').toLowerCase().includes(query);
      const phoneMatch = (u.phone || '').toLowerCase().includes(query);
      const gradeMatch = activeTab === 'students' && (u.grade || '').toLowerCase().includes(query);
      const subjectMatch = activeTab === 'teachers' && (u.subject || '').toLowerCase().includes(query);
      return nameMatch || emailMatch || phoneMatch || gradeMatch || subjectMatch;
    })
    .filter(u => {
      if (gradeFilter === 'all') return true;
      if (activeTab === 'students') {
        return u.grade === gradeFilter;
      }
      if (activeTab === 'teachers') {
        return Array.isArray(u.teachingGrades) && u.teachingGrades.includes(gradeFilter);
      }
      return true;
    })
    .filter(u => {
      if (activeTab !== 'teachers' || subjectFilter === 'all') return true;
      return (u.subject || '').trim() === subjectFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '', 'ar');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '', 'ar');
      }
      if (sortBy === 'date_desc') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      }
      if (sortBy === 'date_asc') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tA - tB;
      }
      return 0;
    });

  const studentsCount = users.filter(u => u.role === 'student' || !u.role).length;
  const teachersCount = users.filter(u => u.role === 'teacher').length;
  const parentsCount = users.filter(u => u.role === 'parent').length;

  return (
    <div className="space-y-6 print:hidden">
      {/* Upper Panel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
            لوحة تحكم الإدارة
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">إدارة جميع مستخدمي المنصة والصلاحيات وتصدير التقارير الرسمية</p>
        </div>
        <div className="flex items-center gap-2 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-4 py-2 rounded-2xl border border-[#00B4D8]/20 dark:border-[#D4AF37]/20">
          <Activity className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
          <span className="text-xs font-black text-[#00B4D8] dark:text-[#D4AF37]">النظام نشط ومحمي</span>
        </div>
      </div>

      {/* Summary Statistics Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#00B4D8] flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 block">إجمالي الطلاب</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{studentsCount} طالب</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 block">إجمالي المعلمين</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{teachersCount} معلم</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] p-5 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 block">أولياء الأمور</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{parentsCount} ولي أمر</span>
          </div>
        </div>
      </div>

      {/* Visual Statistics Dashboard */}
      <AdminVisualStats users={users} progressRecords={progressRecords} />

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="flex gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-3 mb-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-2 text-sm font-black transition-all relative ${
              activeTab === 'students'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            الطلاب ({users.filter(u => (u.role === 'student' || !u.role) && !u.isArchived).length})
            {activeTab === 'students' && (
              <motion.div layoutId="adminTab" className="absolute -bottom-3.5 left-0 right-0 h-1 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`pb-2 text-sm font-black transition-all relative ${
              activeTab === 'teachers'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            المعلمين ({teachersCount})
            {activeTab === 'teachers' && (
              <motion.div layoutId="adminTab" className="absolute -bottom-3.5 left-0 right-0 h-1 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('parents')}
            className={`pb-2 text-sm font-black transition-all relative ${
              activeTab === 'parents'
                ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            أولياء الأمور ({parentsCount})
            {activeTab === 'parents' && (
              <motion.div layoutId="adminTab" className="absolute -bottom-3.5 left-0 right-0 h-1 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-t-full" />
            )}
          </button>
        </div>

        {/* Student Active / Archived Sub-tabs */}
        {activeTab === 'students' && (
          <div className="flex gap-2 mb-5 bg-gray-50/50 dark:bg-[#12121A]/30 p-1 rounded-xl border border-gray-150 dark:border-[#2D2D3D] w-full max-w-xs animate-in fade-in duration-200">
            <button
              onClick={() => setStudentStatusFilter('active')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                studentStatusFilter === 'active'
                  ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white dark:text-[#0D0D12] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              النشطين ({users.filter(u => (u.role === 'student' || !u.role) && !u.isArchived).length})
            </button>
            <button
              onClick={() => setStudentStatusFilter('archived')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                studentStatusFilter === 'archived'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              المؤرشفين ({users.filter(u => (u.role === 'student' || !u.role) && u.isArchived).length})
            </button>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="bg-gray-50/50 dark:bg-[#0D0D12]/30 p-4 rounded-2xl border border-gray-150 dark:border-[#2D2D3D] mb-6 flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-5">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={
                  activeTab === 'students' 
                    ? "بحث عن طالب بالاسم، الهاتف، البريد أو الصف..." 
                    : activeTab === 'teachers' 
                      ? "بحث عن معلم بالاسم، الهاتف، البريد أو المادة..." 
                      : "بحث عن ولي أمر بالاسم، الهاتف أو البريد..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Grade Filter (Visible for students and teachers) */}
            {(activeTab === 'students' || activeTab === 'teachers') ? (
              <div className="relative md:col-span-3">
                <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">كل الصفوف الدراسية</option>
                  <option value="الأول الإعدادي">الأول الإعدادي</option>
                  <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                  <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                  <option value="الأول الثانوي">الأول الثانوي</option>
                  <option value="الثاني الثانوي">الثاني الثانوي</option>
                  <option value="الثالث الثانوي">الثالث الثانوي</option>
                </select>
              </div>
            ) : (
              <div className="hidden md:block md:col-span-3"></div>
            )}

            {/* Subject Filter (Visible only for teachers) */}
            {activeTab === 'teachers' ? (
              <div className="relative md:col-span-2">
                <BookOpen className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">كل التخصصات</option>
                  {teacherSubjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="hidden md:block md:col-span-2"></div>
            )}

            {/* Sorting */}
            <div className="relative md:col-span-2">
              <ArrowUpDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
              >
                <option value="name_asc">الاسم (أ - ي)</option>
                <option value="name_desc">الاسم (ي - أ)</option>
                <option value="date_desc">التسجيل (الأحدث)</option>
                <option value="date_asc">التسجيل (الأقدم)</option>
              </select>
            </div>
          </div>

          {/* Active filter badges / Reset indicator */}
          {(searchQuery || gradeFilter !== 'all' || subjectFilter !== 'all' || sortBy !== 'name_asc') && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-[#2D2D3D] pt-3 text-xs font-bold text-gray-500 dark:text-gray-400">
              <div className="flex flex-wrap items-center gap-2">
                <span>الفلاتر النشطة:</span>
                {searchQuery && (
                  <span className="bg-[#00B4D8]/10 text-[#00B4D8] dark:text-[#00B4D8] dark:bg-[#00B4D8]/5 px-2.5 py-1 rounded-lg border border-[#00B4D8]/20 flex items-center gap-1">
                    البحث: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                )}
                {gradeFilter !== 'all' && (
                  <span className="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 px-2.5 py-1 rounded-lg border border-purple-200/50 flex items-center gap-1">
                    الصف: {gradeFilter}
                    <button onClick={() => setGradeFilter('all')}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                )}
                {subjectFilter !== 'all' && (
                  <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200/50 flex items-center gap-1">
                    المادة: {subjectFilter}
                    <button onClick={() => setSubjectFilter('all')}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                )}
                {sortBy !== 'name_asc' && (
                  <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                    الترتيب: {
                      sortBy === 'name_desc' ? 'الاسم تنازلياً' :
                      sortBy === 'date_desc' ? 'الأحدث تسجيلاً' : 'الأقدم تسجيلاً'
                    }
                    <button onClick={() => setSortBy('name_asc')}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                )}
              </div>
              
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGradeFilter('all');
                  setSubjectFilter('all');
                  setSortBy('name_asc');
                }}
                className="text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors py-1 px-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#00B4D8] dark:text-[#D4AF37] animate-spin" />
          </div>
        ) : (
          <div className="overflow-auto max-h-[600px] relative rounded-2xl border border-gray-100 dark:border-[#2D2D3D]/50 scrollbar-thin">
            <table className="w-full min-w-[850px] text-right border-collapse relative">
              <thead className="sticky top-0 z-20 bg-white dark:bg-[#1A1A24]">
                <tr className="border-b border-gray-100 dark:border-[#2D2D3D]">
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">الاسم والبيانات</th>
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">البريد الإلكتروني</th>
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">رقم الهاتف</th>
                  {activeTab === 'students' && <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">الصف الدراسي</th>}
                  {activeTab === 'teachers' && <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">المادة</th>}
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-right shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">تاريخ التسجيل</th>
                  <th className="sticky top-0 bg-white dark:bg-[#1A1A24] py-3.5 px-4 text-xs font-black text-gray-400 z-10 text-center shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">التحكم والعمليات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'students' || activeTab === 'teachers' ? 6 : 5} className="py-16 text-center text-gray-400 dark:text-gray-500 font-bold text-sm">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-[#0D0D12] border border-dashed border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-400">
                          <SlidersHorizontal className="w-7 h-7 stroke-[1.5]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-900 dark:text-white font-black text-base">لم يتم العثور على نتائج</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">جرب تعديل كلمات البحث أو تصفية الفلاتر للحصول على نتائج مغايرة.</p>
                        </div>
                        {(searchQuery || gradeFilter !== 'all' || subjectFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setGradeFilter('all');
                              setSubjectFilter('all');
                              setSortBy('name_asc');
                            }}
                            className="mt-2 text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] hover:underline flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            إعادة تعيين كافة الفلاتر والبحث
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 dark:border-[#2D2D3D]/50 hover:bg-gray-50 dark:hover:bg-[#0D0D12] transition-colors">
                    {/* Beautiful styled user avatar and name */}
                    <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0 ${
                          user.role === 'teacher' ? 'bg-purple-500' : user.role === 'parent' ? 'bg-amber-500' : user.role === 'admin' ? 'bg-red-500' : 'bg-[#00B4D8]'
                        }`}>
                          {(user.name || 'ب').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-black text-gray-900 dark:text-white text-sm">{user.name || 'بدون اسم'}</span>
                          <span className="block text-[10px] font-bold text-gray-400 mt-0.5 md:hidden">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400" dir="ltr">{user.phone || '-'}</td>
                    
                    {/* Modern pill styled attributes */}
                    {activeTab === 'students' && (
                      <td className="py-2.5 px-4">
                        <span className="bg-blue-50 text-[#00B4D8] dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 py-0.5 px-2.5 rounded-lg text-[11px] font-black inline-block">
                          {user.grade || '-'}
                        </span>
                      </td>
                    )}
                    {activeTab === 'teachers' && (
                      <td className="py-2.5 px-4">
                        <span className="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 py-0.5 px-2.5 rounded-lg text-[11px] font-black inline-block">
                          {user.subject || '-'}
                        </span>
                      </td>
                    )}
                    
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold">
                        <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-[11px]">{formatRegistrationDate(user.createdAt)}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModalPassword(false);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="عرض البيانات الشاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setEditFormData(user);
                            setEditModalOpen(true);
                          }}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="تعديل الحساب"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            // Auto fill title
                            setCustomReportTitle(
                              user.role === 'student' ? 'تقرير الملف الدراسي للطالب' :
                              user.role === 'teacher' ? 'تقرير السجل المهني للمعلم' : 'تقرير السجل العام لولي الأمر'
                            );
                            setPrintModalOpen(true);
                          }}
                          className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="معاينة وطباعة تقرير رسمي"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {(user.role === 'student' || !user.role) ? (
                          <>
                            {!user.isArchived ? (
                              <button 
                                onClick={() => handleArchiveToggle(user, true)}
                                className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors animate-in fade-in zoom-in duration-200"
                                title="أرشفة حساب الطالب"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleArchiveToggle(user, false)}
                                  className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors animate-in fade-in zoom-in duration-200"
                                  title="استعادة حساب الطالب"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => confirmDelete(user.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors animate-in fade-in zoom-in duration-200"
                                  title="حذف الحساب نهائياً من الأرشيف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <button 
                            onClick={() => confirmDelete(user.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="حذف الحساب نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {viewModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-sm relative z-10 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
              {/* Fixed Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-[#2D2D3D] shrink-0">
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" /> تفاصيل حساب المستخدم
                </h3>
                <button onClick={() => setViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Profile Card Header */}
                <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-[#0D0D12]/30 p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md shrink-0 ${
                  selectedUser.role === 'teacher' ? 'bg-purple-500 shadow-purple-500/20' : selectedUser.role === 'parent' ? 'bg-amber-500 shadow-amber-500/20' : selectedUser.role === 'admin' ? 'bg-red-500 shadow-red-500/20' : 'bg-[#00B4D8] shadow-[#00B4D8]/20'
                }`}>
                  {(selectedUser.name || 'ب').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-0.5 text-right min-w-0">
                  <h4 className="text-base font-black text-gray-900 dark:text-white truncate">{selectedUser.name || 'بدون اسم'}</h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      selectedUser.role === 'teacher' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' :
                      selectedUser.role === 'parent' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                      selectedUser.role === 'admin' ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                      'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    }`}>
                      {selectedUser.role === 'teacher' ? 'معلم' :
                       selectedUser.role === 'parent' ? 'ولي أمر' :
                       selectedUser.role === 'admin' ? 'مدير' : 'طالب'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      سجل في: {formatRegistrationDate(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-2.5 text-sm font-bold">
                {/* Email */}
                <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="w-8.5 h-8.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center shrink-0 ml-2.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">البريد الإلكتروني</span>
                    <span className="text-gray-900 dark:text-white text-xs truncate block font-mono" title={selectedUser.email}>{selectedUser.email || '-'}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="w-8.5 h-8.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[#00B4D8] flex items-center justify-center shrink-0 ml-2.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">رقم الهاتف</span>
                    <span className="text-gray-900 dark:text-white text-xs block font-mono" dir="ltr">{selectedUser.phone || '-'}</span>
                  </div>
                </div>

                {/* Password */}
                <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="w-8.5 h-8.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0 ml-2.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">كلمة المرور</span>
                    <span className="text-gray-900 dark:text-white text-xs font-mono block">
                      {showModalPassword ? (selectedUser.password || '123456') : '••••••••'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-[#2D2D3D] rounded-lg transition-colors shrink-0"
                    title={showModalPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Governorate */}
                <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  <div className="w-8.5 h-8.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center shrink-0 ml-2.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">المحافظة</span>
                    <span className="text-gray-900 dark:text-white text-xs block">{selectedUser.governorate || 'غير محدد'}</span>
                  </div>
                </div>

                {/* --- Student specific fields --- */}
                {selectedUser.role === 'student' && (
                  <>
                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center shrink-0 ml-2.5">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">الصف الدراسي</span>
                        <span className="text-gray-900 dark:text-white text-xs block">{selectedUser.grade || 'غير محدد'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-500 flex items-center justify-center shrink-0 ml-2.5">
                        <School className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">المدرسة</span>
                        <span className="text-gray-900 dark:text-white text-xs block truncate" title={selectedUser.school}>{selectedUser.school || 'غير محدد'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-500 flex items-center justify-center shrink-0 ml-2.5">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">رقم هاتف ولي الأمر</span>
                        <span className="text-gray-900 dark:text-white text-xs block font-mono" dir="ltr">{selectedUser.parentPhone || 'غير مسجل'}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* --- Teacher specific fields --- */}
                {selectedUser.role === 'teacher' && (
                  <>
                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shrink-0 ml-2.5">
                        <Book className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">المادة الدراسية</span>
                        <span className="text-gray-900 dark:text-white text-xs block">{selectedUser.subject || 'غير محدد'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center shrink-0 ml-2.5">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">الرقم القومي</span>
                        <span className="text-gray-900 dark:text-white text-xs font-mono block">{selectedUser.nationalId || 'غير مسجل'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center shrink-0 ml-2.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">تاريخ الميلاد</span>
                        <span className="text-gray-900 dark:text-white text-xs block font-mono">{selectedUser.dateOfBirth || 'غير مسجل'}</span>
                      </div>
                    </div>

                    <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="w-8.5 h-8.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center shrink-0 ml-2.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">الصفوف المسندة</span>
                        <span className="text-gray-900 dark:text-white text-xs block truncate" title={Array.isArray(selectedUser.teachingGrades) ? selectedUser.teachingGrades.join('، ') : selectedUser.teachingGrades}>
                          {Array.isArray(selectedUser.teachingGrades) ? selectedUser.teachingGrades.join('، ') : selectedUser.teachingGrades || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* --- Parent specific fields --- */}
                {selectedUser.role === 'parent' && (
                  <div className="flex items-center p-2.5 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                    <div className="w-8.5 h-8.5 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-500 flex items-center justify-center shrink-0 ml-2.5">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-400 dark:text-gray-500 block text-[9px] mb-0.5">رقم هاتف الطالب المرتبط</span>
                      <span className="text-gray-900 dark:text-white text-xs block font-mono" dir="ltr">{selectedUser.studentPhone || 'غير مسجل'}</span>
                    </div>
                  </div>
                )}
              </div>
              </div>
              
              {/* Fixed Footer */}
              <div className="p-5 border-t border-gray-100 dark:border-[#2D2D3D] shrink-0">
                <button 
                  onClick={() => setViewModalOpen(false)} 
                  className="w-full px-5 py-2.5 bg-[#00B4D8] hover:bg-[#0077B6] text-white rounded-xl transition-all font-bold text-xs shadow-md shadow-[#00B4D8]/10"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSaving && setEditModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-500" /> تعديل بيانات المستخدم
                </h3>
                <button onClick={() => !isSaving && setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">الاسم</label>
                  <input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">رقم الهاتف</label>
                  <input type="tel" value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                </div>
                {selectedUser.role === 'student' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">الصف الدراسي</label>
                    <input type="text" value={editFormData.grade || ''} onChange={e => setEditFormData({...editFormData, grade: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">كلمة المرور (إن وجدت)</label>
                  <input type="text" value={editFormData.password || ''} onChange={e => setEditFormData({...editFormData, password: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-[#00B4D8] dark:text-white font-bold" />
                </div>
                <button type="submit" disabled={isSaving} className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all mt-4 flex justify-center items-center gap-2 shadow-lg">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التعديلات'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advanced Print / Preview Modal */}
      <AnimatePresence>
        {printModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPrintModalOpen(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-gray-100 dark:bg-[#0D0D12] rounded-3xl w-full max-w-5xl relative z-10 shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[92vh]"
            >
              
              {/* Settings and options Panel (Left column) */}
              <div className="w-full md:w-[40%] bg-white dark:bg-[#1A1A24] p-6 border-b md:border-b-0 md:border-l border-gray-200 dark:border-[#2D2D3D] flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-[#2D2D3D]">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Printer className="w-5 h-5 text-purple-500" />
                        تخصيص ومعاينة التقرير
                      </h3>
                      <p className="text-xs text-gray-400 font-bold mt-1">اضبط بيانات ومعايير التقرير قبل الطباعة</p>
                    </div>
                    <button 
                      onClick={() => setPrintModalOpen(false)} 
                      className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#2D2D3D] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Report Configuration form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-1.5">عنوان التقرير الرسمي</label>
                      <input 
                        type="text" 
                        value={customReportTitle}
                        onChange={(e) => setCustomReportTitle(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-purple-500 dark:text-white"
                        placeholder="مثال: تقرير السجل الدراسي الشامل"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-1.5">الفترة الزمنية للتقرير</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button 
                          onClick={() => setPrintDateRange('all')} 
                          className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                            printDateRange === 'all' 
                              ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-[#0D0D12] dark:border-[#2D2D3D] dark:text-gray-400'
                          }`}
                        >
                          شامل
                        </button>
                        <button 
                          onClick={() => setPrintDateRange('month')} 
                          className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                            printDateRange === 'month' 
                              ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-[#0D0D12] dark:border-[#2D2D3D] dark:text-gray-400'
                          }`}
                        >
                          شهر محدد
                        </button>
                        <button 
                          onClick={() => setPrintDateRange('custom')} 
                          className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                            printDateRange === 'custom' 
                              ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-[#0D0D12] dark:border-[#2D2D3D] dark:text-gray-400'
                          }`}
                        >
                          نطاق مخصص
                        </button>
                      </div>
                    </div>

                    {printDateRange === 'month' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-black text-gray-400 block mb-1.5">حدد الشهر المشمول بالتقرير</label>
                        <input 
                          type="month" 
                          value={printMonth}
                          onChange={(e) => setPrintMonth(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-purple-500 dark:text-white" 
                        />
                      </div>
                    )}

                    {printDateRange === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 block mb-1">من تاريخ</label>
                          <input 
                            type="date" 
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-purple-500 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 block mb-1">إلى تاريخ</label>
                          <input 
                            type="date" 
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-purple-500 dark:text-white" 
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-1.5">ملاحظات أو توصيات إضافية (تظهر بالتقرير)</label>
                      <textarea 
                        value={customReportNotes}
                        onChange={(e) => setCustomReportNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-purple-500 dark:text-white resize-none leading-relaxed"
                        placeholder="اكتب أي ملاحظات سلوكية أو أكاديمية أو تقديرية لإضافتها لأسفل التقرير..."
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-[#2D2D3D] space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showSignatures}
                          onChange={(e) => setShowSignatures(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-gray-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 select-none">تضمين ختم وتوقيع المنصة الرسمي</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 dark:border-[#2D2D3D]">
                  <button 
                    onClick={handlePrint} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 text-sm"
                  >
                    <Printer className="w-5 h-5" />
                    طباعة التقرير الآن
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2.5 font-bold">يرجى التأكد من تفعيل "خيار الألوان والخلفيات" في إعدادات الطباعة للحصول على مظهر ممتاز</p>
                </div>
              </div>

              {/* Live Interactive Preview Container (Right column) */}
              <div className="w-full md:w-[60%] p-6 md:p-8 overflow-y-auto bg-gray-200 dark:bg-[#0D0D12] flex flex-col items-center justify-start gap-4">
                <div className="w-full flex justify-between items-center text-xs font-black text-gray-500 dark:text-gray-400 pb-2">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#00B4D8] animate-pulse" />
                    معاينة حية للمستند قبل الطباعة
                  </span>
                  <span>الورقة الافتراضية (A4)</span>
                </div>

                {/* Simulated Paper Sheet */}
                <div 
                  className="w-full bg-white text-slate-800 shadow-xl rounded-2xl p-6 md:p-8 font-sans relative border border-gray-300 select-text max-w-[210mm] min-h-[297mm] flex flex-col justify-between" 
                  dir="rtl"
                >
                  <div>
                    {/* Header Banner */}
                    <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00B4D8] to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">أكاديمية التميز التعليمية</h2>
                          <p className="text-[10px] text-slate-500 font-bold">المنصة التعليمية الشاملة لإدارة الطلاب</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-400 block">رقم المستند المرجعي</span>
                        <span className="text-xs font-mono font-black text-slate-800">#REP-{selectedUser.id?.substring(0, 8).toUpperCase() || '0000'}</span>
                      </div>
                    </div>

                    {/* Decorative Watermark logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                      <GraduationCap className="w-80 h-80 text-slate-900" />
                    </div>

                    {/* Report Title */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-black text-slate-900 bg-slate-100/80 py-2 px-5 rounded-xl inline-block border border-slate-200">
                        {customReportTitle || 'تقرير معلومات مستخدم رسمي'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 font-bold">
                        {printDateRange === 'month' && printMonth ? `عن شهر: ${printMonth}` : 
                         printDateRange === 'custom' && (reportStartDate || reportEndDate) ? `عن الفترة من: ${reportStartDate || 'البداية'} إلى: ${reportEndDate || 'النهاية'}` : 
                         'تاريخ الإصدار: شامل لجميع البيانات'}
                      </p>
                    </div>

                    {/* Formatted Student Details Bento Panels */}
                    <div className="space-y-5 relative z-10">
                      
                      {/* Section 1: User Profile Details */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h4 className="text-xs font-black text-slate-400 mb-3 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          البيانات الشخصية والأساسية
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-sm font-bold text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">اسم المستخدم:</span>
                            <span className="text-slate-900">{selectedUser.name || 'بدون اسم'}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">البريد الإلكتروني:</span>
                            <span className="text-slate-900 font-mono text-xs">{selectedUser.email || '-'}</span>
                          </div>

                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">رقم الهاتف:</span>
                            <span className="text-slate-900 font-mono" dir="ltr">{selectedUser.phone || '-'}</span>
                          </div>

                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">تاريخ التسجيل بالمنصة:</span>
                            <span className="text-slate-900">
                              {formatRegistrationDate(selectedUser.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Account role & specific educational attributes */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h4 className="text-xs font-black text-slate-400 mb-3 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          الحالة التعليمية والصلاحيات
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-sm font-bold text-slate-800">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">الدور / الصلاحية بالمنصة:</span>
                            <span className="text-slate-900">
                              {selectedUser.role === 'student' ? 'طالب' : selectedUser.role === 'teacher' ? 'معلم كادر' : selectedUser.role === 'parent' ? 'ولي أمر' : 'مستخدم عام'}
                            </span>
                          </div>

                          {selectedUser.role === 'student' && (
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-medium">الصف الدراسي المقيد به:</span>
                              <span className="text-[#00B4D8]">{selectedUser.grade || 'غير محدد'}</span>
                            </div>
                          )}

                          {selectedUser.role === 'teacher' && (
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-medium">المادة الدراسية المسندة:</span>
                              <span className="text-purple-600">{selectedUser.subject || 'غير محدد'}</span>
                            </div>
                          )}

                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-medium">حالة تسجيل الدخول والنشاط:</span>
                            <span className="text-emerald-600 flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              حساب نشط ومفعل
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Event & Academic records section based on date range */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h4 className="text-xs font-black text-slate-400 mb-3 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                          {selectedUser.role === 'teacher' ? 'سجل الأنشطة والحصص التعليمية' : 
                           selectedUser.role === 'parent' ? 'سجل متابعة الحساب وأولياء الأمور' : 
                           'سجل الاختبارات والدرجات الأكاديمية'}
                        </h4>
                        
                        {getMockReportRecords(selectedUser.role || 'student', printDateRange, printMonth, reportStartDate, reportEndDate).length > 0 ? (
                          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-slate-100 font-extrabold text-slate-600 border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5">البيان / الإجراء الدراسي</th>
                                  <th className="p-2.5">النوع</th>
                                  <th className="p-2.5 text-center">النتيجة والتقييم</th>
                                  <th className="p-2.5 text-center">التاريخ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                {getMockReportRecords(selectedUser.role || 'student', printDateRange, printMonth, reportStartDate, reportEndDate).map((rec: any) => (
                                  <tr key={rec.id} className="hover:bg-slate-50/50">
                                    <td className="p-2.5">{rec.name}</td>
                                    <td className="p-2.5 text-slate-400 font-medium">{rec.type}</td>
                                    <td className="p-2.5 text-center text-purple-600 font-extrabold">{rec.details}</td>
                                    <td className="p-2.5 text-center font-mono text-slate-400">{rec.date}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-black flex flex-col items-center justify-center gap-1.5">
                            <Clock className="w-5 h-5 text-slate-300 animate-pulse" />
                            <span>لا توجد سجلات دراسية متوفرة في النطاق الزمني المحدد</span>
                          </div>
                        )}
                      </div>

                      {/* Mock Academic stats to make document look complete */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h4 className="text-xs font-black text-slate-400 mb-3 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          مؤشرات التفاعل والنشاط العام
                        </h4>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                            <span className="text-[10px] text-slate-400 block mb-1">نسبة الحضور</span>
                            <span className="text-base font-black text-emerald-600">98%</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                            <span className="text-[10px] text-slate-400 block mb-1">إكمال الواجبات</span>
                            <span className="text-base font-black text-[#00B4D8]">92%</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                            <span className="text-[10px] text-slate-400 block mb-1">نقاط التميز</span>
                            <span className="text-base font-black text-purple-600">340 نقطة</span>
                          </div>
                        </div>
                      </div>

                      {/* Custom Admin Notes if specified */}
                      {customReportNotes && (
                        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 text-sm font-bold text-slate-800 animate-in fade-in duration-200">
                          <h4 className="font-extrabold text-amber-800 mb-1.5 flex items-center gap-1.5 text-xs">
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            توصيات وملاحظات الإدارة واللجنة التعليمية:
                          </h4>
                          <p className="text-slate-700 font-medium leading-relaxed text-xs">{customReportNotes}</p>
                        </div>
                      )}

                      {/* Signatures Panel */}
                      {showSignatures && (
                        <div className="grid grid-cols-2 gap-6 pt-6 mt-8 border-t border-slate-200">
                          <div className="text-center font-bold">
                            <p className="text-slate-400 text-[10px]">توقيع مدير الشؤون التعليمية</p>
                            <div className="h-10 flex items-center justify-center">
                              <span className="text-xs font-mono text-slate-300 italic">مكتب الإشراف العام</span>
                            </div>
                            <p className="text-slate-800 text-[10px]">---------------------------</p>
                          </div>
                          <div className="text-center font-bold relative">
                            <p className="text-slate-400 text-[10px]">ختم وتوقيع المنصة الرسمي</p>
                            <div className="h-10 flex items-center justify-center relative">
                              {/* Virtual stamp illustration */}
                              <div className="w-14 h-14 rounded-full border-4 border-double border-red-500/20 flex items-center justify-center text-[7px] font-black text-red-500/20 rotate-12 absolute">
                                أكاديمية التميز
                              </div>
                            </div>
                            <p className="text-slate-800 text-[10px]">---------------------------</p>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="text-center text-[8px] font-black text-slate-400 mt-10 border-t border-slate-100 pt-3">
                    تم إصدار هذا التقرير إلكترونياً وبشكل آمن من خلال لوحة تحكم المنصة في {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Actual Pure Print Layout (Hidden on screen, shown ONLY on print) */}
      {printModalOpen && selectedUser && (
        <div className="hidden print:block bg-white text-black min-h-screen w-full p-12 relative printable-area" dir="rtl">
          
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-sm">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-black">أكاديمية التميز التعليمية</h2>
                <p className="text-xs text-slate-500 font-bold">المنصة التعليمية الشاملة لإدارة الطلاب</p>
              </div>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 block">رقم المستند المرجعي</span>
              <span className="text-sm font-mono font-black text-black">#REP-{selectedUser.id?.substring(0, 8).toUpperCase() || '0000'}</span>
            </div>
          </div>

          {/* Watermark logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <GraduationCap className="w-[450px] h-[450px] text-black" />
          </div>

          {/* Report Title */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-black bg-slate-100 py-2 px-6 rounded-xl inline-block border border-slate-300">
              {customReportTitle || 'تقرير معلومات مستخدم رسمي'}
            </h3>
            <p className="text-sm text-slate-600 mt-2 font-bold">
              {printDateRange === 'month' && printMonth ? `عن شهر: ${printMonth}` : 
               printDateRange === 'custom' && (reportStartDate || reportEndDate) ? `عن الفترة من: ${reportStartDate || 'البداية'} إلى: ${reportEndDate || 'النهاية'}` : 
               'تاريخ الإصدار: شامل لجميع البيانات'}
            </p>
          </div>

          {/* User Details sections */}
          <div className="space-y-6">
            
            {/* Section 1: Personal info */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-300 pb-1">
                البيانات الشخصية والأساسية
              </h4>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-bold">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">اسم المستخدم:</span>
                  <span className="text-black">{selectedUser.name || 'بدون اسم'}</span>
                </div>
                
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">البريد الإلكتروني:</span>
                  <span className="text-black font-mono">{selectedUser.email || '-'}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="text-black font-mono" dir="ltr">{selectedUser.phone || '-'}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">تاريخ التسجيل بالمنصة:</span>
                  <span className="text-black">
                    {formatRegistrationDate(selectedUser.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Account specific education credentials */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-300 pb-1">
                الحالة التعليمية والصلاحيات
              </h4>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-bold">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">الدور / الصلاحية بالمنصة:</span>
                  <span className="text-black">
                    {selectedUser.role === 'student' ? 'طالب' : selectedUser.role === 'teacher' ? 'معلم كادر' : selectedUser.role === 'parent' ? 'ولي أمر' : 'مستخدم عام'}
                  </span>
                </div>

                {selectedUser.role === 'student' && (
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">الصف الدراسي المقيد به:</span>
                    <span className="text-black font-extrabold">{selectedUser.grade || 'غير محدد'}</span>
                  </div>
                )}

                {selectedUser.role === 'teacher' && (
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">المادة الدراسية المسندة:</span>
                    <span className="text-black font-extrabold">{selectedUser.subject || 'غير محدد'}</span>
                  </div>
                )}

                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">حالة الحساب والنشاط:</span>
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    ✓ حساب نشط ومفعل بالكامل
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Event & Academic records section based on date range (Printable) */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-300 pb-1">
                {selectedUser.role === 'teacher' ? 'سجل الأنشطة والحصص التعليمية' : 
                 selectedUser.role === 'parent' ? 'سجل متابعة الحساب وأولياء الأمور' : 
                 'سجل الاختبارات والدرجات الأكاديمية'}
              </h4>
              
              {getMockReportRecords(selectedUser.role || 'student', printDateRange, printMonth, reportStartDate, reportEndDate).length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">البيان / الإجراء الدراسي</th>
                        <th className="p-3">النوع</th>
                        <th className="p-3 text-center">النتيجة والتقييم</th>
                        <th className="p-3 text-center">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {getMockReportRecords(selectedUser.role || 'student', printDateRange, printMonth, reportStartDate, reportEndDate).map((rec: any) => (
                        <tr key={rec.id}>
                          <td className="p-3 font-semibold">{rec.name}</td>
                          <td className="p-3 text-slate-500">{rec.type}</td>
                          <td className="p-3 text-center font-bold text-slate-900">{rec.details}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{rec.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-400 font-bold">
                  لا توجد سجلات دراسية متوفرة في النطاق الزمني المحدد
                </div>
              )}
            </div>

            {/* Mock stats */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-200 pb-1">
                مؤشرات التفاعل والنشاط العام
              </h4>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">نسبة الحضور</span>
                  <span className="text-lg font-black text-black">98%</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">إكمال الواجبات</span>
                  <span className="text-lg font-black text-black">92%</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">نقاط التميز الأكاديمي</span>
                  <span className="text-lg font-black text-black">340 نقطة</span>
                </div>
              </div>
            </div>

            {/* Custom Notes if any */}
            {customReportNotes && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-300">
                <h4 className="text-sm font-extrabold text-black mb-2">
                  توصيات وملاحظات الإدارة واللجنة التعليمية:
                </h4>
                <p className="text-slate-800 leading-relaxed text-sm font-medium">{customReportNotes}</p>
              </div>
            )}

            {/* Signatures */}
            {showSignatures && (
              <div className="grid grid-cols-2 gap-12 pt-8 mt-12 border-t border-slate-300">
                <div className="text-center font-bold">
                  <p className="text-slate-500 text-xs">توقيع مدير الشؤون التعليمية</p>
                  <div className="h-14 flex items-center justify-center">
                    <span className="text-xs italic text-slate-400">مكتب الإشراف العام</span>
                  </div>
                  <p className="text-black text-xs">---------------------------</p>
                </div>
                <div className="text-center font-bold">
                  <p className="text-slate-500 text-xs">ختم وتوقيع المنصة الرسمي</p>
                  <div className="h-14 flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full border-4 border-double border-red-500/20 flex items-center justify-center text-[8px] font-black text-red-500/20 rotate-12 absolute">
                      أكاديمية التميز
                    </div>
                  </div>
                  <p className="text-black text-xs">---------------------------</p>
                </div>
              </div>
            )}

          </div>

          <div className="text-center text-[10px] font-bold text-slate-400 mt-16 border-t border-slate-200 pt-4 absolute bottom-8 left-12 right-12">
            تم إصدار هذا التقرير إلكترونياً وبشكل آمن من خلال لوحة تحكم المنصة في {new Date().toLocaleDateString('ar-EG')}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteModalOpen(false)} 
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d3d52] transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={executeDelete} 
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
