import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ImageIcon, Search, Filter, Star } from 'lucide-react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Course } from '../types';

interface StudentCoursesProps {
  userData: User;
}

export default function StudentCourses({ userData }: StudentCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [courseRatings, setCourseRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Fetch courses for the student's grade if set, else fetch all
      let q = collection(db, 'courses');
      const querySnapshot = await getDocs(q);
      const fetchedCourses: Course[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Course;
        if (!userData.grade || data.grade === userData.grade) {
          fetchedCourses.push({ id: doc.id, ...data });
        }
      });
      setCourses(fetchedCourses);

      // Fetch reviews and calculate average ratings
      try {
        const reviewsSnap = await getDocs(collection(db, 'reviews'));
        const ratings: Record<string, { total: number; count: number }> = {};
        reviewsSnap.forEach((doc) => {
          const data = doc.data();
          const cid = data.courseId;
          if (cid) {
            if (!ratings[cid]) {
              ratings[cid] = { total: 0, count: 0 };
            }
            ratings[cid].total += data.rating || 0;
            ratings[cid].count += 1;
          }
        });

        const formattedRatings: Record<string, { average: number; count: number }> = {};
        Object.keys(ratings).forEach((cid) => {
          formattedRatings[cid] = {
            average: parseFloat((ratings[cid].total / ratings[cid].count).toFixed(1)),
            count: ratings[cid].count
          };
        });
        setCourseRatings(formattedRatings);
      } catch (err) {
        console.error('Error fetching course reviews/ratings:', err);
      }

      // Fetch progress records
      if (userData?.id) {
        const qProg = query(collection(db, 'course_progress'), where('userId', '==', userData.id));
        const progSnap = await getDocs(qProg);
        const map: Record<string, any> = {};
        progSnap.forEach((doc) => {
          const data = doc.data();
          map[data.courseId] = data;
        });
        setProgressMap(map);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [userData]);

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const q = query(collection(db, "course_progress"), where("userId", "==", userData.id));
        const snapshot = await getDocs(q);
        const now = new Date();
        snapshot.forEach(async (docSnap) => {
          const data = docSnap.data();
          const lastWatched = new Date(data.lastWatchedAt || data.createdAt);
          const diffTime = Math.abs(now.getTime() - lastWatched.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 3) {
            if (!data.lastNotifiedAt || (now.getTime() - new Date(data.lastNotifiedAt).getTime()) > 3 * 24 * 60 * 60 * 1000) {
              import("firebase/firestore").then(async ({ addDoc, updateDoc, doc, collection }) => {
                await addDoc(collection(db, "notifications"), {
                  userId: userData.id,
                  title: "تذكير بالدراسة 📚",
                  message: `لقد مر وقت طويل منذ آخر مرة شاهدت فيها كورس. استمر في تميزك!`,
                  read: false,
                  createdAt: now.toISOString(),
                  type: "system"
                });
                await updateDoc(docSnap.ref, { lastNotifiedAt: now.toISOString() });
              });
            }
          }
        });
      } catch (error) {
        console.error("Error checking progress:", error);
      }
    };
    if (userData && userData.id) {
      checkProgress();
    }
  }, [userData]);

  const subjects = Array.from(new Set(courses.map(c => c.subject)));

  const filteredCourses = courses.filter(c => {
    const isPublished = c.isActive !== false;
    const matchesSearch = (c.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                          (c.description || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesSubject = selectedSubject === '' || c.subject === selectedSubject;
    return isPublished && matchesSearch && matchesSubject;
  });

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">استكشف الكورسات</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">اختر الكورسات المناسبة لصفك الدراسي ({userData.grade || 'كل الصفوف'})</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن كورس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-12 pl-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] transition-colors"
          />
        </div>
        <div className="relative md:w-64">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl pr-12 pl-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:border-[#D4AF37] transition-colors appearance-none"
          >
            <option value="">كل المواد</option>
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-[#00B4D8] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1A1A24] rounded-3xl p-12 text-center shadow-sm border border-gray-200 dark:border-[#2D2D3D]"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-[#222230] rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد كورسات مطابقة</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">لم نتمكن من العثور على كورسات تطابق بحثك الحالي.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const progressData = progressMap[course.id];
            let percent = 0;
            let completedCount = 0;
            if (progressData) {
              if (progressData.completedLessons) {
                completedCount = progressData.completedLessons.length;
                const totalLessons = course.lessonsCount || 1;
                percent = parseFloat(((completedCount / totalLessons) * 100).toFixed(1));
              } else if (progressData.progressPercent !== undefined) {
                percent = progressData.progressPercent;
              }
            }
            const isEnrolled = userData?.role === 'student' && course.enrolledStudentIds?.includes(userData.id);

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white dark:bg-[#1A1A24] rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-[#2D2D3D] group hover:shadow-md transition-all flex flex-col relative h-full"
              >
                <Link to={`/course/${course.id}`} className="absolute inset-0 z-0"></Link>
                <div className="h-48 relative overflow-hidden bg-gray-100 dark:bg-[#222230] pointer-events-none">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
                    }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-[#00B4D8] dark:text-[#D4AF37] shadow-sm">
                    {course.subject}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col pointer-events-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-[#00B4D8] dark:text-[#D4AF37] font-bold">{course.teacherName}</div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        {(courseRatings[course.id]?.average || 5.0).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                        ({courseRatings[course.id]?.count || 0})
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">{course.description}</p>
                  
                  {isEnrolled && (
                    <div className="mb-5 bg-gray-50/50 dark:bg-[#222230]/30 p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                      <div className="flex items-center justify-between mb-1.5 text-xs font-black">
                        <span className="text-gray-500 dark:text-gray-400">نسبة التقدم الدراسي</span>
                        <span className="text-[#00B4D8] dark:text-[#D4AF37] font-bold font-mono">
                          {percent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-bold flex justify-between items-center">
                        <span>إكمال {completedCount} من {course.lessonsCount} دروس</span>
                        <span>{percent === 100 ? "مكتملة 🌟" : "قيد الدراسة 📚"}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-[#2D2D3D]">
                    <span className="text-2xl font-black text-[#00B4D8] dark:text-[#D4AF37]">
                      {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                    </span>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {course.lessonsCount} درس
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
