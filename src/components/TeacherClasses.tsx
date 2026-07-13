import React from "react";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, BookOpen, Clock, ImageIcon, X, Image as ImageIcon2, Upload, Eye, EyeOff, Search, AlertTriangle } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Course } from '../types';
import { uploadChunkedFile } from '../lib/upload';
import { toast, Toaster } from 'react-hot-toast';

interface TeacherClassesProps {
  userData: User;
}

export default function TeacherClasses({ userData }: TeacherClassesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCourses = async () => {
    if (!userData?.id) return;
    try {
      const q = query(collection(db, 'courses'), where('teacherId', '==', userData.id));
      const querySnapshot = await getDocs(q);
      const fetchedCourses: Course[] = [];
      querySnapshot.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
      });
      setCourses(fetchedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [userData?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGrade('');
    setPrice('');
    setImageFile(null);
    setImagePreview('');
    setUploadProgress(0);
    setShowCreateModal(false);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !grade || !price) {
      toast.error('الرجاء إكمال جميع الحقول');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadChunkedFile(imageFile, (progress) => {
          setUploadProgress(progress);
        });
      }

      const newCourseData = {
        title,
        description,
        grade,
        price: Number(price),
        teacherId: userData.id,
        teacherName: userData.name,
        subject: userData.subject || '',
        imageUrl,
        enrolledStudents: 0,
        lessonsCount: 0,
        isActive: true,
        status: 'published',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'courses'), newCourseData);
      setCourses([...courses, { id: docRef.id, ...newCourseData } as Course]);
      
      // Dispatch notifications to students of this grade
      try {
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('grade', '==', grade)
        );
        const studentsSnap = await getDocs(studentsQuery);
        const notificationPromises = studentsSnap.docs.map(studentDoc => {
          return addDoc(collection(db, 'notifications'), {
            userId: studentDoc.id,
            title: 'كورس جديد متاح لصفك الدراسي! 📚',
            message: `قام الأستاذ ${userData.name} بنشر كورس جديد بعنوان "${title}" في مادة ${userData.subject || 'مادته الدراسية'}.`,
            type: 'new_course_alert',
            read: false,
            createdAt: new Date().toISOString(),
            courseId: docRef.id
          });
        });
        await Promise.all(notificationPromises);
      } catch (notifErr) {
        console.error("Error creating notifications for new course:", notifErr);
      }
      
      resetForm();
      toast.success('تم إنشاء الكورس بنجاح!');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('حدث خطأ أثناء إنشاء الكورس');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourseConfirm = async () => {
    if (!courseToDelete) return;
    try {
      await deleteDoc(doc(db, 'courses', courseToDelete));
      setCourses(courses.filter(c => c.id !== courseToDelete));
      toast.success('تم حذف الكورس بنجاح');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error('حدث خطأ أثناء حذف الكورس: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setCourseToDelete(null);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = currentStatus === undefined ? false : !currentStatus;
      await updateDoc(doc(db, 'courses', courseId), {
        isActive: newStatus,
        status: newStatus ? 'published' : 'draft'
      });
      setCourses(courses.map(c => c.id === courseId ? { ...c, isActive: newStatus, status: newStatus ? 'published' : 'draft' } as Course : c));
    } catch (error) {
      console.error('Error updating course status:', error);
    }
  };

  const filteredCourses = courses.filter(course => 
    (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">كورساتي</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">أدر الكورسات الخاصة بك وأضف محتوى جديد لطلابك</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> إنشاء كورس جديد
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <input
          type="text"
          placeholder="ابحث في كورساتك..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white placeholder-gray-400"
        />
        <Search className="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-[#2D2D3D] border-t-[#00B4D8] dark:border-t-[#D4AF37] rounded-full animate-spin"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 text-center border border-gray-100 dark:border-[#2D2D3D] shadow-sm"
        >
          <div className="w-24 h-24 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-[#00B4D8] dark:text-[#D4AF37]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد كورسات حالياً</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">ابدأ الآن بإنشاء كورس جديد لطلابك، وأضف الدروس والمحتوى التعليمي بسهولة.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`bg-white dark:bg-[#1A1A24] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-150 dark:border-[#2D2D3D] group transition-all duration-300 flex flex-col relative h-full hover:-translate-y-1 ${course.isActive === false ? 'opacity-70 grayscale-[30%]' : ''}`}
            >
              <Link to={`/course/${course.id}`} className="absolute inset-0 z-0"></Link>
              
              {/* Image Container with strict 16:10 Aspect Ratio */}
              <div className="aspect-[16/10] w-full relative overflow-hidden bg-gray-50 dark:bg-[#15151F] pointer-events-none">
                {course.imageUrl ? (
                  <img 
                    src={course.imageUrl} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
                    }} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 stroke-[1.5]" />
                  </div>
                )}
                
                {/* Grade Badge on the top right */}
                <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                  {course.grade}
                </div>

                {/* Status Indicator Badge on the top left */}
                <div className="absolute top-4 left-4">
                  <div className={`backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black text-white shadow-sm flex items-center gap-1.5 ${
                    course.status === 'published' || course.isActive === true ? 'bg-green-500/90' :
                    course.status === 'under_review' ? 'bg-yellow-500/90' :
                    'bg-gray-500/90'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-white ${course.isActive ? 'animate-pulse' : ''}`} />
                    {course.status === 'published' || course.isActive === true ? 'منشور' :
                      course.status === 'under_review' ? 'قيد المراجعة' :
                      'مسودة'}
                  </div>
                </div>
              </div>

              {/* Content Container */}
              <div className="p-5 flex-1 flex flex-col justify-between pointer-events-none">
                <div>
                  {/* Title */}
                  <h3 className="text-lg font-black text-gray-950 dark:text-white mb-2 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div>
                  {/* Meta Details */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold mb-4 pt-3 border-t border-gray-100 dark:border-[#2D2D3D]">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-450 dark:text-gray-500" />
                      <span>{course.enrolledStudents || 0} طالب</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-gray-450 dark:text-gray-500" />
                      <span>{course.lessonsCount || 0} درس</span>
                    </div>
                  </div>

                  {/* Price & Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2D2D3D] relative z-10 pointer-events-auto">
                    <span className="text-base font-black text-[#00B4D8] dark:text-[#D4AF37]">
                      {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                    </span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleToggleCourseStatus(course.id, course.isActive); }} 
                        title={course.isActive === false ? 'تفعيل الكورس' : 'إلغاء التفعيل'} 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${course.isActive === false ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {course.isActive === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); toast('سيتم إضافة هذه الميزة قريباً', { icon: '⚙️' }); }} 
                        className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#222230] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDeleteCourse(course.id); }} 
                        className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#222230] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#1A1A24]/80 backdrop-blur-xl z-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">إنشاء كورس جديد</h3>
                <button
                  onClick={() => !isSubmitting && resetForm()}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2D3D] text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="create-course-form" onSubmit={handleCreateCourse} className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">غلاف الكورس</label>
                    <div 
                      onClick={() => !isSubmitting && fileInputRef.current?.click()}
                      className={`w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                        imagePreview 
                          ? 'border-transparent' 
                          : 'border-gray-300 dark:border-[#2D2D3D] hover:border-[#00B4D8] dark:hover:border-[#D4AF37] hover:bg-gray-50 dark:hover:bg-[#222230]'
                      }`}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium">اضغط لرفع صورة من جهازك</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    {isSubmitting && imageFile && (
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span>{uploadProgress === 100 ? 'جاري حفظ البيانات...' : 'جاري رفع الصورة...'}</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-2">
                          <div 
                            className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">عنوان الكورس</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white"
                        placeholder="مثال: كورس الرياضيات للصف الأول الثانوي"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">الصف الدراسي</label>
                      <select
                        required
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white"
                      >
                        <option value="">اختر الصف الدراسي</option>
                        {userData?.teachingGrades?.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">سعر الكورس (ج.م)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white"
                        placeholder="مثال: 150 (اكتب 0 للمجاني)"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">وصف الكورس</label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all text-gray-900 dark:text-white resize-none"
                        placeholder="اكتب وصفاً مختصراً للكورس وما سيتعلمه الطالب..."
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-[#2D2D3D] bg-gray-50 dark:bg-[#0D0D12] flex justify-end gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => !isSubmitting && resetForm()}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2D2D3D] transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="create-course-form"
                  disabled={isSubmitting}
                  className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      {imageFile && uploadProgress < 100 
                        ? `جاري الرفع... ${Math.round(uploadProgress)}%` 
                        : (imageFile && uploadProgress === 100) 
                          ? 'جاري الحفظ...' 
                          : 'جاري الإنشاء...'}
                    </>
                  ) : (
                    'إنشاء الكورس'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Course Confirmation Modal */}
      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCourseToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 border border-gray-100 dark:border-[#2D2D3D] text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 dark:text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد حذف الكورس</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الكورس نهائياً؟ ستتم إزالة الكورس وجميع البيانات المرتبطة به ولا يمكن استعادتها مرة أخرى.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setCourseToDelete(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3d3d52] transition-colors flex-1"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCourseConfirm}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex-1 shadow-lg shadow-red-500/10"
                >
                  نعم، احذف الكورس
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
