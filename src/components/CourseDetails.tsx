import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, Plus, Trash2, Video, BookOpen, Clock, Edit2, X, Upload } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { User, Course, Lesson } from '../types';
import ThemeToggle from './ThemeToggle';
import { uploadChunkedFile } from '../lib/upload';

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData({ id: userDoc.id, ...userDoc.data() } as User);
          }
        } else {
          navigate('/login');
          return;
        }

        if (id) {
          const courseDoc = await getDoc(doc(db, 'courses', id));
          if (courseDoc.exists()) {
            setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
          } else {
            navigate('/dashboard');
            return;
          }

          const lessonsQ = query(
            collection(db, 'lessons'), 
            where('courseId', '==', id)
          );
          const lessonsSnap = await getDocs(lessonsQ);
          const fetchedLessons: Lesson[] = [];
          lessonsSnap.forEach((doc) => {
            fetchedLessons.push({ id: doc.id, ...doc.data() } as Lesson);
          });
          fetchedLessons.sort((a, b) => a.order - b.order);
          setLessons(fetchedLessons);
          if (fetchedLessons.length > 0) {
            setActiveLesson(fetchedLessons[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setLessonVideoUrl('');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !lessonTitle || (!lessonVideoUrl && !videoFile)) return;

    try {
      setUploadProgress(0);
      setIsSubmitting(true);
      let uploadedVideoUrl = lessonVideoUrl;

      if (videoFile) {
        uploadedVideoUrl = await uploadChunkedFile(videoFile, setUploadProgress);
      }

      const newLesson = {
        courseId: id,
        title: lessonTitle,
        description: lessonDesc,
        videoUrl: uploadedVideoUrl,
        order: lessons.length + 1,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'lessons'), newLesson);
      const addedLesson = { id: docRef.id, ...newLesson } as Lesson;
      setLessons([...lessons, addedLesson]);
      if (!activeLesson) setActiveLesson(addedLesson);
      
      setShowAddLesson(false);
      setLessonTitle('');
      setLessonDesc('');
      setLessonVideoUrl('');
      setVideoFile(null);
      setVideoPreview('');
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Error adding lesson:', error);
      alert('حدث خطأ أثناء الإضافة: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      try {
        await deleteDoc(doc(db, 'lessons', lessonId));
        setLessons(lessons.filter(l => l.id !== lessonId));
        if (activeLesson?.id === lessonId) {
          setActiveLesson(null);
        }
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    }
  };

  // Helper to extract YouTube embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        const videoId = url.includes('youtu.be/') ? url.split('youtu.be/')[1].split('?')[0] : new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] flex items-center justify-center font-sans" dir="rtl">
        <div className="w-12 h-12 border-4 border-[#00B4D8] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) return null;

  const isTeacher = userData?.id === course.teacherId;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white font-sans selection:bg-[#00B4D8]/30 dark:selection:bg-[#D4AF37]/30" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-[#1A1A24] border-b border-gray-200 dark:border-[#2D2D3D] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-full transition-colors text-gray-600 dark:text-gray-300">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <h1 className="font-black text-xl text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-md">{course.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm font-bold bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 text-[#00B4D8] dark:text-[#D4AF37] px-4 py-2 rounded-full">
              <BookOpen className="w-4 h-4" />
              {course.subject} - {course.grade}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Video Player & Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-lg">
            {activeLesson ? (
              activeLesson.videoUrl.includes('youtube.com') || activeLesson.videoUrl.includes('youtu.be') ? (
                <iframe 
                  src={getEmbedUrl(activeLesson.videoUrl)} 
                  title={activeLesson.title}
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe 
                  key={activeLesson.videoUrl}
                  src={activeLesson.videoUrl} 
                  title={activeLesson.title}
                  className="w-full h-full absolute inset-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-900">
                <Video className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-medium text-lg">اختر درساً للبدء</p>
              </div>
            )}
          </div>

          {activeLesson && (
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#2D2D3D]">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{activeLesson.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{activeLesson.description || 'لا يوجد وصف لهذا الدرس.'}</p>
            </div>
          )}
          
          {!activeLesson && (
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#2D2D3D]">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">عن الكورس</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{course.description}</p>
            </div>
          )}
        </div>

        {/* Right Column: Lessons List */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2D2D3D] flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex justify-between items-center bg-gray-50/50 dark:bg-[#222230]/50 rounded-t-2xl">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                محتوى الكورس
              </h3>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{lessons.length} درس</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {lessons.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">لم يتم إضافة دروس بعد</p>
                </div>
              ) : (
                lessons.map((lesson, idx) => (
                  <div 
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`p-4 rounded-xl cursor-pointer transition-all flex items-start gap-4 group ${
                      activeLesson?.id === lesson.id 
                      ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 border border-[#00B4D8]/30 dark:border-[#D4AF37]/30' 
                      : 'hover:bg-gray-50 dark:hover:bg-[#222230] border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      activeLesson?.id === lesson.id
                      ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white'
                      : 'bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 group-hover:bg-[#00B4D8]/20 dark:group-hover:bg-[#D4AF37]/20 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold truncate text-sm mb-1 ${
                        activeLesson?.id === lesson.id ? 'text-[#0077B6] dark:text-[#B8860B]' : 'text-gray-900 dark:text-white'
                      }`}>
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lesson.description || 'فيديو تعليمي'}</p>
                    </div>
                    {isTeacher && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="حذف الدرس"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {isTeacher && (
              <div className="p-4 border-t border-gray-100 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24] rounded-b-2xl">
                <button
                  onClick={() => setShowAddLesson(true)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#2D2D3D] text-gray-600 dark:text-gray-400 hover:border-[#00B4D8] dark:hover:border-[#D4AF37] hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:bg-gray-50 dark:hover:bg-[#222230] transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Plus className="w-5 h-5" />
                  إضافة درس جديد
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {showAddLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowAddLesson(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-[#2D2D3D] flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">إضافة درس جديد</h3>
                <button onClick={() => setShowAddLesson(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto">
                <form id="add-lesson-form" onSubmit={handleAddLesson} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">عنوان الدرس</label>
                    <input
                      type="text"
                      required
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="مثال: الحصة الأولى - مقدمة"
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">فيديو الدرس</label>
                      <div className="flex flex-col gap-3">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#2D2D3D] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors relative overflow-hidden"
                        >
                          {videoFile ? (
                            <div className="flex flex-col items-center text-[#00B4D8] dark:text-[#D4AF37]">
                              <Video className="w-8 h-8 mb-2" />
                              <span className="text-sm font-bold truncate max-w-[200px]">{videoFile.name}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                              <Upload className="w-6 h-6 mb-2" />
                              <span className="text-sm font-medium">اضغط لرفع فيديو من جهازك</span>
                            </div>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleVideoChange}
                            accept="video/*"
                            className="hidden"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-gray-200 dark:bg-[#2D2D3D]"></div>
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">أو</span>
                          <div className="h-px flex-1 bg-gray-200 dark:bg-[#2D2D3D]"></div>
                        </div>

                        <input
                          type="url"
                          value={lessonVideoUrl}
                          onChange={(e) => {
                            setLessonVideoUrl(e.target.value);
                            if (e.target.value) {
                              setVideoFile(null);
                              setVideoPreview('');
                            }
                          }}
                          placeholder="أدخل رابط YouTube..."
                          className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {isSubmitting && videoFile && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                        <span>{uploadProgress === 100 ? 'جاري حفظ البيانات...' : 'جاري رفع الفيديو...'}</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-2">
                        <div className="bg-[#00B4D8] dark:bg-[#D4AF37] h-2 rounded-full transition-all duration-300" style={{ width: `${Math.max(uploadProgress, 2)}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">وصف قصير (اختياري)</label>
                    <textarea
                      value={lessonDesc}
                      onChange={(e) => setLessonDesc(e.target.value)}
                      placeholder="وصف مختصر للدرس وما سيتعلمه الطالب..."
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] focus:bg-white dark:bg-[#1A1A24] transition-colors resize-none"
                    />
                  </div>
                </form>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-end gap-3 sm:gap-4 bg-gray-50 dark:bg-[#0D0D12] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddLesson(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2D2D3D] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="add-lesson-form"
                  disabled={isSubmitting}
                  className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {videoFile && uploadProgress < 100 
                        ? `جاري الرفع... ${Math.round(uploadProgress)}%` 
                        : (videoFile && uploadProgress === 100) 
                          ? 'جاري الحفظ...' 
                          : 'جاري الإضافة...'}
                    </>
                  ) : (
                    'إضافة الدرس'
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
