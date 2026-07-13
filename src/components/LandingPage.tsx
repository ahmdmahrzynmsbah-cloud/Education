import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, BookOpen, GraduationCap, Play, Star, Users, Trophy, Award, ChevronDown, CheckCircle2, 
  Sparkles, Mail, Send, CheckCircle, ArrowUpRight, Shield, Heart, Zap, Phone, MapPin, MessageSquare,
  Calculator, FlaskConical, Dna, Languages, BookOpenText, Scroll, Globe, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Subject Browser States
  const [selectedLandingSubject, setSelectedLandingSubject] = useState<string | null>(null);
  const [subjectCourses, setSubjectCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Legal and Help Modals State
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'copyright' | 'support' | null>(null);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const handleSupportSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) return;
    setSupportSubmitting(true);
    setTimeout(() => {
      setSupportSubmitting(false);
      setSupportSubmitted(true);
      setSupportMessage('');
    }, 1200);
  };

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubscribed(true);
      setEmailInput('');
    }, 1000);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'student')
        );
        const snapshot = await getDocs(q);
        const studentsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'طالب مجهول',
            points: Number(data.points) || 500,
            current: auth.currentUser?.uid === doc.id
          };
        });

        // Sort descending by points
        studentsList.sort((a, b) => b.points - a.points);

        setLeaderboard(studentsList);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSubjectCourses = async () => {
      if (!selectedLandingSubject) {
        setSubjectCourses([]);
        return;
      }
      setLoadingCourses(true);
      try {
        const q = query(
          collection(db, 'courses'),
          where('subject', '==', selectedLandingSubject)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubjectCourses(list);
      } catch (err) {
        console.error("Error fetching courses for subject:", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchSubjectCourses();
  }, [selectedLandingSubject]);

  const faqs = [
    {
      q: 'هل منصة Teachland مجانية؟',
      a: 'التسجيل مجاني وتقدر تجرب بعض الدروس، لكن عشان تفتح كل المواد والكورسات هتحتاج تشترك في إحدى الباقات المتاحة.'
    },
    {
      q: 'إزاي أقدر أشترك في الباقات؟',
      a: 'تقدر تشترك عن طريق الدفع الإلكتروني (فودافون كاش، فيزا)، أو عن طريق شراء "كارت Teachland" من أقرب سنتر أو مكتبة.'
    },
    {
      q: 'هل الفيديوهات بتشتغل أوفلاين؟',
      a: 'الفيديوهات حالياً بتحتاج إنترنت، بس بنوفرلك ملخصات ومذكرات (PDF) تقدر تنزلها وتذاكرها من غير نت.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white font-sans selection:bg-primary/30">
      {/* Navbar */}
      <nav className="bg-white dark:bg-[#1A1A24] sticky top-0 z-50 border-b border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between relative">
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none">
                T
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent select-none inline-block py-1 px-0.5 leading-normal">Teachland</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600 dark:text-gray-300">
            <a href="#grades" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">الصفوف الدراسية</a>
            <a href="#subjects" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">المواد الدراسية</a>
            <a href="#how-it-works" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">طريقة Teachland</a>
            
            <a href="#faq" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">الأسئلة الشائعة</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center gap-1 sm:gap-2">
                لوحة التحكم
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors px-2 sm:px-4 py-2 hidden sm:block">تسجيل الدخول</Link>
                <Link to="/register" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center gap-1 sm:gap-2">
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-20 lg:pb-32 bg-white dark:bg-[#1A1A24]">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start text-right"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#0077B6] dark:text-[#B8860B] mb-4 sm:mb-6 text-xs sm:text-sm font-bold">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#00B4D8] dark:fill-[#D4AF37] text-[#00B4D8] dark:text-[#D4AF37]" /> المنصة التعليمية الأسرع نمواً
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[1.2] sm:leading-[1.1] mb-4 sm:mb-6 text-gray-900 dark:text-white">
              مدرستك كلها <br className="hidden sm:inline" />
              في <span className="text-[#00B4D8] dark:text-[#D4AF37]">جيبك</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-lg leading-relaxed font-medium">
              شرح مبسط في فيديوهات قصيرة، اختبارات ذكية، ومنافسات مع أصحابك. كل المواد اللي محتاجها من مكان واحد، وفي أي وقت.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {user ? (
                <Link to="/dashboard" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg shadow-xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  الذهاب للوحة التحكم
                </Link>
              ) : (
                <Link to="/register" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg shadow-xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  سجل مجاناً دلوقتي
                </Link>
              )}
              <button className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg border-2 border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-300 hover:border-[#00B4D8] dark:border-[#D4AF37] hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors flex items-center justify-center gap-2 bg-white dark:bg-[#1A1A24]">
                <Play className="w-4 h-4 sm:w-5 sm:h-5" /> جرب حصة مجانية
              </button>
            </div>
            
            <div className="mt-8 sm:mt-10 flex items-center gap-4 sm:gap-6">
               <div className="flex -space-x-3 sm:-space-x-4 space-x-reverse">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-gray-200 dark:bg-[#2D2D3D] flex items-center justify-center font-bold text-xs`} style={{ zIndex: 5-i }}>
                       <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  ))}
               </div>
               <div className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
                  انضم لأكثر من <span className="text-[#00B4D8] dark:text-[#D4AF37]">٢ مليون</span> طالب
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
             {/* Mockup illustration area */}
             <div className="relative w-full aspect-square bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-[3rem] border border-white p-8 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-white dark:bg-[#1A1A24]/40 backdrop-blur-3xl rounded-[3rem]"></div>
                
                {/* Floating UI Elements imitating Abwaab */}
                <div className="relative w-[80%] h-[90%] bg-white dark:bg-[#1A1A24] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2D2D3D] overflow-hidden flex flex-col">
                   <div className="h-12 bg-gray-50 dark:bg-[#0D0D12] border-b flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                   </div>
                   <div className="p-6 flex-1 flex flex-col gap-4">
                      <div className="w-3/4 h-8 bg-gray-100 dark:bg-[#222230] rounded-lg"></div>
                      <div className="w-full aspect-video bg-gray-900 rounded-xl relative flex items-center justify-center">
                         <div className="w-12 h-12 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-white ml-1" />
                         </div>
                      </div>
                      <div className="flex gap-4 mt-2">
                         <div className="w-1/2 h-24 bg-[#00B4D8]/20 dark:bg-[#D4AF37]/20 rounded-xl border border-[#00B4D8] dark:border-[#D4AF37]/50 p-4">
                            <div className="w-6 h-6 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-md mb-2"></div>
                            <div className="w-20 h-4 bg-gray-200 dark:bg-[#2D2D3D] rounded"></div>
                         </div>
                         <div className="w-1/2 h-24 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-xl border border-[#00B4D8] dark:border-[#D4AF37]/30 p-4">
                            <div className="w-6 h-6 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-md mb-2"></div>
                            <div className="w-20 h-4 bg-gray-200 dark:bg-[#2D2D3D] rounded"></div>
                         </div>
                      </div>
                   </div>
                </div>
                
                {/* Floating Badges */}
                <div className="absolute top-12 -right-6 bg-white dark:bg-[#1A1A24] p-4 rounded-2xl flex items-center gap-3 shadow-xl border border-gray-200 dark:border-[#2D2D3D] animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="w-10 h-10 bg-[#00B4D8]/20 dark:bg-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37]">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">المركز الأول</p>
                    <p className="text-sm font-black text-gray-800 dark:text-gray-100">دوري العباقرة</p>
                  </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Grades Section */}
      <section id="grades" className="py-16 sm:py-24 bg-white dark:bg-[#1A1A24] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-10 sm:mb-16 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-3 sm:mb-4 text-gray-900 dark:text-white">الصفوف الدراسية</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg font-medium">اختر صفك الدراسي وابدأ رحلة الTeachland مع أقوى محتوى تعليمي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                id: 'prep-1',
                title: 'الصف الأول الإعدادي',
                desc: 'بداية المرحلة الإعدادية بأساس قوي ومناهج مبسطة تواكب التطور.',
                icon: <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />,
                bgClass: 'from-emerald-400 to-emerald-600',
                darkBgClass: 'dark:from-emerald-500/80 dark:to-emerald-800',
                accent: 'bg-white/20 text-white',
                pattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)'
              },
              {
                id: 'prep-2',
                title: 'الصف الثاني الإعدادي',
                desc: 'تطوير المهارات العلمية والأكاديمية بتطبيقات وتدريبات مستمرة.',
                icon: <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />,
                bgClass: 'from-teal-400 to-teal-600',
                darkBgClass: 'dark:from-teal-500/80 dark:to-teal-800',
                accent: 'bg-white/20 text-white',
                pattern: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 30px)'
              },
              {
                id: 'prep-3',
                title: 'الصف الثالث الإعدادي',
                desc: 'الاستعداد للشهادة الإعدادية والانتقال للمرحلة الثانوية بثقة.',
                icon: <Award className="w-8 h-8 sm:w-10 sm:h-10" />,
                bgClass: 'from-cyan-500 to-blue-500',
                darkBgClass: 'dark:from-cyan-600/80 dark:to-blue-800',
                accent: 'bg-white/20 text-white',
                pattern: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)'
              },
              {
                id: 'grade-1',
                title: 'الصف الأول الثانوي',
                desc: 'تأسيس قوي لرحلتك في الثانوية، مناهج مبسطة واختبارات تفاعلية.',
                icon: <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />,
                bgClass: 'from-[#00B4D8] to-blue-600',
                darkBgClass: 'dark:from-[#00B4D8]/80 dark:to-blue-800',
                accent: 'bg-white/20 text-white',
                pattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)'
              },
              {
                id: 'grade-2',
                title: 'الصف الثاني الثانوي',
                desc: 'خطوة بخطوة نحو سنة الحسم، تغطية شاملة لكل أجزاء المنهج.',
                icon: <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />,
                bgClass: 'from-purple-500 to-indigo-600',
                darkBgClass: 'dark:from-indigo-500/80 dark:to-purple-800',
                accent: 'bg-white/20 text-white',
                pattern: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 30px)'
              },
              {
                id: 'grade-3',
                title: 'الصف الثالث الثانوي',
                desc: 'سنة الحسم وتحقيق حلمك، مراجعات نهائية وتدريب على نظام الامتحانات.',
                icon: <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" />,
                bgClass: 'from-[#D4AF37] to-yellow-600',
                darkBgClass: 'dark:from-[#D4AF37]/80 dark:to-yellow-800',
                accent: 'bg-white/20 text-white',
                pattern: 'linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)'
              }
            ].map((grade, i) => (
              <motion.div
                key={grade.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.01 }}
                className={`relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] shadow-xl p-1 group cursor-pointer flex flex-col`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${grade.bgClass} ${grade.darkBgClass} opacity-100`} />
                
                {/* Decorative Pattern / Scratch simulation */}
                <div 
                  className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none transition-transform duration-1000 group-hover:scale-110" 
                  style={{ backgroundImage: grade.pattern, backgroundSize: '30px 30px' }} 
                />

                {/* Top shine effect */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/20 to-transparent pointer-events-none mix-blend-overlay" />

                <div className="relative h-full bg-black/10 backdrop-blur-[2px] rounded-[1.35rem] sm:rounded-[2.25rem] p-6 sm:p-8 md:p-10 flex flex-col items-center text-center border border-white/20 z-10">
                  <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl ${grade.accent} flex items-center justify-center mb-6 sm:mb-8 shadow-xl shadow-black/10 rotate-3 group-hover:-rotate-6 group-hover:scale-110 transition-all duration-500`}>
                    {grade.icon}
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 sm:mb-4 drop-shadow-md">
                    {grade.title}
                  </h3>
                  
                  <p className="text-white/90 font-medium text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8 flex-1 drop-shadow-sm">
                    {grade.desc}
                  </p>

                  <Link 
                    to="/register" 
                    className="w-full bg-white text-gray-900 font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-md group-hover:shadow-xl"
                  >
                    ابدأ الآن <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 -rotate-180" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-16 sm:py-24 bg-gray-50 dark:bg-[#0D0D12]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 text-gray-900 dark:text-white">كل المواد اللي بتدور عليها</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg font-medium">اختار مادتك وابدأ اتعلم بطريقة ممتعة ومبسطة، مع أفضل المدرسين.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { title: 'الرياضيات', icon: Calculator, color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
              { title: 'الفيزياء', icon: Zap, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400' },
              { title: 'الكيمياء', icon: FlaskConical, color: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
              { title: 'الأحياء', icon: Dna, color: 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' },
              { title: 'اللغة العربية', icon: Languages, color: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
              { title: 'اللغة الإنجليزية', icon: BookOpenText, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' },
              { title: 'التاريخ', icon: Scroll, color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
              { title: 'الجغرافيا', icon: Globe, color: 'bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400' }
            ].map((subject, i) => (
              <div
                key={i}
                onClick={() => setSelectedLandingSubject(subject.title)}
                className="block group cursor-pointer"
              >
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#00B4D8]/5 dark:hover:shadow-[#D4AF37]/5 transition-all text-center h-full flex flex-col items-center justify-center"
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 ${subject.color} group-hover:scale-110 transition-transform`}>
                    <subject.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-lg font-black text-gray-800 dark:text-gray-100">{subject.title}</h3>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white dark:bg-[#1A1A24]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
             <div className="text-right">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6 text-gray-900 dark:text-white">إزاي Teachland بتخليك <span className="text-[#00B4D8] dark:text-[#D4AF37]">تتميز؟</span></h2>
                <div className="space-y-6 sm:space-y-8">
                   {[
                     { title: 'فيديوهات قصيرة (Microlearning)', desc: 'مش هتحس بملل، الدرس متقسم لأفكار صغيرة مدتها ٥ دقايق عشان تركز.' },
                     { title: 'اختبار بعد كل فكرة', desc: 'عشان تتأكد إنك فهمت، فيه كويز سريع بعد كل فيديو بيقيس فهمك.' },
                     { title: 'متابعة الأداء الذكية', desc: 'تقارير ذكية بتعرفك مستواك وتوجهك لأفضل طرق المذاكرة.' },
                   ].map((feature, i) => (
                      <motion.div 
                         key={i} 
                         initial={{ opacity: 0, x: 20 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         viewport={{ once: true }}
                         transition={{ delay: i * 0.1, duration: 0.5 }}
                         className="flex gap-3 sm:gap-4"
                      >
                         <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
                         </div>
                         <div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">{feature.title}</h3>
                            <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400 font-medium">{feature.desc}</p>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
             
             {/* Fancy Animated Section */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.7 }}
               className="relative perspective-1000 group"
             >
               {/* Animated Background Gradients */}
               <motion.div 
                 animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.03, 1] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                 whileHover={{ opacity: 0.2, scale: 1.05 }}
                 className="absolute -inset-2 bg-gradient-to-r from-[#00B4D8] to-indigo-500 dark:from-[#D4AF37] dark:to-purple-600 rounded-[3rem] blur-xl"
               ></motion.div>
               <motion.div 
                 initial={{ rotate: -2, opacity: 0.05 }}
                 whileHover={{ rotate: 0, opacity: 0.1 }}
                 transition={{ duration: 0.5 }}
                 className="absolute inset-0 bg-gradient-to-tr from-[#00B4D8] to-indigo-500 dark:from-[#D4AF37] dark:to-purple-600 rounded-[3rem]"
               ></motion.div>
               
               {/* Main Card */}
               <motion.div 
                 animate={{ y: [0, -3, 0] }}
                 whileHover={{ scale: 1.02, y: -6 }}
                 transition={{ y: { repeat: Infinity, duration: 5, ease: "easeInOut" }, scale: { duration: 0.3, ease: "easeOut" } }}
                 className="relative bg-white dark:bg-[#12121A]/90 backdrop-blur-xl border border-gray-100 dark:border-white/5 p-8 sm:p-10 rounded-[3rem] shadow-xl overflow-hidden"
               >
                 
                 {/* Floating Elements (Decorative) */}
                 <motion.div 
                    animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-[#00B4D8] to-indigo-400 dark:from-[#D4AF37] dark:to-yellow-500 rounded-2xl opacity-[0.07] blur-lg"
                 />
                 <motion.div 
                    animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-8 left-8 w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-purple-600 dark:to-pink-500 rounded-full opacity-[0.07] blur-lg"
                 />

                 <div className="relative z-10 text-center space-y-6">
                    <motion.div 
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-[#00B4D8] to-indigo-500 dark:from-[#D4AF37] dark:to-yellow-600 rounded-2xl shadow-lg"
                    >
                       <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white opacity-90" />
                    </motion.div>
                    
                    <div>
                       <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-4">
                          تجربة تعليمية استثنائية
                       </h3>
                       <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">
                          انضم الآن إلى Teachland واستمتع ببيئة تعليمية مذهلة تجمع بين المتعة، التفاعل، وأحدث التقنيات لضمان تميزك.
                       </p>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-2">
                       {[1, 2, 3].map((_, idx) => (
                          <motion.div 
                             key={idx}
                             animate={{ opacity: [0.3, 0.7, 0.3] }}
                             transition={{ repeat: Infinity, duration: 3, delay: idx * 0.4 }}
                             className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]/60 dark:bg-[#D4AF37]/60"
                          />
                       ))}
                    </div>
                 </div>
               </motion.div>
             </motion.div>
             
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50 dark:bg-[#0D0D12]">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white">الأسئلة الشائعة</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">كل اللي محتاج تعرفه عن منصة Teachland</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${openFaqIndex === i ? 'bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 border-[#00B4D8]/30 dark:border-[#D4AF37]/30 shadow-md' : 'bg-white dark:bg-[#1A1A24] border-gray-200 dark:border-[#2D2D3D] hover:border-[#00B4D8]/30 dark:hover:border-[#D4AF37]/30'}`}
              >
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-right"
                >
                  <span className={`font-bold text-lg transition-colors duration-300 ${openFaqIndex === i ? 'text-[#00B4D8] dark:text-[#D4AF37]' : 'text-gray-900 dark:text-white'}`}>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaqIndex === i ? 180 : 0 }}
                    className={`p-1.5 rounded-full transition-colors duration-300 ${openFaqIndex === i ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </motion.button>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA Section */}
      <section className="py-16 bg-white dark:bg-[#1A1A24] border-t border-gray-100 dark:border-[#2D2D3D] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#0077B6] dark:text-[#B8860B] mb-4 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> ابقَ على اطلاع دائم
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-4 text-gray-900 dark:text-white">
            اشترك في نشرتنا الإخبارية للحصول على أحدث النصائح التعليمية
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-lg mx-auto leading-relaxed">
            انضم إلى آلاف الطلاب وأولياء الأمور الذين يتلقون نصائح أسبوعية حول كيفية زيادة التحصيل الدراسي والTeachland في الامتحانات.
          </p>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 sm:bg-gray-50 sm:dark:bg-[#0D0D12] sm:p-1.5 sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-[#2D2D3D] shadow-none sm:shadow-sm sm:focus-within:border-[#00B4D8] sm:dark:focus-within:border-[#D4AF37] transition-all w-full">
            <input
              type="email"
              required
              placeholder="أدخل بريدك الإلكتروني هنا..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full sm:flex-1 bg-gray-50 dark:bg-[#0D0D12] sm:bg-transparent px-5 sm:px-4 py-3.5 sm:py-2.5 rounded-xl sm:rounded-none border border-gray-200 dark:border-[#2D2D3D] sm:border-none text-sm outline-none text-gray-900 dark:text-white text-right placeholder:text-gray-400 font-medium focus:border-[#00B4D8] dark:focus:border-[#D4AF37] sm:focus:border-transparent sm:dark:focus:border-transparent min-w-0"
            />
            <button
              type="submit"
              disabled={submitting || subscribed}
              className="w-full sm:w-auto bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-5 py-3.5 sm:py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-75"
            >
              {submitting ? (
                <span>جاري الاشتراك...</span>
              ) : subscribed ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>تم الاشتراك!</span>
                </>
              ) : (
                <>
                  <span>اشترك الآن</span>
                  <Send className="w-4 h-4 -rotate-90 shrink-0" />
                </>
              )}
            </button>
          </form>
          {subscribed && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-600 dark:text-green-400 font-bold text-xs mt-3"
            >
              🎉 شكرًا لك على اشتراكك في نشرتنا الإخبارية! سنبقيك على اطلاع دائم بكل ما هو جديد.
            </motion.p>
          )}
        </div>
      </section>

      {/* Ultra-Premium Footer */}
      <footer className="bg-gray-50 dark:bg-[#0D0D12] pt-16 pb-8 border-t border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-300">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 text-right">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 border border-white/10 select-none">
                  T
                </div>
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] bg-clip-text text-transparent select-none inline-block py-1 px-0.5 leading-normal">Teachland</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                منصة Teachland تقدم تجربة تعلم تفاعلية متكاملة لطلاب المرحلتين الإعدادية والثانوية في مصر، تهدف لتقديم أفضل مستويات الشرح بطرق حديثة تناسب جميع الطلاب.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:scale-110 transition-all">
                  <span className="text-xs font-bold">Fb</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:scale-110 transition-all">
                  <span className="text-xs font-bold">X</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:scale-110 transition-all">
                  <span className="text-xs font-bold">Yt</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:scale-110 transition-all">
                  <span className="text-xs font-bold">In</span>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-gray-900 dark:text-white font-black text-sm mb-4 pb-1 border-b-2 border-[#00B4D8]/20 dark:border-[#D4AF37]/20 w-fit">
                تصفح المنصة
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm font-bold">
                <li><a href="#grades" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> الصفوف الدراسية</a></li>
                <li><a href="#subjects" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> المواد الدراسية</a></li>
                <li><a href="#how-it-works" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> طريقة Teachland التعليمية</a></li>
                
                <li><a href="#faq" className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 rotate-45" /> الأسئلة الأكثر شيوعاً</a></li>
              </ul>
            </div>

            {/* Column 3: Legal & Support */}
            <div>
              <h3 className="text-gray-900 dark:text-white font-black text-sm mb-4 pb-1 border-b-2 border-[#00B4D8]/20 dark:border-[#D4AF37]/20 w-fit">
                المساعدة والقانونية
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm font-bold">
                <li>
                  <button 
                    onClick={() => { setActiveModal('privacy'); setSupportSubmitted(false); }}
                    className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" /> 
                    <span>سياسة الخصوصية والأمان</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveModal('terms'); setSupportSubmitted(false); }}
                    className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 
                    <span>الشروط والأحكام العامة</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveModal('copyright'); setSupportSubmitted(false); }}
                    className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                  >
                    <Heart className="w-3.5 h-3.5 shrink-0" /> 
                    <span>حقوق الملكية الفكرية</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveModal('support'); setSupportSubmitted(false); }}
                    className="hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 cursor-pointer text-right w-full"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" /> 
                    <span>تواصل مع الدعم الفني</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div className="space-y-4">
              <h3 className="text-gray-900 dark:text-white font-black text-sm mb-4 pb-1 border-b-2 border-[#00B4D8]/20 dark:border-[#D4AF37]/20 w-fit">
                تواصل معنا
              </h3>
              <div className="space-y-3 text-xs sm:text-sm font-medium">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-right">
                    <p className="text-gray-400 text-[10px]">الخط الساخن والواتساب</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200" dir="ltr">+20 100 123 4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-right">
                    <p className="text-gray-400 text-[10px]">الدعم والمبيعات</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200">support@tafawwoq-edu.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-right text-gray-500 dark:text-gray-400 font-bold">
                    جمهورية مصر العربية، القاهرة، مدينة نصر.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar with Fox Tech clickable link */}
          <div className="pt-8 mt-8 border-t border-gray-200 dark:border-[#2D2D3D] flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 text-center">
            <div>
              جميع الحقوق محفوظة لـ <span className="text-gray-800 dark:text-gray-200">منصة Teachland</span> © ٢٠٢٦
            </div>
            <div className="flex items-center gap-1">
              <span>تصميم وتطوير بكل حب ❤️ بواسطة</span>
              <a 
                href="https://foxtech-eg.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1 text-[#00B4D8] dark:text-[#D4AF37] hover:text-[#0077B6] dark:hover:text-[#B8860B] hover:underline font-extrabold transition-all duration-200"
              >
                <span>Fox Tech</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal & Support Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#13131A] max-w-2xl w-full rounded-3xl border border-gray-100 dark:border-[#2D2D3D] shadow-2xl overflow-hidden z-10 text-right font-sans"
              dir="rtl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between bg-gray-50/50 dark:bg-[#1A1A24]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#00B4D8] dark:text-[#D4AF37]">
                    {activeModal === 'privacy' && <Shield className="w-5 h-5" />}
                    {activeModal === 'terms' && <CheckCircle2 className="w-5 h-5" />}
                    {activeModal === 'copyright' && <Heart className="w-5 h-5" />}
                    {activeModal === 'support' && <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      {activeModal === 'privacy' && 'سياسة الخصوصية والأمان'}
                      {activeModal === 'terms' && 'الشروط والأحكام العامة'}
                      {activeModal === 'copyright' && 'حقوق الملكية الفكرية'}
                      {activeModal === 'support' && 'الدعم الفني المباشر'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      منصة Teachland للمرحلة الثانوية
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2D2D3D] hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-medium">
                {activeModal === 'privacy' && (
                  <div className="space-y-4">
                    <p className="text-gray-900 dark:text-white font-extrabold text-base">
                      مرحباً بك في سياسة الخصوصية الخاصة بـ منصة Teachland. خصوصيتك وأمان بياناتك هي أهم أولوياتنا.
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ١. البيانات التي نقوم بجمعها
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        نقوم بجمع البيانات الأساسية اللازمة لإنشاء حسابك الدراسي، وتشمل: الاسم الكامل، رقم الهاتف (للطالب وولي الأمر لتلقي تقارير الدرجات)، البريد الإلكتروني، والمستوى الدراسي (إعدادي أو ثانوي).
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ٢. كيف نستخدم بياناتك ونحميها؟
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        تُستخدم البيانات فقط لتقديم تجربة تعليمية مخصصة، ومتابعة تقدمك في المواد،  جميع كلمات المرور وبياناتك مشفرة بالكامل عبر خوادم مأمنة ومحمية ببروتوكولات حماية متطورة تمنع أي وصول غير مصرح به.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ٣. سرية المعلومات والجهات الخارجية
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        نلتزم التزاماً تاماً بعدم بيع أو مشاركة أو تأجير أي من بياناتك الشخصية لأي جهة تجارية أو إعلانية خارجية. بياناتك ملكك وحدك وتُستخدم حصرياً داخل بيئة "Teachland" التعليمية.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ٤. أمان العمليات والمدفوعات
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        تتم جميع العمليات المالية وشحن المحافظ عبر قنوات معتمدة وموفرين معتمدين لخدمات الدفع الإلكتروني في مصر (مثل فوري والمحافظ الإلكترونية) وتخضع لأقصى معايير الأمان المصرفي الرقمي.
                      </p>
                    </div>
                  </div>
                )}

                {activeModal === 'terms' && (
                  <div className="space-y-4">
                    <p className="text-gray-900 dark:text-white font-extrabold text-base">
                      باستخدامك لمنصة Teachland، فإنك توافق على الالتزام الكامل بالشروط والأحكام التالية المبرمة لضمان بيئة تعليمية عادلة ومثمرة لجميع الطلاب.
                    </p>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ١. شروط الاستخدام والحسابات
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        المنصة مخصصة للاستخدام الشخصي لطلاب المرحلة الثانوية فقط. يحق لكل طالب تسجيل حساب واحد فقط. يمنع منعاً باتاً مشاركة بيانات تسجيل الدخول مع أي شخص آخر، ويحتفظ النظام بالحق في إيقاف أي حساب يسجل دخول من أجهزة متعددة بشكل يثير الشبهة.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ٢. المحتوى التعليمي والاشتراكات
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        توفر المنصة محتوى مجاني وآخر مدفوع (بنظام الاشتراك الشهري أو شراء الكورسات الفردية). بمجرد إتمام الشراء، يصبح المحتوى متاحاً للطالب طوال فترة العام الدراسي الجاري ولا يحق استرداد الرسوم بعد تفعيل الكورس وبدء المشاهدة.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ٣. قواعد السلوك العام والتعليقات
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        نحن فخورون ببيئتنا التعليمية الراقية. يُمنع منعاً باتاً نشر أي تعليقات مسيئة، سياسية، أو غير لائقة في أقسام الأسئلة والتعليقات تحت المحاضرات. سيؤدي ارتكاب أي من ذلك إلى حظر فوري للحساب دون إنذار ودون استرداد للمستحقات.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ٤. النزاهة في الاختبارات
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        تحتفظ إدارة المنصة بالحق في مراجعة تقدم الطلاب الحاصلين على المراكز الأولى في الدوري الأسبوعي لضمان عدم وجود تلاعب أو غش في حل الواجبات والاختبارات الإلكترونية.
                      </p>
                    </div>
                  </div>
                )}

                {activeModal === 'copyright' && (
                  <div className="space-y-4">
                    <p className="text-gray-900 dark:text-white font-extrabold text-base">
                      الملكية الفكرية لـ منصة Teachland محمية بموجب القوانين المصرية والدولية لحماية حقوق المؤلف والملكية الفكرية.
                    </p>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ١. حقوق المؤلف الحصرية للمواد العلمية
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        جميع المحاضرات المرئية، الفيديوهات التوضيحية، بنوك الأسئلة، الاختبارات، المذكرات الرقمية والملخصات المعروضة على المنصة هي ملكية فكرية حصرية لـ "منصة Teachland" ونخبة المدرسين المتعاقد معهم.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        ٢. الحظر القانوني وعقوبة تسريب المحتوى
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        يُحظر تماماً وبشكل قاطع: تسجيل شاشة المحاضرات، إعادة رفع مقاطع الفيديو على يوتيوب أو فيسبوك أو تليجرام، أو طبع وتوزيع مذكرات المنصة خارج إطار الاستخدام الشخصي المباشر.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]"></span>
                        ٣. العلامة المائية الرقمية المدمجة
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        تستخدم المنصة تقنيات مائية رقمية متطورة تدمج اسم الطالب ورقم هاتفه وبيانات حسابه بشكل غير مرئي ومرئي على الشاشة وأوراق العمل لسهولة تعقب وتحديد أي شخص يقوم بتسريب المحتوى.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                        ٤. الملاحقة القانونية الصارمة
                      </h4>
                      <p className="pr-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        سيتم ملاحقة أي محاولة للتعدي على حقوق الملكية الفكرية قضائياً وجنائياً بالتنسيق مع مباحث الإنترنت بوزارة الداخلية المصرية وتطبيق العقوبات والغرامات المقررة بموجب قانون مكافحة جرائم تقنية المعلومات المصري.
                      </p>
                    </div>
                  </div>
                )}

                {activeModal === 'support' && (
                  <div className="space-y-4">
                    {supportSubmitted ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 space-y-4"
                      >
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                          <CheckCircle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-gray-900 dark:text-white">تم إرسال طلبك بنجاح!</h4>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold max-w-md mx-auto">
                            شكراً لتواصلك معنا يا {supportName}! سيتواصل معك أحد ممثلي الدعم الفني عبر البريد الإلكتروني أو واتساب خلال أقل من ٢٤ ساعة لحل مشكلتك.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSupportSubmitted(false);
                            setSupportName('');
                            setSupportEmail('');
                          }}
                          className="px-6 py-2 rounded-2xl bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] text-white font-bold text-xs sm:text-sm transition-all"
                        >
                          إرسال رسالة أخرى
                        </button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSupportSubmit} className="space-y-4">
                        <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">
                          يسعدنا مساعدتك في أي وقت! يرجى ملء التفاصيل التالية وسيتم تزويدك بالدعم الفوري والمساعدة التقنية.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-right">
                            <label className="text-xs font-black text-gray-700 dark:text-gray-300">الاسم بالكامل</label>
                            <input
                              type="text"
                              required
                              value={supportName}
                              onChange={(e) => setSupportName(e.target.value)}
                              placeholder="مثال: أحمد محمد علي"
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] text-gray-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all"
                            />
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="text-xs font-black text-gray-700 dark:text-gray-300">البريد الإلكتروني أو رقم الهاتف</label>
                            <input
                              type="text"
                              required
                              value={supportEmail}
                              onChange={(e) => setSupportEmail(e.target.value)}
                              placeholder="مثال: +201001234567"
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] text-gray-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-right">
                          <label className="text-xs font-black text-gray-700 dark:text-gray-300">تفاصيل المشكلة أو الاستفسار</label>
                          <textarea
                            rows={4}
                            required
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            placeholder="اكتب رسالتك أو استفسارك بالتفصيل هنا..."
                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] text-gray-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={supportSubmitting}
                          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] hover:opacity-90 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                        >
                          {supportSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>جاري إرسال طلبك...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>إرسال الطلب الآن</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Panel */}
              <div className="p-4 bg-gray-50 dark:bg-[#1A1A24]/40 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-end gap-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-2.5 rounded-2xl bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3D3D4D] text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Subject Courses Browser Modal */}
        {selectedLandingSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLandingSubject(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-[#15151F] rounded-[32px] shadow-2xl border border-gray-100 dark:border-[#2D2D3D] overflow-hidden flex flex-col z-10"
              dir="rtl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between bg-gray-50/50 dark:bg-[#1C1C28]/50 shrink-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span>كورسات مادة: {selectedLandingSubject}</span>
                    <Sparkles className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37] animate-pulse" />
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">تصفح الكورسات المتاحة حالياً للمادة</p>
                </div>
                <button
                  onClick={() => setSelectedLandingSubject(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D4D] text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingCourses ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-10 h-10 border-4 border-[#00B4D8]/30 dark:border-[#D4AF37]/30 border-t-[#00B4D8] dark:border-t-[#D4AF37] rounded-full animate-spin" />
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">جاري تحميل الكورسات...</span>
                  </div>
                ) : subjectCourses.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-[#1A1A24] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-[#2D2D3D]">
                      <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-2">لا توجد كورسات متاحة حالياً</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
                      لم يتم نشر أي كورسات لمادة {selectedLandingSubject} في هذه اللحظة، ولكن يمكنك تسجيل حساب مجاني ومتابعتنا لمعرفة فور نزولها!
                    </p>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-black text-sm rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20"
                    >
                      إنشاء حساب مجاني <ArrowRight className="w-4 h-4 -rotate-180" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {subjectCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-gray-50 dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all overflow-hidden flex flex-col group hover:shadow-lg"
                      >
                        {/* Course Image or Default */}
                        <div className="h-40 bg-gray-200 dark:bg-[#232333] relative overflow-hidden shrink-0">
                          {course.imageUrl ? (
                            <img
                              src={course.imageUrl}
                              alt={course.title}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-[#0077B6]/20 to-[#00B4D8]/20 dark:from-[#B8860B]/20 dark:to-[#D4AF37]/20 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-[#00B4D8]/50 dark:text-[#D4AF37]/50" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-white/95 dark:bg-[#1A1A24]/95 px-2.5 py-1 rounded-lg text-[10px] font-black text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                            {course.grade}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-black text-gray-900 dark:text-white text-base line-clamp-1 mb-1.5">{course.title}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold line-clamp-2 mb-4 leading-relaxed">{course.description || 'لا يوجد وصف متاح لهذا الكورس حالياً.'}</p>
                          </div>

                          <div className="space-y-3.5 border-t border-gray-100 dark:border-[#2D2D3D]/50 pt-3.5">
                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{course.teacherName || 'أستاذ المادة'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{course.lessonsCount || 0} درس</span>
                              </div>
                            </div>

                            {/* Button and Price */}
                            <div className="flex items-center justify-between gap-3 pt-1">
                              <div className="text-right">
                                <span className="text-[10px] block font-bold text-gray-400">سعر الكورس</span>
                                <span className="text-sm font-black text-gray-800 dark:text-gray-200">
                                  {course.price > 0 ? `${course.price} ج.م` : 'مجاني 🎁'}
                                </span>
                              </div>
                              <Link
                                to={user ? `/course/${course.id}` : `/register`}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] hover:opacity-95 text-white font-black text-xs shadow-md flex items-center gap-1"
                              >
                                <span>ابدأ الدراسة</span>
                                <ArrowRight className="w-3.5 h-3.5 -rotate-180" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
