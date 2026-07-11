import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, BookOpen, Clock, ImageIcon, X, Image as ImageIcon2, Upload, Eye, EyeOff, Search } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Course } from '../types';
import { uploadChunkedFile } from '../lib/upload';

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

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
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
    if (userData?.id) {
      fetchCourses();
    }
  }, [userData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !grade || !price) return;

    try {
      setUploadProgress(0);
      setIsSubmitting(true);
      let uploadedImageUrl = '';

      if (imageFile) {
        uploadedImageUrl = await uploadChunkedFile(imageFile, setUploadProgress);
      }

      const newCourseData = {
        title,
        description,
        grade,
        price: Number(price),
        subject: userData.subject || 'عام',
        teacherId: userData.id,
        teacherName: userData.name,
        imageUrl: uploadedImageUrl || `https://source.unsplash.com/800x600/?${encodeURIComponent(userData.subject || 'education')},study`,
        createdAt: new Date().toISOString(),
        enrolledStudents: 0,
        lessonsCount: 0,
        isActive: true,
      };

      const docRef = await addDoc(collection(db, 'courses'), newCourseData);
      setCourses([...courses, { id: docRef.id, ...newCourseData } as Course]);
      
      // Reset form
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setGrade('');
      setPrice('');
      setImageFile(null);
      setImagePreview('');
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Error creating course:', error);
      alert('حدث خطأ أثناء الإنشاء: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الكورس؟')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        setCourses(courses.filter(c => c.id !== courseId));
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = currentStatus === undefined ? false : !currentStatus;
      await updateDoc(doc(db, 'courses', courseId), {
        isActive: newStatus
      });
      setCourses(courses.map(c => c.id === courseId ? { ...c, isActive: newStatus } : c));
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">كورساتي</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">أدر الكورسات الخاصة بك وأضف محتوى جديد لطلابك</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] hover:-translate-y-0.5 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          إنشاء كورس جديد
        </button>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث في كورساتك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-12 pl-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-[#00B4D8] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 text-center shadow-sm border border-gray-200 dark:border-[#2D2D3D]"
        >
          <div className="w-20 h-20 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-[#00B4D8] dark:text-[#D4AF37]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد كورسات حالياً</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">ابدأ الآن بإنشاء كورس جديد لطلابك، وأضف الدروس والمحتوى التعليمي بسهولة.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white dark:bg-[#1A1A24] rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-[#2D2D3D] group hover:shadow-md transition-all flex flex-col relative ${course.isActive === false ? 'opacity-60 grayscale-[50%]' : ''}`}
            >
              <Link to={`/course/${course.id}`} className="absolute inset-0 z-0"></Link>
              <div className="h-48 relative overflow-hidden bg-gray-100 dark:bg-[#222230] pointer-events-none">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
                  }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon2 className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                    {course.grade}
                  </div>
                  {course.isActive === false && (
                    <div className="bg-orange-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> غير مفعل
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col pointer-events-none">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 font-medium pt-4 border-t border-gray-100 dark:border-[#2D2D3D] mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{course.enrolledStudents} طالب</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>{course.lessonsCount} درس</span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex items-center justify-between mt-auto relative z-10">
                <span className="text-2xl font-black text-[#00B4D8] dark:text-[#D4AF37] pointer-events-none">
                  {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                </span>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.preventDefault(); handleToggleCourseStatus(course.id, course.isActive); }} title={course.isActive === false ? 'تفعيل الكورس' : 'إلغاء التفعيل'} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${course.isActive === false ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                    {course.isActive === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={(e) => { e.preventDefault(); alert('سيتم إضافة هذه الميزة قريباً'); }} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222230] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); handleDeleteCourse(course.id); }} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222230] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">إنشاء كورس جديد</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto">
                <form id="create-course-form" onSubmit={handleCreateCourse} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">عنوان الكورس</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: مراجعة نهائية في الكيمياء العضوية"
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">وصف الكورس</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اكتب وصفاً مفصلاً عما سيتم تدريسه في هذا الكورس..."
                      rows={4}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">الصف الدراسي</label>
                      <select
                        required
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors"
                      >
                        <option value="">اختر الصف</option>
                        {userData.teachingGrades?.map(g => (
                          <option key={g} value={g}>{g}</option>
                        )) || (
                          <>
                            <option value="الأول الثانوي">الأول الثانوي</option>
                            <option value="الثاني الثانوي">الثاني الثانوي</option>
                            <option value="الثالث الثانوي">الثالث الثانوي</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">سعر الكورس (ج.م)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0 للكورس المجاني"
                        className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">صورة الكورس (اختياري)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#2D2D3D] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors relative overflow-hidden"
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
                          <div className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full transition-all duration-300" style={{ width: `${Math.max(uploadProgress, 2)}%` }}></div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">اتركه فارغاً وسنضع صورة مناسبة تلقائياً بناءً على المادة.</p>
                  </div>
                </form>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-end gap-3 sm:gap-4 bg-gray-50 dark:bg-[#0D0D12] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2D2D3D] transition-colors"
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
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
    </div>
  );
}
