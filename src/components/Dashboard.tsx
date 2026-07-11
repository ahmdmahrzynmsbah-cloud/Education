import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Lock, BookOpen, Star, MessageCircleQuestion, CheckCircle, Ticket, LogOut, Trophy, Flame, Bell, Target, ArrowLeft, Video, Bot, Users, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import TeacherClasses from './TeacherClasses';
import StudentCourses from './StudentCourses';

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

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === 'TF-1234-5678-9012') {
      setActivationStatus('success');
    } else {
      setActivationStatus('error');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] flex items-center justify-center">
        <div className="w-16 h-16 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-lg animate-pulse">
          ت
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white flex flex-col md:flex-row font-sans selection:bg-primary/30" dir="rtl">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-[#1A1A24] border-l border-gray-200 dark:border-[#2D2D3D] flex flex-col shrink-0 shadow-sm z-10 hidden md:flex">
        <div className="p-6 border-b border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30">
                ت
            </div>
            <span className="text-xl font-black tracking-tight text-[#0077B6] dark:text-[#B8860B]">تفوق</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {(userData?.role === 'teacher' ? [
            { id: 'home', label: 'الرئيسية', icon: Target },
            { id: 'classes', label: 'فصولي', icon: Users },
            { id: 'analytics', label: 'التقارير', icon: Flame },
            { id: 'wallet', label: 'المحفظة', icon: Ticket },
          ] : userData?.role === 'parent' ? [
            { id: 'home', label: 'الرئيسية', icon: Target },
            { id: 'reports', label: 'تقارير الطالب', icon: Flame },
            { id: 'wallet', label: 'محفظة الطالب', icon: Ticket },
            { id: 'messages', label: 'تواصل مع المعلمين', icon: Users },
          ] : [
            { id: 'home', label: 'الرئيسية', icon: Target },
            { id: 'subjects', label: 'موادي', icon: BookOpen },
            { id: 'live', label: 'حصص لايف', icon: Video },
            { id: 'ai', label: 'المساعد الذكي', icon: Bot },
            { id: 'league', label: 'الدوري', icon: Trophy },
            { id: 'activate', label: 'شحن رصيد', icon: Ticket },
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

        <div className="p-4 border-t border-gray-200 dark:border-[#2D2D3D]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-bold text-sm">
            <LogOut className="w-5 h-5" /> تسجيل خروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white dark:bg-[#1A1A24] border-b border-gray-200 dark:border-[#2D2D3D] px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-3 md:hidden">
              <div className="w-8 h-8 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30">
                  ت
              </div>
           </div>

           <div className="hidden md:flex flex-col">
              <h2 className="font-black text-lg text-gray-900 dark:text-white">أهلاً بك، {userData?.name?.split(' ')[0] || 'المستخدم'} 👋</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mt-1">
                {userData?.role === 'teacher' ? `معلم ${userData?.subject || ''}` : userData?.role === 'parent' ? 'ولي أمر' : (userData?.grade || 'طالب')}
              </p>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#00B4D8]/20 dark:bg-[#D4AF37]/20 px-3 py-1.5 rounded-full text-[#00B4D8] dark:text-[#D4AF37] font-black text-sm">
                 <Flame className="w-4 h-4 fill-[#00B4D8] dark:fill-[#D4AF37]" /> 5 أيام
              </div>
              <div className="flex items-center gap-2 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-3 py-1.5 rounded-full text-[#0077B6] dark:text-[#B8860B] font-black text-sm">
                 <Star className="w-4 h-4 fill-[#00B4D8] dark:fill-[#D4AF37]" /> 2,450
              </div>
              <ThemeToggle />
              <button className="w-10 h-10 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#222230] transition-colors">
                 <Bell className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gray-200 dark:bg-[#2D2D3D] rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-gray-500 text-lg">
                 {userData?.name?.charAt(0) || 'U'}
              </div>
           </div>
        </header>

        <div className="p-6 md:p-8 flex-1 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                {userData?.role === 'teacher' && (
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MOCK_TEACHER_STATS.map((stat) => (
                      <div key={stat.id} className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4">
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

                {userData?.role === 'parent' && (
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MOCK_PARENT_STATS.map((stat) => (
                      <div key={stat.id} className="bg-white dark:bg-[#1A1A24] rounded-3xl p-5 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex items-center gap-4">
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
                       <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-md transition-shadow cursor-pointer">
                          <div className="w-full md:w-48 aspect-video bg-gray-900 rounded-2xl relative flex items-center justify-center overflow-hidden shrink-0">
                             <div className="w-12 h-12 bg-white dark:bg-[#1A1A24]/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                <Play className="w-5 h-5 text-white ml-1" />
                             </div>
                             <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-bold">04:20</div>
                          </div>
                          <div className="flex-1 w-full text-right">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-600 rounded">الكيمياء</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">الوحدة الثانية • الدرس الأول</span>
                             </div>
                             <h3 className="text-lg font-black mb-3 text-gray-900 dark:text-white group-hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">تفاعلات الأكسدة والاختزال</h3>
                             
                             <div className="w-full bg-gray-100 dark:bg-[#222230] rounded-full h-2 mb-2" dir="ltr">
                                <div className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full" style={{ width: '65%' }}></div>
                             </div>
                             <p className="text-xs text-gray-500 dark:text-gray-400 font-bold text-right">متبقي دقيقتين</p>
                          </div>
                          <div className="hidden md:flex shrink-0">
                             <div className="w-12 h-12 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center group-hover:bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 group-hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                             </div>
                          </div>
                       </div>
                    </section>

                    {/* My Subjects */}
                    <section>
                      <StudentCourses userData={userData} />
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
                  <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">شحن رصيد تفوق</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">أدخل الكود المكون من 12 رقم الموجود في كارت تفوق</p>
                  
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

            {['league', 'live', 'ai', 'messages'].includes(activeTab) && (
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
                  
                  {userData?.role === 'teacher' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D]">
                         <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">أداء الطلاب</h3>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-medium">
                               <span className="text-gray-600 dark:text-gray-300">متوسط درجات الاختبارات</span>
                               <span className="text-[#00B4D8] dark:text-[#D4AF37] font-bold">85%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-2">
                               <div className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                         </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#0D0D12] p-6 rounded-2xl border border-gray-200 dark:border-[#2D2D3D]">
                         <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">التفاعل الأسبوعي</h3>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-medium">
                               <span className="text-gray-600 dark:text-gray-300">نسبة مشاهدة الدروس</span>
                               <span className="text-green-500 font-bold">92%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-2">
                               <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                            </div>
                         </div>
                      </div>
                    </div>
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
                <div className="bg-gradient-to-br from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-white/80 font-medium mb-1">الرصيد الكلي</p>
                        <h2 className="text-4xl font-black">
                          {userData?.role === 'teacher' ? '4,500' : '150'} <span className="text-xl font-medium">ج.م</span>
                        </h2>
                      </div>
                      <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                        <Ticket className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    {userData?.role === 'student' && (
                      <button onClick={() => setActiveTab('activate')} className="bg-white text-[#00B4D8] dark:text-[#D4AF37] px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors">
                        شحن الرصيد
                      </button>
                    )}
                    {userData?.role === 'teacher' && (
                      <button className="bg-white text-[#00B4D8] dark:text-[#D4AF37] px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors">
                        طلب سحب الأرباح
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">سجل المعاملات</h3>
                   <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                     <p className="font-medium">لا توجد معاملات سابقة حتى الآن.</p>
                   </div>
                </div>
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
        {(userData?.role === 'teacher' ? [
            { id: 'home', icon: Target, label: 'الرئيسية' },
            { id: 'classes', icon: Users, label: 'فصولي' },
            { id: 'analytics', icon: Flame, label: 'التقارير' },
            { id: 'wallet', icon: Ticket, label: 'المحفظة' },
        ] : userData?.role === 'parent' ? [
            { id: 'home', icon: Target, label: 'الرئيسية' },
            { id: 'reports', icon: Flame, label: 'التقارير' },
            { id: 'wallet', icon: Ticket, label: 'المحفظة' },
            { id: 'messages', icon: Users, label: 'الرسائل' },
        ] : [
            { id: 'home', icon: Target, label: 'الرئيسية' },
            { id: 'subjects', icon: BookOpen, label: 'موادي' },
            { id: 'ai', icon: Bot, label: 'مساعد' },
            { id: 'league', icon: Trophy, label: 'الدوري' },
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
