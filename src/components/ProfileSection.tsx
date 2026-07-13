import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Phone, Mail, MapPin, School, GraduationCap, 
  Lock, Trash2, Key, Save, AlertTriangle, ShieldAlert, Shield, 
  BookOpen, Calendar, IdCard, Sparkles, Check, Download, RefreshCw, Award
} from 'lucide-react';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'القليوبية', 'بورسعيد', 'السويس', 
  'مطروح', 'الدقهلية', 'الشرقية', 'المنوفية', 'الغربية', 'الإسماعيلية', 
  'دمياط', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 
  'سوهاج', 'قنا', 'أسوان', 'الأقصر', 'البحر الأحمر', 'الوادي الجديد', 
  'شمال سيناء', 'جنوب سيناء'
];

interface ProfileSectionProps {
  userData: any;
  onUpdateUserData: (newData: any) => void;
}

export default function ProfileSection({ userData, onUpdateUserData }: ProfileSectionProps) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'academic' | 'idCard' | 'security' | 'danger'>('basic');
  const [loading, setLoading] = useState(false);
  const [avatarBg, setAvatarBg] = useState(userData?.avatarBg || 'from-[#00B4D8] to-[#0077B6]');
  const [isFlipped, setIsFlipped] = useState(false);

  // Basic Details State
  const [name, setName] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [governorate, setGovernorate] = useState(userData?.governorate || '');

  // Academic / Student Details State
  const [school, setSchool] = useState(userData?.school || '');
  const [grade, setGrade] = useState(userData?.grade || '');
  const [parentPhone, setParentPhone] = useState(userData?.parentPhone || '');

  // Teacher Specific State
  const [subject, setSubject] = useState(userData?.subject || '');
  const [nationalId, setNationalId] = useState(userData?.nationalId || '');
  const [dateOfBirth, setDateOfBirth] = useState(userData?.dateOfBirth || '');
  const [teachingGrades, setTeachingGrades] = useState<string[]>(userData?.teachingGrades || []);

  // Parent Specific State
  const [studentPhone, setStudentPhone] = useState(userData?.studentPhone || '');

  // Password Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete Account Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Save basic/role-specific information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('الرجاء إدخال الاسم كاملاً');
      return;
    }
    if (!phone.trim()) {
      toast.error('الرجاء إدخال رقم الهاتف');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', userData.id);
      
      let updatedFields: any = {
        name,
        phone,
        governorate,
        avatarBg
      };

      if (userData.role === 'student') {
        updatedFields = {
          ...updatedFields,
          school,
          grade,
          parentPhone
        };
      } else if (userData.role === 'teacher') {
        updatedFields = {
          ...updatedFields,
          subject,
          nationalId,
          dateOfBirth,
          teachingGrades
        };
      } else if (userData.role === 'parent') {
        updatedFields = {
          ...updatedFields,
          studentPhone
        };
      }

      await updateDoc(userDocRef, updatedFields);
      onUpdateUserData({ ...userData, ...updatedFields });
      toast.success('تم تحديث ملفك الشخصي بنجاح! ✨');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('فشل تحديث البيانات: ' + (error.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('الرجاء ملء جميع حقول كلمة المرور');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب ألا تقل عن 6 رموز');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('تأكيد كلمة المرور الجديدة غير متطابق');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('لم يتم العثور على المستخدم الحالي');
      }

      // Reauthenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update Password
      await updatePassword(user, newPassword);
      toast.success('تمت إعادة تعيين كلمة المرور بنجاح! 🔐');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('كلمة المرور الحالية غير صحيحة.');
      } else {
        toast.error('فشل تغيير كلمة المرور: ' + (error.message || 'يرجى التأكد من البيانات'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle teaching grades for teachers
  const handleToggleGrade = (gradeName: string) => {
    if (teachingGrades.includes(gradeName)) {
      setTeachingGrades(teachingGrades.filter(g => g !== gradeName));
    } else {
      setTeachingGrades([...teachingGrades, gradeName]);
    }
  };

  // Permanently delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'احذف حسابي') {
      toast.error('يرجى كتابة الكلمة التأكيدية بشكل صحيح');
      return;
    }
    if (!deletePassword) {
      toast.error('الرجاء إدخال كلمة المرور لتأكيد الهوية');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('لم يتم العثور على المستخدم الحالي');
      }

      // Reauthenticate to prove identity before deletion
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      const userId = user.uid;

      // 1. Delete user doc from Firestore
      await deleteDoc(doc(db, 'users', userId));

      // 2. Delete Auth User from Firebase
      await deleteUser(user);

      toast.success('تم حذف الحساب والبيانات نهائياً بنجاح. نأسف لمغادرتك! 👋');
      setShowDeleteModal(false);
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('كلمة المرور غير صحيحة. يرجى إعادة المحاولة.');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('أمنياً، تتطلب هذه العملية تسجيل خروجك ثم تسجيل الدخول مرة أخرى للتحقق من هويتك.');
      } else {
        toast.error('حدث خطأ أثناء حذف الحساب: ' + (error.message || 'يرجى المحاولة لاحقاً'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-full blur-2xl"></div>
        <div className={`w-24 h-24 bg-gradient-to-br ${avatarBg} rounded-full border-4 border-white dark:border-[#2D2D3D] flex items-center justify-center font-black text-4xl text-white shadow-lg shrink-0 relative transition-all duration-500`}>
          {name.charAt(0) || 'U'}
          <span className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-[#1A1A24] flex items-center justify-center" title="نشط">
            <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
          </span>
        </div>
        <div className="text-center md:text-right flex-1 space-y-1">
          <div className="flex flex-col md:flex-row items-center gap-2 justify-center md:justify-start">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{name || 'مستخدم جديد'}</h2>
            <span className="bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] px-3 py-1 rounded-full text-xs font-black">
              {userData?.role === 'teacher' ? '👨‍🏫 معلم' : userData?.role === 'parent' ? '👨‍👩‍👦 ولي أمر' : userData?.role === 'admin' ? '🛡️ مدير النظام' : '🎓 طالب'}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-bold flex items-center justify-center md:justify-start gap-1">
            <Mail className="w-4 h-4 text-gray-400" /> {userData?.email}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">موقعنا الحالي: {governorate || 'غير محدد'}</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-3 border border-gray-200 dark:border-[#2D2D3D] shadow-sm flex md:flex-col gap-1 overflow-x-auto md:overflow-visible sticky top-24 z-10">
          <button
            onClick={() => setActiveSubTab('basic')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === 'basic'
                ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
            }`}
          >
            <User className="w-4 h-4 shrink-0" /> البيانات الأساسية
          </button>

          <button
            onClick={() => setActiveSubTab('academic')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === 'academic'
                ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
            }`}
          >
            {userData?.role === 'teacher' ? (
              <>
                <BookOpen className="w-4 h-4 shrink-0" /> بيانات التدريس
              </>
            ) : userData?.role === 'parent' ? (
              <>
                <GraduationCap className="w-4 h-4 shrink-0" /> بيانات الأبناء
              </>
            ) : userData?.role === 'admin' ? (
              <>
                <Shield className="w-4 h-4 shrink-0" /> الصلاحيات والتحكم
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4 shrink-0" /> بيانات الدراسة
              </>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('idCard')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === 'idCard'
                ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
            }`}
          >
            <IdCard className="w-4 h-4 shrink-0" /> الهوية الرقمية الذكية
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === 'security'
                ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" /> الأمان والحماية
          </button>

          <button
            onClick={() => setActiveSubTab('danger')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 whitespace-nowrap ${
              activeSubTab === 'danger' ? 'bg-red-50 dark:bg-red-950/20 font-black' : ''
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" /> منطقة الخطر
          </button>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {/* Basic Info Form */}
            {activeSubTab === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">البيانات الأساسية للملف</h3>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">حافظ على بيانات الاتصال الخاصة بك محدثة وموثوقة</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Avatar Color Selector */}
                  <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] space-y-3">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> لون مظهر الحساب (الخلفية)
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { name: 'سماوي Teachland', value: 'from-[#00B4D8] to-[#0077B6]' },
                        { name: 'ذهبي متميز', value: 'from-[#D4AF37] to-[#B8860B]' },
                        { name: 'بنفسجي ملكي', value: 'from-[#7209B7] to-[#3F37C9]' },
                        { name: 'وردي ملهم', value: 'from-[#FF007F] to-[#7209B7]' },
                        { name: 'أخضر تفاحي', value: 'from-[#4CCC81] to-[#2E8B57]' },
                        { name: 'برتقالي مشع', value: 'from-[#FF6B6B] to-[#FF8E53]' }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setAvatarBg(item.value)}
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.value} relative border-2 transition-transform duration-200 active:scale-95 ${
                            avatarBg === item.value 
                              ? 'border-[#00B4D8] dark:border-[#D4AF37] scale-110 shadow-md shadow-[#00B4D8]/20' 
                              : 'border-transparent'
                          }`}
                          title={item.name}
                        >
                          {avatarBg === item.value && (
                            <span className="absolute inset-0 flex items-center justify-center text-white">
                              <Check className="w-4 h-4" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> الاسم كاملاً
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                      placeholder="أدخل الاسم الرباعي"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> رقم الهاتف (واتساب)
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> المحافظة
                    </label>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                    >
                      <option value="">اختر المحافظة</option>
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#00B4D8]/10 dark:shadow-[#D4AF37]/10 flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> حفظ التعديلات
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Academic Details Form based on Role */}
            {activeSubTab === 'academic' && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                    {userData?.role === 'teacher' ? 'بيانات التدريس والتأهيل' : userData?.role === 'parent' ? 'توصيل ومتابعة الأبناء' : userData?.role === 'admin' ? 'التحكم الإداري والنظام' : 'المرحلة والبيانات الدراسية'}
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">هذه البيانات تحدد طريقة ظهورك والمحتوى المناسب لك على المنصة</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {userData?.role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> السنة الدراسية
                        </label>
                        <select
                          required
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                        >
                          <option value="">اختر السنة الدراسية</option>
                          <optgroup label="المرحلة الإعدادية">
                            <option value="الأول الإعدادي">الصف الأول الإعدادي</option>
                            <option value="الثاني الإعدادي">الصف الثاني الإعدادي</option>
                            <option value="الثالث الإعدادي">الصف الثالث الإعدادي</option>
                          </optgroup>
                          <optgroup label="المرحلة الثانوية">
                            <option value="الأول الثانوي">الصف الأول الثانوي</option>
                            <option value="الثاني الثانوي">الصف الثاني الثانوي</option>
                            <option value="الثالث الثانوي">الصف الثالث الثانوي</option>
                          </optgroup>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> اسم المدرسة
                        </label>
                        <input
                          type="text"
                          required
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="مثال: مدرسة السعيدية الثانوية"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> رقم هاتف ولي الأمر لمتابعة الدرجات والغياب
                        </label>
                        <input
                          type="tel"
                          required
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="01xxxxxxxxx"
                        />
                      </div>
                    </>
                  )}

                  {userData?.role === 'teacher' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> المادة الأساسية التي تقوم بتدريسها
                        </label>
                        <input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="مثال: كيمياء، فيزياء، أحياء"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <IdCard className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> الرقم القومي المكون من 14 رقم (للتوثيق)
                        </label>
                        <input
                          type="text"
                          maxLength={14}
                          required
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="2xxxxxxxxxxxxx"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> تاريخ الميلاد
                        </label>
                        <input
                          type="date"
                          required
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors text-right"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 block mb-2">الصفوف الدراسية التي تدرس لها</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {['الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'].map((g) => {
                            const isChecked = teachingGrades.includes(g);
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => handleToggleGrade(g)}
                                className={`p-3.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                  isChecked
                                    ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 border-[#00B4D8] dark:border-[#D4AF37] text-[#00B4D8] dark:text-[#D4AF37]'
                                    : 'border-gray-200 dark:border-[#2D2D3D] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0D0D12]'
                                }`}
                              >
                                {isChecked && <Check className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />}
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}


                  {userData?.role === 'admin' && (
                    <div className="p-4 bg-gray-50 dark:bg-[#222230]/50 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] text-sm leading-relaxed text-gray-500 dark:text-gray-400 font-bold">
                      <p>أنت قمت بتسجيل الدخول كمدير نظام (Admin).</p>
                      <p className="mt-2 text-xs">لا يتطلب حساب المدير استكمال بيانات دراسية أو إعدادات تدريس إضافية.</p>
                    </div>
                  )}
                  {userData?.role === 'parent' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> رقم هاتف الطالب المرتبط بحسابك لمتابعة أدائه
                        </label>
                        <input
                          type="tel"
                          required
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors"
                          placeholder="01xxxxxxxxx"
                        />
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-[#222230]/50 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        📌 <b>ملاحظة:</b> رقم الهاتف هذا هو المفتاح لربط نتائج وتقارير ودرجات الطالب بلوحة تحكم ولي الأمر مباشرة. يرجى التأكد من تطابقه التام مع الرقم الذي يسجل به ابنك في حسابه الشخصي.
                      </div>
                    </>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#00B4D8]/10 dark:shadow-[#D4AF37]/10 flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> حفظ البيانات الدراسية
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Digital ID Card Tab */}
            {activeSubTab === 'idCard' && (
              <motion.div
                key="idCard"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6 text-right"
                dir="rtl"
              >
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="mb-6 text-center sm:text-right">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">بطاقة الهوية الرقمية الذكية</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">بطاقتك التعليمية الخاصة للاستخدام داخل المنصة ومع المعلمين ومراكز الخدمة</p>
                  </div>

                  {/* 3D Flip Card Container */}
                  <div className="flex flex-col items-center justify-center py-6">
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full max-w-[400px] h-[240px] cursor-pointer [perspective:1000px] group select-none"
                    >
                      <div className={`relative w-full h-full duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                        
                        {/* CARD FRONT */}
                        <div className={`absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br ${avatarBg} text-white shadow-2xl [backface-visibility:hidden] flex flex-col justify-between overflow-hidden border border-white/10`}>
                          {/* Design accents */}
                          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl translate-y-12 -translate-x-12"></div>
                          
                          {/* Header */}
                          <div className="flex justify-between items-start z-10 relative">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-sm">T</div>
                              <span className="font-black text-sm tracking-wide">Teachland</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest bg-white/20 backdrop-blur-sm px-2 py-1 rounded font-black">
                              {userData?.role === 'teacher' ? 'مدرس متميز' : userData?.role === 'parent' ? 'ولي أمر' : userData?.role === 'admin' ? 'مدير النظام' : 'طالب ذكي'}
                            </span>
                          </div>

                          {/* Body */}
                          <div className="flex items-center gap-4 my-auto z-10 relative">
                            {/* Chip & Info */}
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-black text-xl border border-white/20 shrink-0">
                              {name.charAt(0) || 'U'}
                            </div>
                            <div className="space-y-1 text-right">
                              <h4 className="font-black text-base truncate max-w-[200px]">{name || 'مستخدم Teachland'}</h4>
                              <p className="text-[10px] text-white/80 font-bold tracking-wider">
                                {userData?.role === 'student' ? (grade || 'الصف الدراسي غير محدد') : userData?.role === 'teacher' ? (subject || 'التخصص الدراسي غير محدد') : 'متابع للأبناء'}
                              </p>
                              <p className="text-[9px] text-white/60 font-mono">ID: TF-{userData?.id?.slice(0, 8).toUpperCase() || 'NEW'}</p>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex justify-between items-end z-10 relative border-t border-white/15 pt-2">
                            <div className="text-right">
                              <p className="text-[8px] text-white/50">المحافظة</p>
                              <p className="text-[10px] font-bold">{governorate || 'القاهرة'}</p>
                            </div>
                            <div className="text-left font-mono text-[9px] tracking-wider text-white/70">
                              VALID: 2026-2027
                            </div>
                          </div>
                        </div>

                        {/* CARD BACK */}
                        <div className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-slate-900 text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between overflow-hidden border border-slate-800">
                          {/* Magnetic Strip */}
                          <div className="absolute top-4 left-0 right-0 h-9 bg-slate-800"></div>

                          {/* Barcode representation */}
                          <div className="mt-12 space-y-2 relative z-10">
                            <div className="bg-white p-2 rounded flex flex-col items-center justify-center">
                              {/* Custom barcode using flex lines */}
                              <div className="h-8 flex items-center justify-between w-full gap-[2px]" dir="ltr">
                                {[1,3,1,2,1,4,2,1,3,1,1,2,3,1,2,1,4,1,2,3,1,1,2,1].map((width, idx) => (
                                  <div 
                                    key={idx} 
                                    className="h-full bg-slate-950" 
                                    style={{ flexGrow: width }}
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] text-slate-600 font-mono tracking-widest mt-1">
                                TF-{userData?.id?.toUpperCase() || 'NEWUSER'}
                              </span>
                            </div>
                          </div>

                          {/* Agreement Text */}
                          <div className="text-[8px] text-slate-400 text-center leading-relaxed font-bold z-10 relative">
                            هذه البطاقة رقمية مشفرة وصادرة من منصة Teachland. الاستخدام يخضع لشروط الخدمة. في حال العثور عليها يرجى تسليمها أو التواصل مع الدعم الفني.
                          </div>

                          {/* Contact Info */}
                          <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-slate-800 pt-2 z-10 relative">
                            <span>support@tafawwoq.com</span>
                            <span>الرقم الموحد: ١٩٠٠٠</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mt-4 animate-pulse">
                      💡 اضغط على البطاقة لقلبها واستعراض الرمز التعريفي
                    </p>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-6 w-full max-w-[400px]">
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#0D0D12] dark:hover:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] text-gray-700 dark:text-gray-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" /> طباعة الهوية
                      </button>
                      <button 
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 hover:bg-[#00B4D8]/20 dark:hover:bg-[#D4AF37]/20"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> قلب البطاقة
                      </button>
                    </div>
                  </div>
                </div>

                {/* Achievements Segment */}
                <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Award className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">الأوسمة والإنجازات الخاصة بك</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-lg">🎖️</div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">عضو مؤسس</h4>
                        <p className="text-[10px] text-gray-500">تم الانضمام لدفعة ٢٠٢٦ بنجاح</p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
                      name && phone && governorate 
                        ? 'bg-green-500/10 border-green-200 dark:border-green-900/30 text-green-500' 
                        : 'bg-gray-50 dark:bg-[#0D0D12] border-gray-100 dark:border-[#2D2D3D] opacity-60'
                    }`}>
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-black text-lg">📝</div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm text-gray-950 dark:text-white">ملف مكتمل</h4>
                        <p className="text-[10px] text-gray-500">تم تعبئة جميع بيانات الملف بنجاح</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-lg">💡</div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">صانع الملاحظات</h4>
                        <p className="text-[10px] text-gray-500">قمت بتسجيل ملاحظات دراسية ذكية</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-lg">⭐</div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">المتعلم الدؤوب</h4>
                        <p className="text-[10px] text-gray-500">نشاط تعليمي منتظم داخل الحصص</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Passwords Settings Form */}
            {activeSubTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">تعديل كلمة مرور الحساب</h3>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">قم بتحديث كلمة المرور بانتظام للحفاظ على خصوصيتك وأمان حسابك</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> كلمة المرور الحالية
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors text-right"
                      dir="ltr"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors text-right"
                      dir="ltr"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#00B4D8] dark:text-[#D4AF37]" /> تأكيد كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-colors text-right"
                      dir="ltr"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#00B4D8]/10 dark:shadow-[#D4AF37]/10 flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Key className="w-4 h-4" /> تحديث كلمة المرور
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Danger Zone Content */}
            {activeSubTab === 'danger' && (
              <motion.div
                key="danger"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl p-6 sm:p-8 border border-red-200 dark:border-red-900/30 shadow-sm space-y-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-red-600 dark:text-red-400 mb-1">حذف الحساب نهائياً</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                      بمجرد حذف حسابك، لن تتمكن من التراجع عن هذه الخطوة. سيتم محو جميع كورساتك المشترك بها، مستواك التعليمي، درجاتك، مدفوعاتك، ورصيد محفظتك بالكامل ولن نتمكن من استرجاعها مطلقاً.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-4 border border-red-100 dark:border-red-950/40 text-xs text-red-500 dark:text-red-400 leading-relaxed font-bold">
                  ⚠️ <b>تنبيه بالغ الأهمية:</b> إذا قمت بحذف الحساب وكان لديك اشتراكات نشطة أو مبالغ متبقية في محفظتك الإلكترونية، فستفقدها تماماً دون أي حق للمطالبة بها. يرجى مراجعة الدعم الفني أولاً إن كنت تواجه أي مشكلة.
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-red-500/10 hover:shadow-red-500/20 w-full sm:w-auto"
                  >
                    بدء إجراءات حذف الحساب النهائي
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Account Deletion Confirmation Dialog Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#1A1A24] rounded-2xl w-full max-w-md relative z-10 shadow-2xl p-5 sm:p-6 border border-red-100 dark:border-red-950/20 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto text-red-500 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">تأكيد حذف الحساب 🤔</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  هذا الإجراء سيقوم بحذف حسابك بالكامل من قواعد بيانات "Teachland". لتأكيد رغبتك الجادة، يرجى كتابة العبارة التالية في المربع أدناه:
                </p>
                <div className="bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg inline-block border border-red-200/40 font-black text-red-600 dark:text-red-400 text-xs mt-1">
                  احذف حسابي
                </div>
              </div>

              <div className="space-y-3 text-right">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 block">اكتب كلمة التأكيد هنا</label>
                  <input
                    type="text"
                    required
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none text-center font-bold"
                    placeholder="احذف حسابي"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 block">أدخل كلمة مرور الحساب للتحقق الأمني</label>
                  <input
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none text-center"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmationText('');
                    setDeletePassword('');
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3d3d52] transition-colors flex-1 order-2 sm:order-1"
                >
                  تراجع، لا أريد الحذف
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex-1 shadow-lg shadow-red-500/15 flex items-center justify-center gap-1.5 order-1 sm:order-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" /> نعم، احذف الحساب فوراً
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
