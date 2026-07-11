import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, BookOpen, GraduationCap, Play, Star, Users, Trophy, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const faqs = [
    {
      q: 'هل منصة تفوق مجانية؟',
      a: 'التسجيل مجاني وتقدر تجرب بعض الدروس، لكن عشان تفتح كل المواد والكورسات هتحتاج تشترك في إحدى الباقات المتاحة.'
    },
    {
      q: 'إزاي أقدر أشترك في الباقات؟',
      a: 'تقدر تشترك عن طريق الدفع الإلكتروني (فودافون كاش، فيزا)، أو عن طريق شراء "كارت تفوق" من أقرب سنتر أو مكتبة.'
    },
    {
      q: 'هل الفيديوهات بتشتغل أوفلاين؟',
      a: 'الفيديوهات حالياً بتحتاج إنترنت، بس بنوفرلك ملخصات ومذكرات (PDF) تقدر تنزلها وتذاكرها من غير نت.'
    },
    {
      q: 'إيه هو دوري تفوق؟',
      a: 'نظام منافسة ممتع! كل ما تذاكر وتحل كويزات، بتجمع نقط وتدخل في دوري تفوق الأسبوعي وممكن تكسب جوائز قيمة.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white font-sans selection:bg-primary/30">
      {/* Navbar */}
      <nav className="bg-white dark:bg-[#1A1A24] sticky top-0 z-50 border-b border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                لوحة التحكم
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors px-4 py-2 hidden sm:block">تسجيل الدخول</Link>
                <Link to="/register" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600 dark:text-gray-300">
            <a href="#grades" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">الصفوف الدراسية</a>
            <a href="#subjects" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">المواد الدراسية</a>
            <a href="#how-it-works" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">طريقة تفوق</a>
            <a href="#league" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">دوري تفوق</a>
            <a href="#faq" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">الأسئلة الشائعة</a>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30">
                ت
              </div>
              <span className="text-2xl font-black tracking-tight text-[#0077B6] dark:text-[#B8860B]">تفوق</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-white dark:bg-[#1A1A24]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#0077B6] dark:text-[#B8860B] mb-6 text-sm font-bold">
              <Star className="w-4 h-4 fill-[#00B4D8] dark:fill-[#D4AF37] text-[#00B4D8] dark:text-[#D4AF37]" /> المنصة التعليمية الأسرع نمواً
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-6 text-gray-900 dark:text-white">
              مدرستك كلها <br />
              في <span className="text-[#00B4D8] dark:text-[#D4AF37]">جيبك</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-lg leading-relaxed font-medium">
              شرح مبسط في فيديوهات قصيرة، اختبارات ذكية، ومنافسات مع أصحابك. كل المواد اللي محتاجها من مكان واحد، وفي أي وقت.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {user ? (
                <Link to="/dashboard" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-1 transition-all flex items-center gap-2">
                  الذهاب للوحة التحكم
                </Link>
              ) : (
                <Link to="/register" className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-1 transition-all flex items-center gap-2">
                  سجل مجاناً دلوقتي
                </Link>
              )}
              <button className="px-8 py-4 rounded-full font-bold text-lg border-2 border-gray-200 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-300 hover:border-[#00B4D8] dark:border-[#D4AF37] hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors flex items-center gap-2 bg-white dark:bg-[#1A1A24]">
                <Play className="w-5 h-5" /> جرب حصة مجانية
              </button>
            </div>
            
            <div className="mt-10 flex items-center gap-6">
               <div className="flex -space-x-4 space-x-reverse">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-gray-200 dark:bg-[#2D2D3D] flex items-center justify-center font-bold text-xs`} style={{ zIndex: 5-i }}>
                       <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  ))}
               </div>
               <div className="text-sm font-bold text-gray-600 dark:text-gray-300">
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
                  <div className="text-right" dir="rtl">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">المركز الأول</p>
                    <p className="text-sm font-black text-gray-800 dark:text-gray-100">دوري العباقرة</p>
                  </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Grades Section */}
      <section id="grades" className="py-24 bg-white dark:bg-[#1A1A24] relative overflow-hidden" dir="rtl">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">الصفوف الدراسية</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">اختر صفك الدراسي وابدأ رحلة التفوق مع أقوى محتوى تعليمي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: 'grade-1',
                title: 'الصف الأول الثانوي',
                desc: 'تأسيس قوي لرحلتك في الثانوية، مناهج مبسطة واختبارات تفاعلية.',
                icon: <BookOpen className="w-10 h-10" />,
                bgClass: 'from-[#00B4D8] to-blue-600',
                darkBgClass: 'dark:from-[#00B4D8]/80 dark:to-blue-800',
                accent: 'bg-white/20 text-white',
                pattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)'
              },
              {
                id: 'grade-2',
                title: 'الصف الثاني الثانوي',
                desc: 'خطوة بخطوة نحو سنة الحسم، تغطية شاملة لكل أجزاء المنهج.',
                icon: <Trophy className="w-10 h-10" />,
                bgClass: 'from-purple-500 to-indigo-600',
                darkBgClass: 'dark:from-indigo-500/80 dark:to-purple-800',
                accent: 'bg-white/20 text-white',
                pattern: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 30px)'
              },
              {
                id: 'grade-3',
                title: 'الصف الثالث الثانوي',
                desc: 'سنة الحسم وتحقيق حلمك، مراجعات نهائية وتدريب على نظام الامتحانات.',
                icon: <GraduationCap className="w-10 h-10" />,
                bgClass: 'from-[#D4AF37] to-yellow-600',
                darkBgClass: 'dark:from-[#D4AF37]/80 dark:to-yellow-800',
                accent: 'bg-white/20 text-white',
                pattern: 'linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)'
              }
            ].map((grade, i) => (
              <motion.div
                key={grade.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ y: -15, scale: 1.02 }}
                className={`relative overflow-hidden rounded-[2.5rem] shadow-2xl p-1.5 group cursor-pointer flex flex-col`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${grade.bgClass} ${grade.darkBgClass} opacity-100`} />
                
                {/* Decorative Pattern / Scratch simulation */}
                <div 
                  className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none transition-transform duration-1000 group-hover:scale-110" 
                  style={{ backgroundImage: grade.pattern, backgroundSize: '30px 30px' }} 
                />

                {/* Top shine effect */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/20 to-transparent pointer-events-none mix-blend-overlay" />

                <div className="relative h-full bg-black/10 backdrop-blur-[2px] rounded-[2.25rem] p-8 md:p-10 flex flex-col items-center text-center border border-white/20 z-10">
                  <div className={`w-24 h-24 rounded-3xl ${grade.accent} flex items-center justify-center mb-8 shadow-xl shadow-black/10 rotate-3 group-hover:-rotate-6 group-hover:scale-110 transition-all duration-500`}>
                    {grade.icon}
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-4 drop-shadow-md">
                    {grade.title}
                  </h3>
                  
                  <p className="text-white/90 font-medium text-lg leading-relaxed mb-8 flex-1 drop-shadow-sm">
                    {grade.desc}
                  </p>

                  <Link 
                    to="/register" 
                    className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-xl group-hover:shadow-2xl"
                  >
                    ابدأ الآن <ArrowRight className="w-5 h-5 -rotate-180" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-24 bg-gray-50 dark:bg-[#0D0D12]" dir="rtl">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white">كل المواد اللي بتدور عليها</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">اختار مادتك وابدأ اتعلم بطريقة ممتعة ومبسطة، مع أفضل المدرسين.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: 'الرياضيات', icon: '➗', color: 'bg-blue-100 text-blue-600 border-blue-200' },
              { title: 'الفيزياء', icon: '⚡', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
              { title: 'الكيمياء', icon: '🧪', color: 'bg-purple-100 text-purple-600 border-purple-200' },
              { title: 'الأحياء', icon: '🧬', color: 'bg-green-100 text-green-600 border-green-200' },
              { title: 'اللغة العربية', icon: '📖', color: 'bg-red-100 text-red-600 border-red-200' },
              { title: 'اللغة الإنجليزية', icon: '🔤', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
              { title: 'التاريخ', icon: '🏛️', color: 'bg-orange-100 text-orange-600 border-orange-200' },
              { title: 'الجغرافيا', icon: '🌍', color: 'bg-teal-100 text-teal-600 border-teal-200' }
            ].map((subject, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#00B4D8]/5 dark:shadow-[#D4AF37]/5 transition-all cursor-pointer text-center group"
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 ${subject.color} group-hover:scale-110 transition-transform`}>
                  {subject.icon}
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-gray-100">{subject.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-[#1A1A24]" dir="rtl">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
             <div>
                <h2 className="text-3xl md:text-4xl font-black mb-6 text-gray-900 dark:text-white">إزاي تفوق بتخليك <span className="text-[#00B4D8] dark:text-[#D4AF37]">تتفوق؟</span></h2>
                <div className="space-y-8">
                   {[
                     { title: 'فيديوهات قصيرة (Microlearning)', desc: 'مش هتحس بملل، الدرس متقسم لأفكار صغيرة مدتها ٥ دقايق عشان تركز.' },
                     { title: 'اختبار بعد كل فكرة', desc: 'عشان تتأكد إنك فهمت، فيه كويز سريع بعد كل فيديو بيقيس فهمك.' },
                     { title: 'دوري تفوق والمنافسة', desc: 'جمع نقط، ادخل في تحديات مع أصحابك، وتصدر قائمة الأوائل.' }
                   ].map((feature, i) => (
                      <div key={i} className="flex gap-4">
                         <div className="w-12 h-12 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-[#00B4D8] dark:text-[#D4AF37]" />
                         </div>
                         <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{feature.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="relative">
               <div className="absolute inset-0 bg-[#00B4D8]/20 dark:bg-[#D4AF37]/20 rounded-[3rem] rotate-6 transform transition-transform hover:rotate-3"></div>
               <div className="relative bg-white dark:bg-[#1A1A24] p-8 rounded-[3rem] shadow-xl border border-gray-200 dark:border-[#2D2D3D]">
                  <div className="text-center mb-6">
                     <div className="w-20 h-20 bg-[#00B4D8]/20 dark:bg-[#D4AF37]/20 rounded-full mx-auto flex items-center justify-center mb-4">
                        <Trophy className="w-10 h-10 text-[#00B4D8] dark:text-[#D4AF37]" />
                     </div>
                     <h3 className="text-2xl font-black">دوري تفوق</h3>
                     <p className="text-gray-500 dark:text-gray-400 font-medium">الأسبوع الثالث</p>
                  </div>
                  
                  <div className="space-y-3">
                     {[
                        { name: 'أحمد محمود', pts: '٢,٤٥٠', pos: 1, current: false },
                        { name: 'سارة خالد', pts: '٢,١٠٠', pos: 2, current: false },
                        { name: 'أنت', pts: '١,٩٥٠', pos: 3, current: true },
                        { name: 'عمر طارق', pts: '١,٨٠٠', pos: 4, current: false }
                     ].map((user) => (
                        <div key={user.pos} className={`flex items-center justify-between p-4 rounded-2xl ${user.current ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white shadow-lg' : 'bg-gray-50 dark:bg-[#0D0D12]'}`}>
                           <div className="flex items-center gap-4">
                              <span className={`font-black w-6 text-center ${user.current ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>#{user.pos}</span>
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-gray-200 dark:bg-[#2D2D3D] rounded-full"></div>
                                 <span className="font-bold">{user.name}</span>
                              </div>
                           </div>
                           <div className="font-black flex items-center gap-1">
                              {user.pts} <Star className={`w-4 h-4 ${user.current ? 'fill-[#00B4D8] dark:fill-[#D4AF37] text-[#00B4D8] dark:text-[#D4AF37]' : 'fill-gray-300 text-gray-600 dark:text-gray-300'}`} />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50 dark:bg-[#0D0D12]" dir="rtl">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white">الأسئلة الشائعة</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">كل اللي محتاج تعرفه عن منصة تفوق</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-200 dark:border-[#2D2D3D] overflow-hidden shadow-sm"
              >
                <button 
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-right"
                >
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openFaqIndex === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white dark:bg-[#1A1A24] py-12 border-t border-gray-200 dark:border-[#2D2D3D] text-center text-gray-600 dark:text-gray-300" dir="rtl">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6">
             <div className="w-10 h-10 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-xl flex items-center justify-center font-black text-xl text-white">
                ت
              </div>
              <span className="text-2xl font-black tracking-tight text-[#0077B6] dark:text-[#B8860B]">تفوق</span>
          </div>
          <p className="mb-6 font-medium text-sm">منصة تفوق التعليمية. تجربة تعليمية ممتعة وفعّالة.</p>
          <div className="flex justify-center gap-8 text-sm font-bold text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">عن تفوق</a>
            <a href="#" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">الشروط والأحكام</a>
            <a href="#" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-[#00B4D8] dark:text-[#D4AF37] transition-colors">تواصل معنا</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
