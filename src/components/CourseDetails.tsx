import React from "react";
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Lock, ArrowRight, Plus, Trash2, Video, BookOpen, Clock, Edit2, X, Upload, Star, AlertTriangle, FileText, Save, Check, Loader2, History, Award, Calendar, Download } from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, query, where, getDocs, setDoc, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { User, Course, Lesson, Review, LessonNote } from '../types';
import ThemeToggle from './ThemeToggle';
import { uploadChunkedFile } from '../lib/upload';
import { toast, Toaster } from 'react-hot-toast';
import QuizSection from './QuizSection';
import PomodoroTimer from './PomodoroTimer';
import LuxuriousLoader from './LuxuriousLoader';

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [recordedStreams, setRecordedStreams] = useState<any[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, any>>({});
  
  // Local quick notes state
  const [localQuickNotes, setLocalQuickNotes] = useState('');

  useEffect(() => {
    if (id) {
      const savedNotes = localStorage.getItem(`quick_notes_${id}`);
      if (savedNotes) {
        setLocalQuickNotes(savedNotes);
      }
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`quick_notes_${id}`, localQuickNotes);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [localQuickNotes, id]);
  const [initialVideoTime, setInitialVideoTime] = useState<number>(0);
  const lastProgressSaveRef = useRef<number>(0);
  
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
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPrivateReview, setIsPrivateReview] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // Notes state
  const [lessonTab, setLessonTab] = useState<'info' | 'quiz' | 'notes' | 'pomodoro'>('info');
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [allNotes, setAllNotes] = useState<LessonNote[]>([]);
  const [contentTab, setContentTab] = useState<"lessons" | "recordings">("lessons");
  const [notesTab, setNotesTab] = useState<'current' | 'all'>('current');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const initialContentRef = useRef('');

  // Load note for current active lesson
  useEffect(() => {
    const fetchCurrentLessonNote = async () => {
      if (!userData || !activeLesson) return;
      setSaveStatus('idle');
      try {
        const noteDocId = `${userData.id}_${activeLesson.id}`;
        const noteDoc = await getDoc(doc(db, 'notes', noteDocId));
        if (noteDoc.exists()) {
          const content = noteDoc.data().content || '';
          setNoteContent(content);
          initialContentRef.current = content;
        } else {
          setNoteContent('');
          initialContentRef.current = '';
        }
      } catch (error) {
        console.error('Error fetching lesson note:', error);
      }
    };

    fetchCurrentLessonNote();
  }, [activeLesson, userData]);

  const fetchAllCourseNotes = async () => {
    if (!userData || !id) return;
    try {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', userData.id),
        where('courseId', '==', id)
      );
      const querySnapshot = await getDocs(q);
      const fetchedNotes: LessonNote[] = [];
      querySnapshot.forEach((doc) => {
        fetchedNotes.push({ id: doc.id, ...doc.data() } as LessonNote);
      });
      fetchedNotes.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      setAllNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching all course notes:', error);
    }
  };

  useEffect(() => {
    if (lessonTab === 'notes') {
      fetchAllCourseNotes();
    }
  }, [lessonTab, activeLesson, userData]);

  // Auto-save logic
  useEffect(() => {
    if (!userData || !activeLesson || !id) return;
    
    // If content is the same as initially loaded, do not trigger auto-save
    if (noteContent === initialContentRef.current) {
      return;
    }

    setSaveStatus('saving');
    const delayDebounceFn = setTimeout(async () => {
      try {
        const noteDocId = `${userData.id}_${activeLesson.id}`;
        const noteData = {
          userId: userData.id,
          courseId: id,
          lessonId: activeLesson.id,
          lessonTitle: activeLesson.title,
          content: noteContent,
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'notes', noteDocId), noteData, { merge: true });
        initialContentRef.current = noteContent;
        setSaveStatus('saved');
        fetchAllCourseNotes();
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');
      }
    }, 1500); // 1.5 seconds delay

    return () => clearTimeout(delayDebounceFn);
  }, [noteContent, activeLesson, userData, id]);

  const handleSaveNote = async () => {
    if (!userData || !activeLesson || !id) return;
    setIsSavingNote(true);
    setSaveStatus('saving');
    try {
      const noteDocId = `${userData.id}_${activeLesson.id}`;
      const noteData = {
        userId: userData.id,
        courseId: id,
        lessonId: activeLesson.id,
        lessonTitle: activeLesson.title,
        content: noteContent,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'notes', noteDocId), noteData, { merge: true });
      initialContentRef.current = noteContent;
      setSaveStatus('saved');
      toast.success('تم حفظ ملاحظاتك بنجاح! 📝');
      fetchAllCourseNotes();
    } catch (error: any) {
      console.error('Error saving note:', error);
      setSaveStatus('error');
      toast.error('فشل حفظ الملاحظة: ' + (error.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsSavingNote(false);
    }
  };

  const insertText = (textToInsert: string) => {
    setNoteContent(prev => prev + (prev ? '\n' : '') + textToInsert);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        let currentUserId = "";
        let currentUserRole = "";
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const uData = userDoc.data();
            currentUserId = userDoc.id;
            currentUserRole = uData.role || "";
            setUserData({ id: userDoc.id, ...uData } as User);
          }
        } else {
          navigate('/login');
          return;
        }

        if (id) {
          const courseDoc = await getDoc(doc(db, 'courses', id));
          let courseTeacherId = "";
          if (courseDoc.exists()) {
            const cData = courseDoc.data();
            courseTeacherId = cData.teacherId || "";
            setCourse({ id: courseDoc.id, ...cData } as Course);
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

          const streamsQ = query(
            collection(db, 'live_streams'),
            where('courseId', '==', id)
          );
          const streamsSnap = await getDocs(streamsQ);
          const fetchedStreams: any[] = [];
          streamsSnap.forEach((doc) => {
            if (doc.data().status === 'ended') {
              fetchedStreams.push({ id: doc.id, ...doc.data() });
            }
          });
          fetchedStreams.sort((a, b) => (b.endedAt || b.startedAt || '').localeCompare(a.endedAt || a.startedAt || ''));
          setRecordedStreams(fetchedStreams);

          const reviewsQ = query(collection(db, "reviews"), where("courseId", "==", id));
          const reviewsSnap = await getDocs(reviewsQ);
          const fetchedReviews: Review[] = [];
          reviewsSnap.forEach(doc => {
            const data = doc.data() as Review;
            const isOwner = currentUserId && data.userId === currentUserId;
            const isCourseTeacher = courseTeacherId && currentUserId === courseTeacherId;
            const isUserAdmin = currentUserRole === 'admin';
            if (!data.isPrivate || isOwner || isCourseTeacher || isUserAdmin) {
              fetchedReviews.push({ id: doc.id, ...data } as Review);
            }
          });
          fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setReviews(fetchedReviews);
          // Fetch student course progress
          let lastWatchedId = "";
          if (user && id) {
            const progressDoc = await getDoc(doc(db, 'course_progress', `${user.uid}_${id}`));
            if (progressDoc.exists()) {
              const pData = progressDoc.data();
              setCompletedLessons(pData.completedLessons || []);
              setLessonProgressMap(pData.lessonProgress || {});
              lastWatchedId = pData.lastWatchedLessonId || "";
            }
          }

          if (fetchedLessons.length > 0) {
            const stateLessonId = location.state?.autoPlayLessonId;
            const targetLessonId = stateLessonId || lastWatchedId;
            const targetLesson = targetLessonId 
              ? fetchedLessons.find(l => l.id === targetLessonId) 
              : null;
            setActiveLesson(targetLesson || fetchedLessons[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, location]);

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
      toast.error('حدث خطأ أثناء الإضافة: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLessonConfirm = async () => {
    if (!lessonToDelete) return;
    try {
      await deleteDoc(doc(db, 'lessons', lessonToDelete));
      setLessons(lessons.filter(l => l.id !== lessonToDelete));
      if (activeLesson?.id === lessonToDelete) {
        setActiveLesson(null);
      }
      toast.success('تم حذف الدرس بنجاح');
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast.error('حدث خطأ أثناء حذف الدرس: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setLessonToDelete(null);
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonToDelete(lessonId);
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !course) return;
    setIsSubmittingReview(true);
    try {
      const newReview = {
        courseId: course.id,
        userId: userData.id,
        userName: userData.name,
        rating,
        comment,
        isPrivate: isPrivateReview,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "reviews"), newReview);
      setReviews([{ id: docRef.id, ...newReview }, ...reviews]);
      setComment("");
      setRating(5);
      setIsPrivateReview(false);
      toast.success(isPrivateReview ? "تم إرسال تقييمك الخاص للأستاذ بنجاح 🔒" : "تم نشر تقييمك بنجاح! 🌟");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("حدث خطأ أثناء إرسال التقييم");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Set initial video playback position when active lesson changes
  useEffect(() => {
    if (activeLesson && lessonProgressMap[activeLesson.id]) {
      const savedTime = lessonProgressMap[activeLesson.id].currentTime || 0;
      const duration = lessonProgressMap[activeLesson.id].duration || 0;
      // If the video is mostly watched (e.g. within 5 seconds of end) or completed, start from beginning, otherwise resume
      if (savedTime > 0 && duration > 0 && savedTime < (duration - 5)) {
        setInitialVideoTime(savedTime);
      } else {
        setInitialVideoTime(0);
      }
    } else {
      setInitialVideoTime(0);
    }
  }, [activeLesson, lessonProgressMap]);

  if (loading) {
    return <LuxuriousLoader fullScreen size="lg" text="جاري تحميل تفاصيل الكورس..." />;
  }

  if (!course) return null;

  const isTeacher = userData?.id === course.teacherId;
  const isEnrolled = course.enrolledStudentIds?.includes(userData?.id || "");
  const canWatch = isTeacher || isEnrolled || userData?.role === "admin";

  const saveVideoProgressToFirestore = async (lessonId: string, currentTime: number, duration: number) => {
    if (!userData || !course) return;
    try {
      const percent = parseFloat(((currentTime / duration) * 100).toFixed(1));
      const progressRef = doc(db, "course_progress", `${userData.id}_${course.id}`);
      const progressDoc = await getDoc(progressRef);
      if (!progressDoc.exists()) {
        await setDoc(progressRef, {
          userId: userData.id,
          courseId: course.id,
          lastWatchedAt: new Date().toISOString(),
          lastWatchedLessonId: lessonId,
          completedLessons: [],
          progressPercent: 0,
          lessonProgress: {
            [lessonId]: {
              currentTime,
              duration,
              percent,
              lastUpdated: new Date().toISOString()
            }
          }
        });
      } else {
        await updateDoc(progressRef, {
          lastWatchedAt: new Date().toISOString(),
          lastWatchedLessonId: lessonId,
          [`lessonProgress.${lessonId}`]: {
            currentTime,
            duration,
            percent,
            lastUpdated: new Date().toISOString()
          }
        });
      }
      // Update local map as well so active changes are preserved
      setLessonProgressMap(prev => ({
        ...prev,
        [lessonId]: {
          currentTime,
          duration,
          percent,
          lastUpdated: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error("Error saving video progress:", error);
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (userData?.role !== "student" || isTeacher || !activeLesson || !course) return;
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration || activeLesson.durationInSeconds || 0;
    if (!duration) return;

    // Save progress every 10 seconds to avoid overloading Firestore
    const now = Date.now();
    if (now - lastProgressSaveRef.current > 10000) {
      lastProgressSaveRef.current = now;
      saveVideoProgressToFirestore(activeLesson.id, currentTime, duration);
    }
  };

  const handleVideoPause = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (userData?.role !== "student" || isTeacher || !activeLesson || !course) return;
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration || activeLesson.durationInSeconds || 0;
    if (!duration) return;
    saveVideoProgressToFirestore(activeLesson.id, currentTime, duration);
  };

  const handleVideoEnded = async (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (userData?.role !== "student" || isTeacher || !activeLesson || !course) return;
    const video = e.currentTarget;
    const duration = video.duration || activeLesson.durationInSeconds || 0;
    if (!duration) return;
    
    // Auto-complete the lesson when finished watching
    if (!completedLessons.includes(activeLesson.id)) {
      await handleToggleLessonComplete(activeLesson.id);
    }
    saveVideoProgressToFirestore(activeLesson.id, duration, duration);
  };

  const handleViewLesson = async (lesson: Lesson) => {
    if (!canWatch) return;
    setActiveLesson(lesson);
    if (userData?.role === "student" && !isTeacher) {
      try {
        const progressRef = doc(db, "course_progress", `${userData.id}_${course.id}`);
        const progressDoc = await getDoc(progressRef);
        if (!progressDoc.exists()) {
          await setDoc(progressRef, {
            userId: userData.id,
            courseId: course.id,
            lastWatchedAt: new Date().toISOString(),
            lastWatchedLessonId: lesson.id,
            completedLessons: [],
            progressPercent: 0,
            lessonProgress: {}
          });
        } else {
          await updateDoc(progressRef, {
            lastWatchedAt: new Date().toISOString(),
            lastWatchedLessonId: lesson.id
          });
        }

        await updateDoc(doc(db, "lessons", lesson.id), {
          views: increment(1)
        });
      } catch (error) {
        console.error("Error updating views:", error);
      }
    }
  };


  const handleToggleLessonComplete = async (lessonId: string) => {
    if (!userData || !course) return;
    const isCompleted = completedLessons.includes(lessonId);
    let updated: string[];
    if (isCompleted) {
      updated = completedLessons.filter(id => id !== lessonId);
    } else {
      updated = [...completedLessons, lessonId];
    }
    setCompletedLessons(updated);
    
    // Calculate precise percentage
    const lessonsCount = lessons.length || course.lessonsCount || 1;
    const progressPercent = parseFloat(((updated.length / lessonsCount) * 100).toFixed(1));

    try {
      await setDoc(doc(db, "course_progress", `${userData.id}_${course.id}`), {
        userId: userData.id,
        courseId: course.id,
        lastWatchedAt: new Date().toISOString(),
        completedLessons: updated,
        progressPercent: progressPercent
      }, { merge: true });

      if (!isCompleted) {
        toast.success("أحسنت! تم إكمال الدرس بنجاح 🌟");
      } else {
        toast.success("تم إلغاء تحديد إكمال الدرس");
      }
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      toast.error("حدث خطأ أثناء تحديث مستوى التقدم");
    }
  };

  const handleEnroll = async () => {
    if (!userData || !course || enrolling) return;
    setEnrolling(true);
    try {
      await updateDoc(doc(db, "courses", course.id), {
        enrolledStudents: course.enrolledStudents + 1,
        enrolledStudentIds: arrayUnion(userData.id)
      });
      await setDoc(doc(db, "course_progress", `${userData.id}_${course.id}`), {
        userId: userData.id,
        courseId: course.id,
        lastWatchedAt: new Date().toISOString()

      });
      
      await addDoc(collection(db, "notifications"), {
        userId: course.teacherId,
        title: "طالب جديد مسجل",
        message: `سجل الطالب ${userData.name} في كورس ${course.title}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "enrollment"
      });
      
      setCourse({ ...course, enrolledStudents: course.enrolledStudents + 1, enrolledStudentIds: [...(course.enrolledStudentIds || []), userData.id] });
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      setEnrolling(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D12] text-gray-900 dark:text-white font-sans selection:bg-[#00B4D8]/30 dark:selection:bg-[#D4AF37]/30">
      <Toaster position="top-center" reverseOrder={false} />
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
            <div className="hidden md:flex items-center gap-1.5 text-sm font-bold bg-[#F5A623]/10 text-[#F5A623] px-4 py-2 rounded-full">
              <Star className="w-4 h-4 fill-[#F5A623]" />
              {reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "جديد"}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Video Player & Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-lg">
            {!canWatch ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-900 p-8 text-center">
                <Lock className="w-16 h-16 mb-4 opacity-50 text-[#00B4D8] dark:text-[#D4AF37]" />
                <h2 className="text-2xl font-black text-white mb-2">هذا الكورس مغلق</h2>
                <p className="font-medium text-lg mb-6">يجب عليك التسجيل في الكورس لتتمكن من مشاهدة الدروس</p>
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-colors disabled:opacity-50"
                >
                  {enrolling ? 'جاري التسجيل...' : 'اشترك الآن مجاناً'}
                </button>
              </div>
            ) : activeLesson ? (
              activeLesson.videoUrl.includes('youtube.com') || activeLesson.videoUrl.includes('youtu.be') ? (
                <iframe 
                  src={getEmbedUrl(activeLesson.videoUrl)} 
                  title={activeLesson.title}
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeLesson.videoUrl} 
                  key={activeLesson.videoUrl}
                  controls
                  preload="auto"
                  playsInline
                  className="w-full h-full absolute inset-0 bg-black"
                  onLoadedMetadata={(e) => {
                    if (initialVideoTime > 0) {
                      e.currentTarget.currentTime = initialVideoTime;
                    }
                  }}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                >
                   
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-900">
                <Video className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-medium text-lg">اختر درساً للبدء</p>
              </div>
            )}
          </div>

          {activeLesson && (
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#2D2D3D] space-y-6">
              {/* Tabs header inside the card */}
              <div className="flex border-b border-gray-100 dark:border-[#2D2D3D] pb-3 justify-between items-center">
                <div className="flex gap-4">
                  <button
                    onClick={() => setLessonTab('info')}
                    className={`pb-2 px-1 text-sm font-black transition-all relative ${
                      lessonTab === 'info'
                        ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    وصف الدرس
                    {lessonTab === 'info' && (
                      <motion.div layoutId="activeLessonTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                    )}
                  </button>

                  <button
                    onClick={() => setLessonTab('quiz')}
                    className={`pb-2 px-1 text-sm font-black transition-all relative flex items-center gap-1.5 ${
                      lessonTab === 'quiz'
                        ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    الاختبار التفاعلي
                    {lessonTab === 'quiz' && (
                      <motion.div layoutId="activeLessonTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                    )}
                  </button>
                  
                  {userData?.role === 'student' && (
                    <button
                      onClick={() => setLessonTab('notes')}
                      className={`pb-2 px-1 text-sm font-black transition-all relative flex items-center gap-2 ${
                        lessonTab === 'notes'
                          ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      ملاحظاتي الشخصية
                      {lessonTab === 'notes' && (
                        <motion.div layoutId="activeLessonTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                      )}
                    </button>
                  )}
                  
                  {userData?.role === 'student' && (
                    <button
                      onClick={() => setLessonTab('pomodoro')}
                      className={`pb-2 px-1 text-sm font-black transition-all relative flex items-center gap-1.5 ${
                        lessonTab === 'pomodoro'
                          ? 'text-[#00B4D8] dark:text-[#D4AF37]'
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      تنظيم الوقت (بومودورو)
                      {lessonTab === 'pomodoro' && (
                        <motion.div layoutId="activeLessonTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B4D8] dark:bg-[#D4AF37]" />
                      )}
                    </button>
                  )}
                </div>
                
                {lessonTab === 'notes' && (
                  <div className="flex items-center gap-2 font-sans">
                    {saveStatus === 'saving' && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00B4D8] dark:text-[#D4AF37]" />
                        جاري الحفظ تلقائياً...
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1.5 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        تم حفظ التغييرات
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        خطأ في حفظ التغييرات
                      </span>
                    )}
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {lessonTab === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{activeLesson.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">{activeLesson.description || 'لا يوجد وصف لهذا الدرس.'}</p>
                    
                    {userData?.role === 'student' && (
                      <div className="pt-5 border-t border-gray-100 dark:border-[#2D2D3D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-black text-gray-900 dark:text-white">إكمال الدرس الحالي</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">حدد هذا الدرس كمكتمل لتحديث نسبة تقدمك العامة في هذا الكورس</span>
                        </div>
                        <button
                          onClick={() => handleToggleLessonComplete(activeLesson.id)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                            completedLessons.includes(activeLesson.id)
                              ? 'bg-green-500 text-white shadow-md shadow-green-500/20 hover:bg-green-600'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#222230] dark:hover:bg-[#2D2D3D] text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${completedLessons.includes(activeLesson.id) ? 'stroke-[3px]' : ''}`} />
                          {completedLessons.includes(activeLesson.id) ? 'تم إكمال الدرس ✓' : 'تحديد كمكتمل'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {lessonTab === 'quiz' && userData && (
                  <motion.div
                    key="quiz"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <QuizSection
                      courseId={id || ''}
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title}
                      userData={userData}
                      isTeacher={userData.role === 'teacher'}
                    />
                  </motion.div>
                )}

                {lessonTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {/* Notes Tabs */}
                    <div className="flex gap-2 bg-gray-50 dark:bg-[#0D0D12] p-1 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setNotesTab('current')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          notesTab === 'current'
                            ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                      >
                        ملاحظات هذا الدرس
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotesTab('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          notesTab === 'all'
                            ? 'bg-white dark:bg-[#1A1A24] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        مراجعة كل الملاحظات ({allNotes.length})
                      </button>
                    </div>

                    {notesTab === 'current' ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">
                            اكتب ملاحظاتك المهمة هنا لمراجعتها وتسهيل المذاكرة لاحقاً:
                          </span>
                          
                          {/* Formatting Helpers */}
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => insertText('💡 فكرة مهمة: ')}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs rounded-xl font-bold transition-colors"
                              title="إضافة فكرة مهمة"
                            >
                              💡 فكرة
                            </button>
                            <button
                              type="button"
                              onClick={() => insertText('❓ سؤال للمراجعة: ')}
                              className="px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:hover:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 text-xs rounded-xl font-bold transition-colors"
                              title="إضافة سؤال مراجعة"
                            >
                              ❓ سؤال
                            </button>
                            <button
                              type="button"
                              onClick={() => insertText('📝 ملخص: ')}
                              className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-xs rounded-xl font-bold transition-colors"
                              title="إضافة ملخص"
                            >
                              📝 ملخص
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const video = document.querySelector('video');
                                if (video) {
                                  const mins = Math.floor(video.currentTime / 60).toString().padStart(2, '0');
                                  const secs = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
                                  insertText(`🕒 عند الدقيقة [${mins}:${secs}]: `);
                                } else {
                                  insertText('🕒 نقطة زمنية: ');
                                }
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-bold transition-colors"
                              title="إضافة نقطة زمنية للفيديو"
                            >
                              🕒 ختم زمني
                            </button>
                          </div>
                        </div>

                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="مثال: القوانين الذهبية للباب الأول وكيفية حل المسائل المعقدة..."
                          className="w-full min-h-[180px] bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] transition-colors resize-y leading-relaxed font-medium text-right"
                          dir="rtl"
                        />

                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(noteContent);
                                toast.success('تم نسخ الملاحظات إلى الحافظة! 📋');
                              }}
                              disabled={!noteContent}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3d3d52] disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              نسخ الملاحظة
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من رغبتك في مسح ملاحظات هذا الدرس؟')) {
                                  setNoteContent('');
                                }
                              }}
                              disabled={!noteContent}
                              className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-colors"
                            >
                              مسح النص
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleSaveNote}
                            disabled={isSavingNote}
                            className="bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 flex items-center gap-1.5 transition-all"
                          >
                            {isSavingNote ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            حفظ الآن
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {allNotes.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-sm">لم تقم بكتابة أي ملاحظات في هذا الكورس بعد.</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ابدأ بمشاهدة الدروس وتدوين أفكارك!</p>
                          </div>
                        ) : (
                          allNotes.map((note) => (
                            <div key={note.id} className="p-4 rounded-xl bg-gray-50 dark:bg-[#222230] border border-gray-100 dark:border-[#2D2D3D] space-y-2 text-right relative group">
                              <div className="flex justify-between items-center border-b border-gray-200/50 dark:border-gray-800 pb-2">
                                <span className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-full"></span>
                                  {note.lessonTitle}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                                  تحديث: {new Date(note.updatedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                                {note.content}
                              </p>
                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetLesson = lessons.find(l => l.id === note.lessonId);
                                    if (targetLesson) {
                                      setActiveLesson(targetLesson);
                                      setNotesTab('current');
                                      toast.success(`تم الانتقال لدرس: ${targetLesson.title}`);
                                    } else {
                                      toast.error('لم نتمكن من العثور على هذا الدرس');
                                    }
                                  }}
                                  className="text-[10px] text-[#00B4D8] dark:text-[#D4AF37] hover:underline font-black"
                                >
                                  الانتقال للدرس وتعديل الملاحظة ←
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {lessonTab === 'pomodoro' && userData && (
                  <motion.div
                    key="pomodoro"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <PomodoroTimer
                      courseId={id || ''}
                      courseTitle={course?.title || ''}
                      lessonId={activeLesson?.id}
                      lessonTitle={activeLesson?.title}
                      userData={userData}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {!activeLesson && (
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#2D2D3D]">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">عن الكورس</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{course.description}</p>
            </div>
          )}

          {/* Reviews Section */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#2D2D3D] mt-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">التقييمات والآراء</h2>
            {userData?.role === "student" && canWatch && (
              <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 dark:bg-[#222230] p-4 rounded-xl border border-gray-100 dark:border-[#2D2D3D] space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">أضف تقييمك لجودة المحتوى التعليمي</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                      <Star className={`w-6 h-6 ${star <= rating ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-300 dark:text-gray-600"}`} />
                    </button>
                  ))}
                </div>
                <textarea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="شاركنا رأيك ومقترحاتك للأستاذ لتطوير المحتوى التعليمي..." className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] resize-none" rows={3}></textarea>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isPrivateReview} 
                      onChange={(e) => setIsPrivateReview(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00B4D8] dark:text-[#D4AF37] focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] border-gray-300 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24]"
                    />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      🔒 إرسال كتقييم خاص للمعلم فقط (لن يظهر للعامة)
                    </span>
                  </label>
                  <button type="submit" disabled={isSubmittingReview} className="bg-[#00B4D8] dark:bg-[#D4AF37] text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 hover:bg-[#0077B6] dark:hover:bg-[#B8860B] transition-colors disabled:opacity-50">
                    {isSubmittingReview ? "جاري الإرسال..." : "نشر التقييم"}
                  </button>
                </div>
              </form>
            )}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 dark:border-[#2D2D3D] pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-[#2D2D3D] rounded-full flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                          {review.userName.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{review.userName}</span>
                        {review.isPrivate && (
                          <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            🔒 تقييم خاص بالمعلم
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-300 dark:text-gray-600"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mr-10 leading-relaxed">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm font-medium">
                  لا توجد تقييمات بعد. كن أول من يقيّم هذا الكورس!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Lessons List */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2D2D3D] flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50/50 dark:bg-[#222230]/50 rounded-t-2xl">
              <div className="flex bg-gray-200/50 dark:bg-[#1A1A24] p-1 rounded-xl">
                <button
                  onClick={() => setContentTab('lessons')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${contentTab === 'lessons' ? 'bg-white dark:bg-[#2D2D3D] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  الدروس المسجلة ({lessons.length})
                </button>
                <button
                  onClick={() => setContentTab('recordings')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${contentTab === 'recordings' ? 'bg-white dark:bg-[#2D2D3D] text-[#00B4D8] dark:text-[#D4AF37] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  البثوث المتسجلة ({recordedStreams.length})
                </button>
              </div>
            </div>

            {userData?.role === 'student' && lessons.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#15151F] border-b border-gray-100 dark:border-[#2D2D3D] font-sans">
                <div className="flex items-center justify-between mb-2 text-xs font-black">
                  <span className="text-gray-500 dark:text-gray-400">تقدمك في الكورس</span>
                  <span className="text-[#00B4D8] dark:text-[#D4AF37] font-bold font-mono">
                    {((completedLessons.length / lessons.length) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#2D2D3D] rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-full"
                  />
                </div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 font-bold">
                  تم إنجاز {completedLessons.length} من أصل {lessons.length} درس بنجاح
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {contentTab === 'lessons' ? (
                lessons.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">لم يتم إضافة دروس بعد</p>
                  </div>
                ) : (
                  lessons.map((lesson, idx) => (
                    <div 
                      key={lesson.id}
                      onClick={() => canWatch && setActiveLesson(lesson)}
                      className={`p-4 rounded-xl cursor-pointer transition-all flex items-start gap-4 group ${
                        activeLesson?.id === lesson.id 
                        ? 'bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 border border-[#00B4D8]/30 dark:border-[#D4AF37]/30' 
                        : 'hover:bg-gray-50 dark:hover:bg-[#222230] border border-transparent'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        activeLesson?.id === lesson.id
                        ? 'bg-[#00B4D8] dark:bg-[#D4AF37] text-white'
                        : completedLessons.includes(lesson.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 group-hover:bg-[#00B4D8]/20 dark:group-hover:bg-[#D4AF37]/20 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]'
                      }`}>
                        {completedLessons.includes(lesson.id) && activeLesson?.id !== lesson.id ? (
                          <Check className="w-4 h-4 stroke-[3px]" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate text-sm mb-1 ${
                          activeLesson?.id === lesson.id ? 'text-[#0077B6] dark:text-[#B8860B]' : 'text-gray-900 dark:text-white'
                        }`}>
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lesson.description || 'فيديو تعليمي'}</p>
                      </div>
                      {userData?.role === 'student' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLessonComplete(lesson.id);
                          }}
                          className={`p-2 rounded-xl transition-all self-center shrink-0 ${
                            completedLessons.includes(lesson.id)
                              ? 'text-green-500 hover:text-green-600 bg-green-50 dark:bg-green-950/20'
                              : 'text-gray-300 dark:text-gray-600 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] hover:bg-gray-100 dark:hover:bg-[#2D2D3D]'
                          }`}
                          title={completedLessons.includes(lesson.id) ? "إلغاء تحديد كمكتمل" : "تحديد كمكتمل"}
                        >
                          <Check className={`w-4 h-4 ${completedLessons.includes(lesson.id) ? 'stroke-[3px]' : 'stroke-[1.5px]'}`} />
                        </button>
                      )}
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
                )
              ) : (
                recordedStreams.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">لا توجد بثوث متسجلة</p>
                  </div>
                ) : (
                  recordedStreams.map((stream, idx) => (
                    <div 
                      key={stream.id}
                      className="p-4 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm mb-3 space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-900 dark:text-white truncate">{stream.title}</h4>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1 font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(stream.endedAt || stream.startedAt || Date.now()).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                        {stream.recordedUrl && (
                          <a 
                            href={stream.recordedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-100 dark:border-indigo-500/20"
                          >
                            <Play className="w-3 h-3" />
                            مشاهدة التسجيل
                          </a>
                        )}
                      </div>
                      
                      {stream.recordingSummary && (
                        <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#222230] p-3 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                          <span className="font-bold text-gray-900 dark:text-white block mb-1">ملخص الحصة:</span>
                          {stream.recordingSummary}
                        </div>
                      )}
                      
                      {stream.materials && stream.materials.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-[#2D2D3D]">
                          <span className="text-[10px] font-black text-gray-400 mb-2 block">المرفقات ({stream.materials.length}):</span>
                          <div className="flex flex-wrap gap-2">
                            {stream.materials.map((mat: any, mIdx: number) => (
                              <a
                                key={mIdx}
                                href={mat.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#2D2D3D] border border-gray-200 dark:border-[#3D3D4D] rounded-lg hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all group"
                              >
                                <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#00B4D8] dark:group-hover:text-[#D4AF37]" />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{mat.name}</span>
                                <Download className="w-3 h-3 text-gray-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )
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
          
          {/* Quick Notes Widget (Local Storage) */}
          <div className="bg-white dark:bg-[#1A1A24] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2D2D3D] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
                ملاحظات سريعة محليّة
              </h3>
              <span className="text-[10px] text-gray-500 font-bold bg-white dark:bg-[#13131C] px-2 py-1 rounded-md border border-gray-100 dark:border-[#2D2D3D]">
                تُحفظ تلقائياً 💾
              </span>
            </div>
            <div className="p-4">
              <textarea
                value={localQuickNotes}
                onChange={(e) => setLocalQuickNotes(e.target.value)}
                placeholder="اكتب ملاحظاتك السريعة هنا أثناء مشاهدة الدرس... (يتم حفظها في متصفحك محلياً لتعود إليها لاحقاً)"
                className="w-full min-h-[150px] bg-gray-50 dark:bg-[#0D0D12] border border-gray-200 dark:border-[#2D2D3D] rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00B4D8] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1A1A24] transition-colors resize-y leading-relaxed font-medium"
                dir="rtl"
              />
            </div>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {lessonToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setLessonToDelete(null)}
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
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف النهائي</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الدرس نهائياً؟ ستتم إزالة الفيديو والمعلومات المرتبطة به ولا يمكن استعادتها مرة أخرى.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setLessonToDelete(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#2D2D3D] hover:bg-gray-200 dark:hover:bg-[#3d3d52] transition-colors flex-1"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLessonConfirm}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex-1 shadow-lg shadow-red-500/10"
                >
                  نعم، احذف نهائياً
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
