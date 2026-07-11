import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ImageIcon, Search, Filter } from 'lucide-react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Course } from '../types';

interface StudentCoursesProps {
  userData: User;
}

export default function StudentCourses({ userData }: StudentCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
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
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
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
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#1A1A24] rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-[#2D2D3D] group hover:shadow-md transition-all flex flex-col relative"
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
                <div className="text-xs text-[#00B4D8] dark:text-[#D4AF37] font-bold mb-2">{course.teacherName}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">{course.description}</p>
                
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
          ))}
        </div>
      )}
    </div>
  );
}
