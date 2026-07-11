import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Lock, User, Phone, MapPin, School, BookOpen, GraduationCap, Users, Calendar, IdCard, Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'القليوبية', 'بورسعيد', 'السويس', 
  'مطروح', 'الدقهلية', 'الشرقية', 'المنوفية', 'الغربية', 'الإسماعيلية', 
  'دمياط', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 
  'سوهاج', 'قنا', 'أسوان', 'الأقصر', 'البحر الأحمر', 'الوادي الجديد', 
  'شمال سيناء', 'جنوب سيناء'
];

export default function Auth() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [role, setRole] = useState<'student' | 'teacher' | 'parent'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const baseData = {
          email,
          name: formData.get('name') as string,
          phone: formData.get('phone') as string,
          governorate: formData.get('governorate') as string,
          role
        };

        if (role === 'student') {
          await setDoc(doc(db, 'users', user.uid), {
            ...baseData,
            grade: formData.get('grade') as string,
            school: formData.get('school') as string,
            parentPhone: formData.get('parentPhone') as string
          });
        } else if (role === 'teacher') {
          // get checked grades
          const grades = [];
          if (formData.get('grade_1')) grades.push('الأول الثانوي');
          if (formData.get('grade_2')) grades.push('الثاني الثانوي');
          if (formData.get('grade_3')) grades.push('الثالث الثانوي');

          await setDoc(doc(db, 'users', user.uid), {
            ...baseData,
            subject: formData.get('subject') as string,
            nationalId: formData.get('nationalId') as string,
            dateOfBirth: formData.get('dateOfBirth') as string,
            teachingGrades: grades.length > 0 ? grades : ['غير محدد']
          });
        } else if (role === 'parent') {
          await setDoc(doc(db, 'users', user.uid), {
            ...baseData,
            studentPhone: formData.get('studentPhone') as string
          });
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('عذراً، لم يتم تفعيل الدخول بالبريد الإلكتروني في قاعدة البيانات. (يجب تفعيل Email/Password من لوحة تحكم Firebase)');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('حدث خطأ في الاتصال بالشبكة. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.');
      } else {
        setError('حدث خطأ أثناء التسجيل: ' + (err.message || 'يرجى التأكد من صحة البيانات.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white flex items-center justify-center p-6 selection:bg-primary/30 font-sans" dir="rtl">
      <Link to="/" className="absolute top-6 right-6 text-gray-500 dark:text-gray-400 hover:text-[#00B4D8] dark:text-[#D4AF37] flex items-center gap-2 transition-colors text-sm font-bold">
        <ArrowRight className="w-5 h-5" /> عودة للرئيسية
      </Link>
      <div className="absolute top-6 left-6">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-[#1A1A24] rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-[#2D2D3D]"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20">
            ت
          </div>
          <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {isLogin ? 'أهلاً بك مرة أخرى في تفوق' : 'سجل بياناتك عشان تبدأ رحلتك التعليمية'}
          </p>
        </div>

        {!isLogin && (
          <div className="flex bg-gray-100 dark:bg-[#222230] p-1 rounded-xl mb-6">
            <button 
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === 'student' ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
            >
              <GraduationCap className="w-4 h-4" /> طالب
            </button>
            <button 
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === 'teacher' ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
            >
              <Users className="w-4 h-4" /> معلم
            </button>
            <button 
              type="button"
              onClick={() => setRole('parent')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === 'parent' ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
            >
              <Users className="w-4 h-4" /> ولي أمر
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الاسم بالكامل</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <input name="name" required type="text" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="محمد أحمد..." />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">المحافظة</label>
                    <div className="relative">
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <select name="governorate" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-10 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors appearance-none">
                        <option value="">اختر المحافظة</option>
                        {EGYPT_GOVERNORATES.map(gov => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {role === 'student' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الصف الدراسي</label>
                      <div className="relative">
                        <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <select name="grade" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-10 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors appearance-none">
                          <option value="">اختر الصف</option>
                          <option value="الأول الثانوي">الأول الثانوي</option>
                          <option value="الثاني الثانوي">الثاني الثانوي</option>
                          <option value="الثالث الثانوي">الثالث الثانوي</option>
                        </select>
                      </div>
                    </div>
                  ) : role === 'teacher' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">المادة</label>
                      <div className="relative">
                        <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <select name="subject" required className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-10 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors appearance-none">
                          <option value="">اختر المادة</option>
                          <option value="الرياضيات">الرياضيات</option>
                          <option value="الفيزياء">الفيزياء</option>
                          <option value="الكيمياء">الكيمياء</option>
                          <option value="الأحياء">الأحياء</option>
                          <option value="لغة عربية">لغة عربية</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">رقم هاتف الطالب المرتبط</label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <input name="studentPhone" required type="tel" pattern="^01[0125][0-9]{8}$" title="رقم هاتف مصري صحيح (مثال: 01012345678)" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="01X..." dir="ltr" />
                      </div>
                    </div>
                  )}
                </div>

                {role === 'student' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">اسم المدرسة</label>
                      <div className="relative">
                        <School className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <input name="school" required type="text" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="مدرسة..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">رقم ولي الأمر</label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <input name="parentPhone" required type="tel" pattern="^01[0125][0-9]{8}$" title="رقم هاتف مصري صحيح (مثال: 01012345678)" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="01X..." dir="ltr" />
                      </div>
                    </div>
                  </div>
                ) : role === 'teacher' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الرقم القومي</label>
                        <div className="relative">
                          <IdCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <input name="nationalId" required type="text" pattern="^[23][0-9]{13}$" title="رقم قومي مصري صحيح (14 رقم)" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors text-right" placeholder="14 رقم" dir="ltr" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">تاريخ الميلاد</label>
                        <div className="relative">
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <input name="dateOfBirth" required type="date" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">الصفوف الدراسية التي تدرسها</label>
                      <div className="flex gap-4 mt-2">
                        {['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'].map((grade, index) => (
                           <label key={grade} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                              <input name={`grade_${index+1}`} type="checkbox" className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37] rounded border-gray-200 dark:border-[#2D2D3D] focus:ring-[#D4AF37]" />
                              {grade}
                           </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <input name="phone" required type="tel" pattern="^01[0125][0-9]{8}$" title="رقم هاتف مصري صحيح (مثال: 01012345678)" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="01X..." dir="ltr" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input name="email" required type="email" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="email@example.com" dir="ltr" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input name="password" required minLength={6} type="password" className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-12 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors" placeholder="••••••••" dir="ltr" />
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:-translate-y-0.5 hover:bg-[#0077B6] dark:bg-[#B8860B] transition-all mt-6 text-lg disabled:opacity-50">
            {loading ? 'جاري التحميل...' : (isLogin ? 'دخول' : 'إنشاء حساب مجاني')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
          {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <button onClick={() => navigate(isLogin ? '/register' : '/login')} className="text-[#00B4D8] dark:text-[#D4AF37] font-bold hover:underline">
            {isLogin ? 'سجل الآن مجاناً' : 'سجل الدخول'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
