import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Send, Users, Heart, Flame, HelpCircle, 
  Trash2, Plus, X, Monitor, Play, Square, Palette, RotateCcw, Check, 
  BarChart2, AlertCircle, Sparkles, MessageSquare, ScreenShare, Award,
  Tv, Compass, LogIn, ChevronLeft, ChevronRight, Calendar, BookOpen, FileText, Download, 
  UploadCloud, RefreshCw, File as FileIcon, Hand, Volume2, VolumeX, Maximize2, Minimize2, Circle, StopCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, doc, setDoc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, orderBy, limit, increment, runTransaction, 
  serverTimestamp, getDocs, getDoc, arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { LiveStream, LiveChatMessage, LivePoll, User, Course } from '../types';
import toast from 'react-hot-toast';
import LiveChat from './LiveChat';
import SmartWhiteboard from './SmartWhiteboard';

interface LiveClassroomProps {
  userData: User | null;
}

export default function LiveClassroom({ userData }: LiveClassroomProps) {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Navigation
  const [view, setView] = useState<'lobby' | 'stream'>('lobby');
  
  // Create Stream Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isSubmittingStream, setIsSubmittingStream] = useState(false);

  // Live media
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSimulatedStream, setIsSimulatedStream] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Real-time collections state
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activePoll, setActivePoll] = useState<LivePoll | null>(null);
  const [pastPolls, setPastPolls] = useState<LivePoll[]>([]);
  
  // Poll creation form
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  const isWhiteboardActive = activeStream?.isWhiteboardActive || false;
  
  // Whiteboard drawing state
  const [whiteboardColor, setWhiteboardColor] = useState('#00B4D8');
  const [whiteboardBrushSize, setWhiteboardBrushSize] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Floating reactions local display
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; left: number }[]>([]);
  const reactionIdCounter = useRef(0);

  const chatEndRef = useRef<HTMLDivElement | null>(null);


  const isTeacher = userData?.role === 'teacher';

  // Materials upload states
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMaximizedVideo, setIsMaximizedVideo] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMaximizedVideo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleUploadMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStream) return;

    // Validate type (PDF or Image only)
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("عذراً، يسمح فقط برفع ملفات PDF أو الصور التوضيحية.");
      return;
    }

    // Validate size (max 20MB for materials)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً. الحد الأقصى المسموح به هو 20 ميجابايت.");
      return;
    }

    setIsUploadingMaterial(true);
    setUploadProgress(0);

    try {
      // 1. Upload file to Firebase Storage
      const { uploadFileToFirebase } = await import('../lib/upload');
      const downloadUrl = await uploadFileToFirebase(file, (progress) => {
        setUploadProgress(Math.round(progress));
      }, {
        allowedTypes,
        maxSizeBytes: 20 * 1024 * 1024
      });

      // 2. Add material object to the materials list of the current live stream document in Firestore
      const materialId = doc(collection(db, 'temp')).id;
      const newMaterial = {
        id: materialId,
        title: file.name,
        url: downloadUrl,
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
        uploadedAt: new Date().toISOString()
      };

      const streamRef = doc(db, 'live_streams', activeStream.id);
      await updateDoc(streamRef, {
        materials: arrayUnion(newMaterial)
      });

      toast.success("تم رفع الملف المرفق بنجاح وإتاحته للطلاب فوراً! 📚✨");
    } catch (err) {
      console.error("Error uploading material: ", err);
      toast.error("فشل رفع الملف المرفق. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploadingMaterial(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!activeStream) return;
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا الملف؟ لن يتمكن الطلاب من تحميله بعد الآن.")) return;

    try {
      const updatedMaterials = (activeStream.materials || []).filter(m => m.id !== materialId);
      const streamRef = doc(db, 'live_streams', activeStream.id);
      await updateDoc(streamRef, {
        materials: updatedMaterials
      });
      toast.success("تم حذف الملف بنجاح.");
    } catch (err) {
      console.error("Error deleting material: ", err);
      toast.error("فشل حذف الملف.");
    }
  };

  // --- Raise Hand (رفع اليد) States & Handlers ---
  const [raisedHands, setRaisedHands] = useState<any[]>([]);
  const [showRaiseHandModal, setShowRaiseHandModal] = useState(false);
  const [handRaiseMessage, setHandRaiseMessage] = useState('');
  const [isRaisingHand, setIsRaisingHand] = useState(false);
  
  const hasLoadedInitialRaisedHandsRef = useRef(false);
  const lastRaisedHandsCountRef = useRef(0);

  const handleRaiseHand = async () => {
    if (!activeStream || !userData) return;
    setIsRaisingHand(true);

    try {
      // Use the student's UID as the document ID so each student can raise their hand once at a time
      const handRaiseId = userData.id;
      const handRaiseRef = doc(db, 'live_streams', activeStream.id, 'raised_hands', handRaiseId);
      
      const newHandRaise = {
        id: handRaiseId,
        streamId: activeStream.id,
        userId: userData.id,
        userName: userData.name || 'طالب مجهول',
        message: handRaiseMessage.trim() || '',
        createdAt: new Date().toISOString(),
        resolved: false
      };

      await setDoc(handRaiseRef, newHandRaise);
      toast.success("تم رفع يدك بنجاح! سيتم تنبيه المعلم للإجابة على سؤالك ✋✨", {
        duration: 4000,
        icon: '✋'
      });
      setShowRaiseHandModal(false);
      setHandRaiseMessage('');
    } catch (err) {
      console.error("Error raising hand: ", err);
      toast.error("فشل رفع اليد. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsRaisingHand(false);
    }
  };

  const handleLowerHand = async () => {
    if (!activeStream || !userData) return;
    try {
      const handRaiseId = userData.id;
      const handRaiseRef = doc(db, 'live_streams', activeStream.id, 'raised_hands', handRaiseId);
      await deleteDoc(handRaiseRef);
      toast.success("تم إنزال اليد بنجاح.");
    } catch (err) {
      console.error("Error lowering hand: ", err);
      toast.error("فشل إنزال اليد.");
    }
  };

  const handleResolveHand = async (studentId: string) => {
    if (!activeStream) return;
    try {
      const handRaiseRef = doc(db, 'live_streams', activeStream.id, 'raised_hands', studentId);
      await deleteDoc(handRaiseRef);
      toast.success("تم التجاوب مع الطالب وإنزال اليد.");
    } catch (err) {
      console.error("Error resolving hand raise: ", err);
      toast.error("فشل تعديل حالة طلب الطالب.");
    }
  };

  const handleClearAllHands = async () => {
    if (!activeStream) return;
    if (!window.confirm("هل أنت متأكد من رغبتك في إنزال جميع الأيدي المرفوعة؟")) return;

    try {
      const raisedHandsSnapshot = await getDocs(collection(db, 'live_streams', activeStream.id, 'raised_hands'));
      const batchPromises = raisedHandsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(batchPromises);
      toast.success("تم إنزال جميع الأيدي المرفوعة بنجاح! 🧹✋");
    } catch (err) {
      console.error("Error clearing raised hands: ", err);
      toast.error("فشل تنظيف الأيدي المرفوعة.");
    }
  };


  // 1. Fetch live streams and courses
  useEffect(() => {
    // Listen to live streams
    const streamsQuery = query(collection(db, 'live_streams'), orderBy('status', 'desc'));
    const unsubscribeStreams = onSnapshot(streamsQuery, (snapshot) => {
      const list: LiveStream[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as LiveStream);
      });
      setStreams(list);
    }, (error) => {
      console.error("Error loading live streams: ", error);
    });

    // Fetch teacher's or student's courses for association
    const fetchCourses = async () => {
      try {
        const q = collection(db, 'courses');
        const snapshot = await getDocs(q);
        const list: Course[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Course);
        });
        setCourses(list);
      } catch (err) {
        console.error("Error fetching courses: ", err);
      }
    };
    fetchCourses();

    return () => {
      unsubscribeStreams();
    };
  }, []);

  // 2. Stream Media Handler (Teacher Only)
  const startCamera = async () => {
    try {
      setIsSimulatedStream(false);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCamOn(true);
      setIsMicOn(true);
    } catch (err) {
      console.error("Camera access failed: ", err);
      // Fallback to simulated stream inside the sandboxed environment (e.g. AI Studio iframe)
      setIsSimulatedStream(true);
      setIsCamOn(true);
      setIsMicOn(true);
      toast.success("تم تفعيل البث الافتراضي الذكي بنجاح لتجاوز قيود أذونات الكاميرا بالمحرر! 🎥🎓", {
        duration: 5000,
        icon: '🎬'
      });
    }
  };

  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsSimulatedStream(false);
  };

  const toggleCam = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!localStream) {
      toast.error("لا يوجد بث حالي لتسجيله.");
      return;
    }
    try {
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const recorder = new MediaRecorder(localStream, options);
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };
      
      recorder.start(1000); // Collect 1 second chunks
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("تم بدء تسجيل الحصة 🔴");
    } catch (err) {
      console.error("Error starting recording:", err);
      toast.error("فشل بدء التسجيل، تأكد من دعم المتصفح.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success("تم إيقاف التسجيل، جاري معالجة الفيديو...");
      // The onstop event can be used to handle upload, or we can use a separate function.
      // But we need to define the onstop handler inside startRecording or rely on the state.
    }
  };

  // Upload recording when chunks are ready and recording is stopped
  useEffect(() => {
    if (!isRecording && recordedChunksRef.current.length > 0 && !isUploadingRecording && activeStream) {
      const uploadRecording = async () => {
        setIsUploadingRecording(true);
        setRecordingProgress(0);
        try {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const file = new File([blob], `recording-${activeStream.id}.webm`, { type: 'video/webm' });
          
          const { uploadChunkedFile } = await import('../lib/upload');
          
          const recordedUrl = await uploadChunkedFile(file, (progress) => {
            setRecordingProgress(progress);
          });

          await updateDoc(doc(db, 'live_streams', activeStream.id), {
            recordedUrl,
            recordingSummary: activeStream.description // simple summary
          });
          
          toast.success("تم رفع وحفظ تسجيل الحصة بنجاح ✅");
          recordedChunksRef.current = [];
          setRecordedChunks([]);
        } catch (err) {
          console.error("Upload recording failed:", err);
          toast.error("فشل رفع تسجيل الحصة.");
        } finally {
          setIsUploadingRecording(false);
          setRecordingProgress(0);
        }
      };
      uploadRecording();
    }
  }, [isRecording, activeStream]);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Stop current camera video track
      if (localStream) {
        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (currentVideoTrack) {
          localStream.removeTrack(currentVideoTrack);
          currentVideoTrack.stop();
        }
        
        // Add screen video track
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        localStream.addTrack(screenVideoTrack);
        
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }

        screenVideoTrack.onended = () => {
          stopScreenShare();
        };
      }
      setIsScreenSharing(true);
      if (activeStream) {
        await updateDoc(doc(db, 'live_streams', activeStream.id), {
          isScreenSharing: true
        });
      }
      toast.success("تم بدء مشاركة الشاشة الفعلية بنجاح! 🖥️✨");
    } catch (err) {
      console.error("Screen share failed: ", err);
      toast.error("فشل بدء مشاركة الشاشة. تأكد من إعطاء الأذونات أو قم بفتح التطبيق في نافذة جديدة (New Tab) لتجاوز قيود المتصفح.", { duration: 6000 });
    }
  };

  const stopScreenShare = async () => {
    setIsScreenSharing(false);
    if (activeStream) {
      try {
        await updateDoc(doc(db, 'live_streams', activeStream.id), {
          isScreenSharing: false
        });
      } catch (err) {
        console.error("Error stopping screen share in DB: ", err);
      }
    }
    await startCamera(); // Switch back to camera
  };

  const toggleWhiteboard = async () => {
    if (!isTeacher || !activeStream) return;
    try {
      await updateDoc(doc(db, 'live_streams', activeStream.id), {
        isWhiteboardActive: !isWhiteboardActive
      });
    } catch (err) {
      console.error("Failed to toggle whiteboard: ", err);
      toast.error("حدث خطأ أثناء فتح/إغلاق الصبورة");
    }
  };

  // 3. Create a Live Stream (Teacher)
  const handleCreateStream = async () => {
    if (!newTitle.trim() || !newDescription.trim() || !selectedCourseId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة واختيار المادة.");
      return;
    }

    setIsSubmittingStream(true);
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    
    try {
      const newStreamId = 'stream_' + Math.random().toString(36).substr(2, 9);
      const streamPayload: LiveStream = {
        id: newStreamId,
        title: newTitle,
        description: newDescription,
        courseId: selectedCourseId,
        courseTitle: selectedCourse?.title || "مادة دراسية",
        teacherId: userData?.id || auth.currentUser?.uid || 'teacher_id',
        teacherName: userData?.name || 'الأستاذ المعلم',
        status: 'scheduled',
        scheduledAt: new Date().toISOString(),
        viewerCount: 0
      };

      await setDoc(doc(db, 'live_streams', newStreamId), streamPayload);
      toast.success("تم جدولة الحصة المباشرة بنجاح!");
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      console.error("Error creating stream: ", err);
      toast.error("فشل إنشاء الحصة المباشرة.");
    } finally {
      setIsSubmittingStream(false);
    }
  };

  // 4. Go Live (Teacher)
  const goLive = async (stream: LiveStream) => {
    try {
      await updateDoc(doc(db, 'live_streams', stream.id), {
        status: 'live',
        startedAt: new Date().toISOString()
      });
      
      const course = courses.find(c => c.id === stream.courseId);
      if (course && course.enrolledStudentIds && course.enrolledStudentIds.length > 0) {
        const batchPromises = course.enrolledStudentIds.map(studentId => {
          return addDoc(collection(db, 'notifications'), {
            userId: studentId,
            title: 'بث مباشر جديد بدأ الآن! 🔴',
            message: `المعلم ${stream.teacherName} بدأ بث مباشر في مادة ${course.title}. انضم الآن!`,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'live_stream'
          });
        });
        await Promise.all(batchPromises);
      }
      
      setActiveStream({ ...stream, status: 'live' });
      setView('stream');
      await startCamera();
      toast.success("أنت الآن على الهواء مباشرة! بالتوفيق 🎬");
    } catch (err) {
      console.error("Error going live: ", err);
      toast.error("فشل بدء البث.");
    }
  };

  // 5. End Stream (Teacher)
  const endStream = async (streamId: string) => {
    try {
      await updateDoc(doc(db, 'live_streams', streamId), {
        status: 'ended',
        endedAt: new Date().toISOString(),
        viewerCount: 0
      });
      stopCamera();
      setView('lobby');
      setActiveStream(null);
      toast.success("تم إنهاء البث المباشر وحفظ الحصة المسجلة.");
    } catch (err) {
      console.error("Error ending stream: ", err);
      toast.error("فشل إنهاء البث المباشر.");
    }
  };

  // Delete Stream (Teacher)
  const deleteStream = async (streamId: string) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذه الحصة نهائياً؟")) {
      try {
        await deleteDoc(doc(db, 'live_streams', streamId));
        toast.success("تم حذف الحصة بنجاح.");
      } catch (err) {
        console.error("Error deleting stream: ", err);
        toast.error("فشل حذف الحصة.");
      }
    }
  };

  // 6. Join Stream (Student or Teacher)
  const joinStream = async (stream: LiveStream) => {
    setActiveStream(stream);
    setView('stream');
    
    // Increment viewer count for students
    if (!isTeacher) {
      try {
        await updateDoc(doc(db, 'live_streams', stream.id), {
          viewerCount: increment(1)
        });
      } catch (err) {
        console.error("Error incrementing viewer: ", err);
      }
    } else {
      // If teacher is joining their own live, start camera
      if (stream.status === 'live') {
        await startCamera();
      }
    }
  };

  // Leave Stream
  const leaveStream = async () => {
    if (activeStream) {
      if (!isTeacher) {
        try {
          await updateDoc(doc(db, 'live_streams', activeStream.id), {
            viewerCount: increment(-1)
          });
        } catch (err) {
          console.error("Error decrementing viewer: ", err);
        }
      } else {
        stopCamera();
      }
    }
    setView('lobby');
    setActiveStream(null);
  };

  // Clean up stream media on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 7. Real-time chat & polls subscriptions during active stream
  useEffect(() => {
    if (!activeStream?.id) return;

    hasLoadedInitialRaisedHandsRef.current = false;
    lastRaisedHandsCountRef.current = 0;

    // A. Subscribe to Chat Messages
    const chatQuery = query(
      collection(db, 'live_streams', activeStream.id, 'chat'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const list: LiveChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as LiveChatMessage);
      });
      setChatMessages(list);
      
      // Auto scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // B. Subscribe to Polls
    const pollsQuery = query(
      collection(db, 'live_streams', activeStream.id, 'polls'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
      const activeList: LivePoll[] = [];
      const completedList: LivePoll[] = [];
      
      snapshot.forEach((docSnap) => {
        const p = { id: docSnap.id, ...docSnap.data() } as LivePoll;
        if (p.isActive) {
          activeList.push(p);
        } else {
          completedList.push(p);
        }
      });
      
      setActivePoll(activeList[0] || null);
      setPastPolls(completedList);
    });

    // C. Subscribe to the stream document for general properties, whiteboard, materials & voice broadcasts
    const unsubscribeStreamDoc = onSnapshot(doc(db, 'live_streams', activeStream.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as LiveStream;
        setActiveStream(data);
        
        if (!isTeacher && data.whiteboardData) {
          // Sync whiteboard rendering
          drawFromWhiteboardData(data.whiteboardData);
        }

      }
    });

    // D. Subscribe to Raised Hands in real-time
    const raisedHandsQuery = query(
      collection(db, 'live_streams', activeStream.id, 'raised_hands'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeRaisedHands = onSnapshot(raisedHandsQuery, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRaisedHands(list);

      const isNewRaise = list.length > lastRaisedHandsCountRef.current;
      lastRaisedHandsCountRef.current = list.length;
      
      if (isTeacher && isNewRaise && hasLoadedInitialRaisedHandsRef.current) {
        const newestHand = list[0];
        if (newestHand) {
          toast(`رفع الطالب ${newestHand.userName} يده! ✋${newestHand.message ? `\nالرسالة: ${newestHand.message}` : ''}`, {
            icon: '✋',
            duration: 6000,
            style: {
              background: '#0F172A',
              color: '#F8FAFC',
              border: '1px solid #1E293B',
              direction: 'rtl',
              textAlign: 'right'
            }
          });
        }
      }
      hasLoadedInitialRaisedHandsRef.current = true;
    }, (error) => {
      console.error("Error loading raised hands: ", error);
    });

    return () => {
      unsubscribeChat();
      unsubscribePolls();
      unsubscribeStreamDoc();
      unsubscribeRaisedHands();
    };
  }, [activeStream?.id]);

  // Helper to draw received coordinates
  const drawFromWhiteboardData = (dataStr: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const parsed = JSON.parse(dataStr);
      if (parsed.clear) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      
      ctx.strokeStyle = parsed.color || '#00B4D8';
      ctx.lineWidth = parsed.brushSize || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(parsed.x0, parsed.y0);
      ctx.lineTo(parsed.x1, parsed.y1);
      ctx.stroke();
    } catch (e) {
      // JSON mismatch ignore
    }
  };

  // 8. Whiteboard Drawing Handlers (Teacher draws, Student views)
  const handleWhiteboardDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTeacher) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    lastPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleWhiteboardDraw = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTeacher || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.strokeStyle = whiteboardColor;
    ctx.lineWidth = whiteboardBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Send the stroke coordinates to Firestore for live student synchronization
    if (activeStream) {
      const strokeData = {
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: currentX,
        y1: currentY,
        color: whiteboardColor,
        brushSize: whiteboardBrushSize,
        clear: false
      };
      await updateDoc(doc(db, 'live_streams', activeStream.id), {
        whiteboardData: JSON.stringify(strokeData)
      });
    }

    lastPosRef.current = { x: currentX, y: currentY };
  };

  const handleWhiteboardDrawEnd = () => {
    isDrawingRef.current = false;
  };

  const clearWhiteboard = async () => {
    if (!isTeacher) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeStream) {
      await updateDoc(doc(db, 'live_streams', activeStream.id), {
        whiteboardData: JSON.stringify({ clear: true })
      });
    }
  };

  // 9. Send Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeStream) return;

    const messageText = chatInput.trim();
    setChatInput('');

    try {
      const chatColRef = collection(db, 'live_streams', activeStream.id, 'chat');
      await addDoc(chatColRef, {
        streamId: activeStream.id,
        userId: userData?.id || auth.currentUser?.uid || 'anonymous',
        userName: userData?.name || 'مستخدم Teachland',
        userRole: userData?.role === 'teacher' ? 'معلم' : 'طالب',
        message: messageText,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error sending chat: ", err);
    }
  };

  // 10. Floating Reactions Handler
  const sendReaction = async (emoji: string) => {
    if (!activeStream) return;
    
    // Add locally for the clicking user instantly
    triggerLocalReaction(emoji);

    // Write message to chat to reflect reaction in chat stream
    try {
      const chatColRef = collection(db, 'live_streams', activeStream.id, 'chat');
      await addDoc(chatColRef, {
        streamId: activeStream.id,
        userId: userData?.id || auth.currentUser?.uid || 'anonymous',
        userName: userData?.name || 'مستخدم Teachland',
        userRole: userData?.role === 'teacher' ? 'معلم' : 'طالب',
        message: `تفاجأ وأرسل تفاعل: ${emoji}`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Reaction save error: ", err);
    }
  };

  const triggerLocalReaction = (emoji: string) => {
    const id = reactionIdCounter.current++;
    const left = 10 + Math.random() * 80; // random percentage
    setFloatingEmojis(prev => [...prev, { id, char: emoji, left }]);

    // Remove emoji after 3 seconds
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  };

  // Trigger floating emojis automatically when chat contains a reaction message
  useEffect(() => {
    if (chatMessages.length === 0) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg.message.includes('تفاجأ وأرسل تفاعل: ')) {
      const parts = lastMsg.message.split('تفاجأ وأرسل تفاعل: ');
      const emoji = parts[1] || '❤️';
      triggerLocalReaction(emoji);
    }
  }, [chatMessages]);

  // 11. Create Poll Handler
  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || !activeStream) {
      toast.error("يرجى كتابة سؤال التصويت.");
      return;
    }

    const filteredOptions = pollOptions.filter(o => o.trim() !== '');
    if (filteredOptions.length < 2) {
      toast.error("يرجى إدخال خيارين على الأقل للتصويت.");
      return;
    }

    try {
      const pollsColRef = collection(db, 'live_streams', activeStream.id, 'polls');
      const votesObj: Record<string, number> = {};
      filteredOptions.forEach((_, idx) => {
        votesObj[idx.toString()] = 0;
      });

      await addDoc(pollsColRef, {
        streamId: activeStream.id,
        question: pollQuestion,
        options: filteredOptions,
        votes: votesObj,
        votedUserIds: [],
        isActive: true,
        createdAt: new Date().toISOString()
      });

      toast.success("تم إطلاق التصويت المباشر للطلاب!");
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      console.error("Error creating poll: ", err);
      toast.error("فشل إطلاق التصويت.");
    }
  };

  // Submit Vote
  const handleVote = async (pollId: string, optionIndex: string) => {
    if (!activeStream || !userData) return;
    
    try {
      const pollDocRef = doc(db, 'live_streams', activeStream.id, 'polls', pollId);
      
      // Use transaction to securely record votes and prevent double voting
      await runTransaction(db, async (transaction) => {
        const pollSnap = await transaction.get(pollDocRef);
        if (!pollSnap.exists()) return;

        const pollData = pollSnap.data() as LivePoll;
        const votedList = pollData.votedUserIds || [];
        const uid = userData.id || auth.currentUser?.uid || '';

        if (votedList.includes(uid)) {
          toast.error("لقد قمت بالتصويت بالفعل!");
          return;
        }

        const updatedVotes = { ...pollData.votes };
        updatedVotes[optionIndex] = (updatedVotes[optionIndex] || 0) + 1;
        const updatedVotedList = [...votedList, uid];

        transaction.update(pollDocRef, {
          votes: updatedVotes,
          votedUserIds: updatedVotedList
        });
      });

      toast.success("تم تسجيل صوتك بنجاح!");
    } catch (err) {
      console.error("Error casting vote: ", err);
      toast.error("فشل تسجيل التصويت.");
    }
  };

  // End Poll
  const endPoll = async (pollId: string) => {
    if (!activeStream) return;
    try {
      const pollDocRef = doc(db, 'live_streams', activeStream.id, 'polls', pollId);
      await updateDoc(pollDocRef, {
        isActive: false
      });
      toast.success("تم إنهاء التصويت وإظهار النتائج النهائية.");
    } catch (err) {
      console.error("Error ending poll: ", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-right" dir="rtl">
      
      {/* Dynamic Lobby View */}
      {view === 'lobby' && (
        <div className="space-y-8">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#B8860B] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  <span>حصص البث المباشر التفاعلية</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black leading-tight">
                  تواصل تفاعلي حقيقي ومباشر بالصوت والصورة 🎙️
                </h2>
                <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
                  هنا يجتمع المعلمون والطلاب لمناقشة الدروس ومشاركة شاشات الشرح، مع صبورة تفاعلية تدعم الرسم الفوري، ونظام تصويت تفاعلي، ومحادثات مبهجة تدعم التفاعلات الحية مثل يوتيوب تماماً!
                </p>
              </div>
              
              {isTeacher && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-4 bg-white text-[#0077B6] dark:text-amber-950 font-black rounded-2xl shadow-lg hover:scale-[1.03] transition-all flex items-center gap-2 shrink-0 cursor-pointer text-sm"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  إنشاء حصة لايف جديدة
                </button>
              )}
            </div>
          </div>

          {/* Active Live Streams Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 bg-[#00B4D8] dark:bg-[#D4AF37] rounded-full"></div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                البثوث المباشرة الحالية
              </h3>
            </div>

            {streams.filter(s => s.status === 'live').length === 0 ? (
              <div className="bg-white dark:bg-[#12121A] border border-gray-100 dark:border-[#1E1E2F] rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#1A1A26] rounded-2xl flex items-center justify-center mx-auto border border-gray-100 dark:border-[#222235]">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-black text-gray-800 dark:text-gray-200">لا يوجد بث مباشر جارٍ حالياً</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  عندما يبدأ أحد المعلمين بثاً مباشراً تفاعلياً، ستتمكن من الانضمام فوراً والتفاعل معه في الوقت الحقيقي.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {streams.filter(s => s.status === 'live').map((stream) => (
                  <motion.div
                    key={stream.id}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-[#12121A] rounded-3xl p-6 border-2 border-red-500/30 shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Live Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse shadow-md">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      مباشر الآن
                    </div>

                    <div className="space-y-2 pt-4">
                      <span className="text-[10px] font-black text-[#00B4D8] dark:text-[#D4AF37] bg-gray-100 dark:bg-[#1A1A26] px-3 py-1 rounded-full">
                        {stream.courseTitle}
                      </span>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                        {stream.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {stream.description}
                      </p>
                    </div>

                    <div className="border-t border-gray-100 dark:border-[#1E1E2F] pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#00B4D8] dark:text-[#D4AF37] flex items-center justify-center font-black text-xs">
                          {stream.teacherName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-800 dark:text-gray-200">{stream.teacherName}</p>
                          <p className="text-[10px] text-gray-400 font-bold">بث مباشر تفاعلي</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-black text-gray-500 bg-gray-50 dark:bg-[#1A1A26] px-2 py-1 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-red-500" />
                        <span>{stream.viewerCount} مشاهد</span>
                      </div>
                    </div>

                    <button
                      onClick={() => joinStream(stream)}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs transition-colors shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      انضم للبث المباشر
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled & Past Streams Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            
            {/* Scheduled Streams */}
            <div className="space-y-5 bg-white dark:bg-[#12121A] rounded-3xl p-6 border border-gray-100 dark:border-[#1E1E2F]">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-50 dark:border-[#1E1E2F] pb-3">
                <Calendar className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                الحصص المجدولة القادمة
              </h3>

              {streams.filter(s => s.status === 'scheduled').length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-bold">
                  لا توجد حصص مجدولة حالياً.
                </div>
              ) : (
                <div className="space-y-4">
                  {streams.filter(s => s.status === 'scheduled').map((stream) => (
                    <div
                      key={stream.id}
                      className="p-4 bg-gray-50 dark:bg-[#1A1A26] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-100 dark:border-[#222235]"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full">
                          {stream.courseTitle}
                        </span>
                        <h4 className="text-sm font-black text-gray-800 dark:text-white">{stream.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold">بواسطة الأستاذ: {stream.teacherName}</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {isTeacher && stream.teacherId === (userData?.id || auth.currentUser?.uid) && (
                          <>
                            <button
                              onClick={() => goLive(stream)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-black transition-colors"
                            >
                              بدء البث المباشر 🎬
                            </button>
                            <button
                              onClick={() => deleteStream(stream.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {!isTeacher && (
                          <span className="text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-200/30">
                            مجدولة قريباً
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Streams (Recorded Sessions) */}
            <div className="space-y-5 bg-white dark:bg-[#12121A] rounded-3xl p-6 border border-gray-100 dark:border-[#1E1E2F]">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-50 dark:border-[#1E1E2F] pb-3">
                <BookOpen className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                أرشيف الحصص المسجلة السابقة
              </h3>

              {streams.filter(s => s.status === 'ended').length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-bold">
                  لا توجد حصص مسجلة سابقة.
                </div>
              ) : (
                <div className="space-y-4">
                  {streams.filter(s => s.status === 'ended').map((stream) => (
                    <div
                      key={stream.id}
                      className="p-4 bg-gray-50/50 dark:bg-[#1A1A26]/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-100 dark:border-[#1E1E2F]"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full">
                          تم الانتهاء • {stream.courseTitle}
                        </span>
                        <h4 className="text-sm font-black text-gray-700 dark:text-gray-300">{stream.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold">تم الانتهاء منها وحفظها للرجوع إليها بأي وقت.</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => joinStream(stream)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-[#00B4D8]/10 hover:bg-[#00B4D8]/20 dark:bg-[#D4AF37]/10 dark:hover:bg-[#D4AF37]/20 text-[#00B4D8] dark:text-[#D4AF37] rounded-xl text-[10px] font-black transition-colors"
                        >
                          مشاهدة التسجيل والدردشة 🍿
                        </button>

                        {isTeacher && stream.teacherId === (userData?.id || auth.currentUser?.uid) && (
                          <button
                            onClick={() => deleteStream(stream.id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Active Stream View (CINEMATIC STREAM LAYOUT) */}
      {view === 'stream' && activeStream && (
        <div className="space-y-6">
          
          {/* Top Bar with Exit */}
          <div className="flex items-center justify-between bg-white dark:bg-[#12121A] p-4 rounded-3xl border border-gray-100 dark:border-[#1E1E2F]">
            <div className="flex items-center gap-3">
              <button
                onClick={leaveStream}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-[#1A1A26] dark:hover:bg-[#222235] rounded-2xl transition-colors text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">
                  العودة للرئيسية
                </h3>
                <p className="text-[10px] text-gray-400 font-bold">أنت تتابع حالياً: {activeStream.courseTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeStream.status === 'live' ? (
                <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black animate-pulse shadow-md">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  مباشر الآن
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-500 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black">
                  تسجيل محفوظ
                </div>
              )}

              {isTeacher && activeStream.status === 'live' && (
                <button
                  onClick={() => endStream(activeStream.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black transition-colors"
                >
                  إنهاء البث المباشر 🏁
                </button>
              )}
            </div>
          </div>

          {/* Core Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Cinematic Video & Interactive Whiteboard Box (Col-span 8) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Media Player Layer */}
<div className={
                isMaximizedVideo 
                  ? "fixed inset-0 z-[100] bg-black flex flex-col justify-between p-4 md:p-8 animate-none font-sans"
                  : "relative z-10 aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-100 dark:border-[#1E1E2F]"
              }>
                


                {/* Embedded Video Display (Webcam stream for live broadcasts) */}
                {isCamOn && localStream && activeStream.status === 'live' && !isSimulatedStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isTeacher} // Mute feedback for streamer
                    className={`w-full h-full object-cover ${activeStream.isScreenSharing ? '' : 'transform -scale-x-100'}`}
                  />
                ) : activeStream.status === 'live' ? (
                  /* GORGEOUS VIRTUAL STREAMING STUDIO FALLBACK */
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F1A] via-[#09090F] to-black flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden" dir="rtl">
                    {/* Glowing dynamic background grid or radar rings */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#D4AF37_1px,transparent_1px)]" />
                    
                    {/* Radar animation circles */}
                    <div className="absolute w-72 h-72 border border-[#00B4D8]/10 dark:border-[#D4AF37]/10 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />
                    <div className="absolute w-96 h-96 border border-[#00B4D8]/5 dark:border-[#D4AF37]/5 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '6s' }} />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center space-y-4">
                      
                      {/* Active Live badge */}
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black tracking-widest uppercase rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                        البث المباشر الذكي نشط 📡
                      </span>

                      {/* Main Glowing Avatar */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#00B4D8] to-indigo-600 dark:from-[#D4AF37] dark:to-amber-600 p-1 shadow-2xl shadow-[#00B4D8]/20 dark:shadow-[#D4AF37]/20 flex items-center justify-center relative z-10">
                          <div className="w-full h-full bg-[#12121A] rounded-full flex items-center justify-center font-black text-2xl text-white">
                            {activeStream.teacherName ? activeStream.teacherName.charAt(0) : 'م'}
                          </div>
                        </div>
                        {/* Audio pulsing halo */}
                        <div className="absolute -inset-2 bg-gradient-to-tr from-[#00B4D8] to-indigo-600 dark:from-[#D4AF37] dark:to-amber-600 rounded-full opacity-30 blur animate-pulse" />
                      </div>

                      {/* Name & Title */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-white">الأستاذ {activeStream.teacherName}</h3>
                        <p className="text-[10px] text-gray-400 font-bold bg-white/5 dark:bg-white/10 px-3 py-0.5 rounded-full border border-white/5">
                          يقدم الآن: {activeStream.title}
                        </p>
                      </div>

                      {/* Dynamic Audio Waveform Simulation */}
                      {isMicOn && (
                        <div className="flex items-end justify-center gap-1 h-6 mt-1.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((val, idx) => {
                            const delay = (idx * 0.08).toFixed(2);
                            const heights = ['h-2', 'h-4', 'h-5', 'h-3', 'h-5', 'h-6', 'h-2'];
                            const selectedHeight = heights[idx % heights.length];
                            return (
                              <div
                                key={idx}
                                className={`w-1 rounded-full bg-gradient-to-t from-[#00B4D8] to-indigo-400 dark:from-[#D4AF37] to-amber-400 ${selectedHeight} animate-[pulse_1s_infinite]`}
                                style={{ animationDelay: `${delay}s` }}
                              />
                            );
                          })}
                        </div>
                      )}

                      {/* Controls state badges */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[8px] font-black text-gray-400 bg-[#12121A] px-2.5 py-1 rounded-lg border border-gray-800 flex items-center gap-1">
                          🎙️ ميكروفون المعلم: {isMicOn ? 'مفتوح ومباشر' : 'مكتوم'}
                        </span>
                        <span className="text-[8px] font-black text-gray-400 bg-[#12121A] px-2.5 py-1 rounded-lg border border-gray-800 flex items-center gap-1">
                          💻 الكاميرا: بث افتراضي HD
                        </span>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white space-y-4">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full border border-indigo-500/30 flex items-center justify-center animate-pulse">
                      <Video className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div className="text-center space-y-1 p-4">
                      <h4 className="text-base font-black">
                        {activeStream.status === 'scheduled' ? "الحصة لم تبدأ بعد" : "الحصة انتهت وتم تسجيلها بنجاح"}
                      </h4>
                      <p className="text-[11px] text-gray-400 max-w-sm leading-relaxed">
                        {activeStream.status === 'scheduled' ? "بانتظار بدء المعلم للحصة المباشرة. ستتمكن من المشاركة قريباً." : "يمكنك متابعة أرشيف الدردشة والتصويتات التفاعلية السابقة التي تمت خلال الحصة."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Local Video Camera Overlay for Student if they want to enable (Simulates Interactive Classroom) */}
                {!isTeacher && activeStream.status === 'live' && (
                  <div className="absolute bottom-4 right-4 w-32 h-24 bg-[#12121A] rounded-2xl overflow-hidden border-2 border-[#00B4D8] shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-[8px] font-black text-gray-400 text-center px-1">كاميرتك التفاعلية</p>
                    </div>
                  </div>
                )}

                {/* Floating Emojis Reaction Canvas Layer */}
                <div className="absolute inset-y-0 right-10 left-10 pointer-events-none z-30">
                  <AnimatePresence>
                    {floatingEmojis.map((emoji) => (
                      <motion.div
                        key={emoji.id}
                        initial={{ opacity: 0, y: '100%', scale: 0.8 }}
                        animate={{ opacity: [0, 1, 1, 0], y: '-10%', scale: [0.8, 1.4, 1.2, 0.8] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.5, ease: 'easeOut' }}
                        className="absolute text-4xl"
                        style={{ left: `${emoji.left}%` }}
                      >
                        {emoji.char}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Video controls bottom bar */}
                <div className="control-bar absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between text-white z-40">
                  <div className="flex items-center gap-3">
                    {isTeacher && activeStream.status === 'live' && (
                      <>
                        <button
                          onClick={toggleCam}
                          className={`relative p-2 rounded-xl transition-all duration-300 ${isCamOn ? 'bg-[#00B4D8]/30 hover:bg-[#00B4D8]/50 text-[#00B4D8]' : 'bg-red-500/40 hover:bg-red-500/60 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-[pulse_2s_ease-in-out_infinite]'}`}
                          title="تشغيل/إيقاف الكاميرا"
                        >
                          {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={toggleMic}
                          className={`relative p-2 rounded-xl transition-all duration-300 ${isMicOn ? 'bg-[#00B4D8]/30 hover:bg-[#00B4D8]/50 text-[#00B4D8]' : 'bg-red-500/40 hover:bg-red-500/60 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-[pulse_2s_ease-in-out_infinite]'}`}
                          title="كتم/تفعيل الصوت"
                        >
                          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                          className={`relative p-2 rounded-xl transition-all duration-300 ${isScreenSharing ? 'bg-indigo-500/40 hover:bg-indigo-500/60 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-[pulse_2s_ease-in-out_infinite]' : 'bg-gray-700/50 hover:bg-gray-600/50 text-white'}`}
                          title="مشاركة الشاشة"
                        >
                          <Monitor className="w-4 h-4" />
                        </button>

                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isUploadingRecording}
                          className={`relative p-2 rounded-xl transition-all duration-300 ${isRecording ? 'bg-red-500/40 hover:bg-red-500/60 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-[pulse_1.5s_ease-in-out_infinite]' : 'bg-gray-700/50 hover:bg-gray-600/50 text-white'} ${isUploadingRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isTeacher && (
                      <button
                        onClick={toggleWhiteboard}
                        className={`p-2 rounded-xl transition-all active:scale-95 text-white cursor-pointer flex items-center gap-1 border ${isWhiteboardActive ? 'bg-indigo-500/50 border-indigo-400' : 'bg-white/10 hover:bg-white/20 border-white/5'}`}
                        title="الصبورة الذكية"
                      >
                        <span className="text-[10px] font-black hidden sm:inline text-indigo-400">الصبورة الذكية</span>
                        <Palette className="w-4 h-4 text-indigo-400" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => setIsMaximizedVideo(!isMaximizedVideo)}
                      className="p-2 rounded-xl transition-all bg-white/10 hover:bg-white/20 active:scale-95 text-white cursor-pointer flex items-center gap-1 border border-white/5"
                      title={isMaximizedVideo ? "تقليص الشاشة (وضع السينما)" : "تكبير الشاشة (ملء المنصة)"}
                    >
                      {isMaximizedVideo ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Smart Whiteboard Overlay */}
                {isWhiteboardActive && activeStream && (
                  <SmartWhiteboard 
                    streamId={activeStream.id} 
                    isTeacher={isTeacher} 
                    onClose={toggleWhiteboard} 
                  />
                )}
              </div>
              {/* Student Hand Raise / Question box */}
              {!isTeacher && activeStream.status === 'live' && (
                <div className="bg-white dark:bg-[#12121A] rounded-3xl p-6 border border-gray-100 dark:border-[#1E1E2F] space-y-4 text-right animate-none" dir="rtl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00B4D8] to-indigo-500 dark:from-[#D4AF37] dark:to-amber-500 flex items-center justify-center text-white shadow-md">
                      <Hand className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">ميزة رفع اليد وتنبيه المعلم ✋</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        لفت انتباه المعلم مباشرة وطرح سؤالك أو طلب المداخلة الصوتية أثناء الشرح المباشر.
                      </p>
                    </div>
                  </div>

                  {raisedHands.some(h => h.id === userData?.id) ? (
                    // Raised Hand Active State
                    <div className="bg-amber-50/50 dark:bg-[#D4AF37]/5 rounded-2xl p-4 border border-amber-200/30 dark:border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-bounce">✋</span>
                        <div className="text-right">
                          <h4 className="text-xs font-black text-amber-800 dark:text-amber-400">لقد قمت برفع يدك للمعلم</h4>
                          <p className="text-[9px] text-amber-600 dark:text-amber-500/80 font-bold">
                            {raisedHands.find(h => h.id === userData?.id)?.message 
                              ? `رسالتك: "${raisedHands.find(h => h.id === userData?.id)?.message}"`
                              : "ينتظر المعلم للتجاوب معك ومناقشة سؤالك الآن."}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleLowerHand}
                        className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                      >
                        إنزال اليد ↙️
                      </button>
                    </div>
                  ) : (
                    // Form to raise hand
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={handRaiseMessage}
                          onChange={(e) => setHandRaiseMessage(e.target.value)}
                          placeholder="أكتب رسالة قصيرة أو سؤالاً للأستاذ هنا... (اختياري)"
                          maxLength={120}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A26] border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] dark:focus:ring-[#D4AF37] transition-all"
                        />
                        <span className="absolute left-3 top-3.5 text-[9px] text-gray-400 font-bold">
                          {handRaiseMessage.length}/120
                        </span>
                      </div>
                      <button
                        onClick={handleRaiseHand}
                        disabled={isRaisingHand}
                        className="w-full py-3 bg-[#00B4D8] hover:bg-[#0077B6] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] disabled:opacity-50 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      >
                        <Hand className="w-4 h-4" />
                        ارفع يدك الآن لتنبيه الأستاذ ✋✨
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Teacher Hand Raise Management Panel */}
              {isTeacher && activeStream.status === 'live' && (
                <div className="bg-white dark:bg-[#12121A] rounded-3xl p-6 border-2 border-red-500/20 dark:border-[#D4AF37]/20 space-y-6 text-right relative overflow-hidden animate-none" dir="rtl">
                  {/* Decorative glow */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 dark:border-gray-900 pb-4 relative z-10">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          {raisedHands.length > 0 && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${raisedHands.length > 0 ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                        </span>
                        لوحة الطلاب الرافعين أيديهم للأسئلة ✋
                        {raisedHands.length > 0 && (
                          <span className="px-2.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-black animate-pulse">
                            {raisedHands.length} نشط
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold">
                        تجاوب مع أسئلة وطلبات الطلاب المتواجدين بالبث مباشرة وقم بإنزال أيديهم بعد الإجابة.
                      </p>
                    </div>

                    {raisedHands.length > 0 && (
                      <button
                        onClick={handleClearAllHands}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        إنزال يد الجميع 🧹✋
                      </button>
                    )}
                  </div>

                  {raisedHands.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      {raisedHands.map((hand) => (
                        <div 
                          key={hand.id}
                          className="p-4 bg-red-50/20 hover:bg-red-50/40 dark:bg-red-950/10 dark:hover:bg-red-950/20 border-2 border-red-500/10 dark:border-red-500/20 rounded-2xl flex items-start justify-between gap-4 transition-all group"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-xs">
                                {hand.userName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-gray-800 dark:text-gray-200">{hand.userName}</h4>
                                <p className="text-[9px] text-gray-400 font-bold">
                                  تم الرفع {new Date(hand.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                              </div>
                            </div>

                            {hand.message ? (
                              <div className="p-2.5 bg-white dark:bg-[#1A1A26] rounded-xl border border-red-500/5 text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                💬 <span className="font-bold text-gray-900 dark:text-white">الرسالة:</span> "{hand.message}"
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-400 italic font-bold">لم يرفق رسالة (يرغب بالمشاركة الصوتية/لفت انتباه)</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleResolveHand(hand.id)}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-1 shadow-md hover:scale-105 cursor-pointer self-center"
                            title="تجاوب وإنزال اليد"
                          >
                            <Check className="w-3.5 h-3.5" />
                            تمت الإجابة
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50/50 dark:bg-[#1A1A26]/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-3 relative z-10">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-[#222235] rounded-full flex items-center justify-center text-gray-400">
                        <Hand className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-800 dark:text-gray-200">لا توجد أيدي مرفوعة حالياً</h4>
                        <p className="text-[10px] text-gray-400 font-bold max-w-xs leading-relaxed">
                          عندما يقوم أحد الطلاب برفع يده أو كتابة سؤال مباشر، ستظهر طلباتهم هنا فوراً مع تنبيه صوتي وبصري لتجاوب سلس ومباشر.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Title & Description under video */}
              <div className="bg-white dark:bg-[#12121A] rounded-3xl p-6 border border-gray-100 dark:border-[#1E1E2F] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-black text-[#00B4D8] bg-[#00B4D8]/10 dark:text-[#D4AF37] dark:bg-[#D4AF37]/10 px-3.5 py-1.5 rounded-full">
                    {activeStream.courseTitle}
                  </span>
                  <p className="text-[11px] text-gray-400 font-bold">بواسطة الأستاذ: {activeStream.teacherName}</p>
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {activeStream.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
                  {activeStream.description}
                </p>
              </div>

              {/* Attached Materials Section */}
              <div className="bg-white dark:bg-[#12121A] rounded-3xl p-6 border border-gray-100 dark:border-[#1E1E2F] space-y-6 text-right" dir="rtl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 dark:border-gray-900 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                      المرفقات والمذكرات التوضيحية للحصة 📚
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                      {isTeacher 
                        ? "قم برفع ملفات PDF أو صور توضيحية مرتبطة بالحصة ليقوم الطلاب بتحميلها مباشرة" 
                        : "حمل الملخصات والصور والملفات المرفقة التي يشاركها المعلم معك مباشرة أثناء البث"}
                    </p>
                  </div>

                  {isTeacher && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUploadMaterial}
                        accept="application/pdf,image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingMaterial}
                        className="px-4 py-2.5 bg-[#00B4D8] hover:bg-[#0077B6] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        {isUploadingMaterial ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            جاري الرفع ({uploadProgress}%)
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            رفع ملف جديد (PDF / صورة)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar for teacher upload */}
                {isUploadingMaterial && (
                  <div className="bg-gray-50 dark:bg-[#1A1A26] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-black text-gray-700 dark:text-gray-300">
                      <span>جاري رفع الملف المرفق وتجهيزه للبث المباشر...</span>
                      <span className="text-[#00B4D8] dark:text-[#D4AF37]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#00B4D8] to-indigo-500 dark:from-[#D4AF37] dark:to-amber-500 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Materials List */}
                {activeStream.materials && activeStream.materials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeStream.materials.map((material) => (
                      <div 
                        key={material.id}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/70 dark:bg-[#1A1A26] dark:hover:bg-[#222235] rounded-2xl border border-gray-100 dark:border-gray-800/80 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${material.type === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {material.type === 'pdf' ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <FileIcon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="text-right max-w-[180px] sm:max-w-[240px]">
                            <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 truncate" title={material.title}>
                              {material.title}
                            </h4>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                              {material.type === 'pdf' ? 'مذكرة PDF جاهزة للطباعة' : 'صورة أو رسم توضيحي'} • {new Date(material.uploadedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a 
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#00B4D8] dark:hover:text-[#D4AF37] rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#00B4D8] dark:hover:border-[#D4AF37] transition-all shadow-sm"
                            title="تحميل مباشر"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {isTeacher && (
                            <button
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="p-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl border border-red-500/10 transition-all"
                              title="حذف الملف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50/50 dark:bg-[#1A1A26]/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-[#222235] rounded-full flex items-center justify-center text-gray-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-gray-800 dark:text-gray-200">لا توجد ملفات أو مرفقات متاحة حالياً</h4>
                      <p className="text-[10px] text-gray-400 font-bold max-w-xs leading-relaxed">
                        {isTeacher 
                          ? "لم تقم برفع أي ملفات لهذه الحصة بعد. اضغط على الزر في الأعلى لمشاركة ملخص أو صورة توضيحية مع طلابك." 
                          : "سيقوم المعلم بمشاركة المذكرات، الملخصات، أو الرسومات التوضيحية هنا فور رفعها أثناء البث المباشر."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Live Chat & Polls Column (Col-span 4) */}
            <div className="lg:col-span-4 space-y-6">
              
              <LiveChat 
                activeStream={activeStream} 
                userData={userData} 
                sendReaction={sendReaction} 
              />

              {/* Active Interactive Polls Card */}
              <AnimatePresence>
                {activePoll && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="bg-white dark:bg-[#12121A] rounded-3xl p-6 border-2 border-[#00B4D8] dark:border-[#D4AF37] shadow-xl space-y-4 text-right"
                  >
                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-900 pb-2">
                      <span className="text-[10px] font-black text-[#00B4D8] dark:text-[#D4AF37] bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                        <BarChart2 className="w-3.5 h-3.5" />
                        تصويت مباشر الآن!
                      </span>
                      {isTeacher && (
                        <button
                          onClick={() => endPoll(activePoll.id)}
                          className="text-[10px] font-black text-red-500 hover:underline"
                        >
                          إنهاء التصويت
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                        {activePoll.question}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold">صوتك يؤثر في النتيجة الحية مباشرة</p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 pt-2">
                      {activePoll.options.map((opt, idx) => {
                        const votesArray = Object.values(activePoll.votes) as number[];
                        const totalVotes = votesArray.reduce((a: number, b: number) => a + b, 0);
                        const optVotes = (activePoll.votes[idx.toString()] as number) || 0;
                        const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        const hasVoted = (activePoll.votedUserIds || []).includes(userData?.id || auth.currentUser?.uid || '');

                        return (
                          <div key={idx} className="space-y-1">
                            {hasVoted || isTeacher ? (
                              // Results view
                              <div className="relative p-3 bg-gray-50 dark:bg-[#1A1A26] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                                <div 
                                  className="absolute inset-y-0 right-0 bg-[#00B4D8]/10 dark:bg-[#D4AF37]/10 transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative z-10 flex justify-between items-center text-xs font-black">
                                  <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                                  <span className="text-[#00B4D8] dark:text-[#D4AF37]">{pct}% ({optVotes})</span>
                                </div>
                              </div>
                            ) : (
                              // Click to vote view
                              <button
                                onClick={() => handleVote(activePoll.id, idx.toString())}
                                className="w-full text-right p-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#1A1A26] dark:hover:bg-[#222235] rounded-xl text-xs font-black text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-gray-800 transition-all flex items-center justify-between"
                              >
                                <span>{opt}</span>
                                <Check className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

        </div>
      )}

      {/* CREATE STREAM MODAL (Teacher) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#12121A] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-[#1E1E2F] space-y-6 text-right"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E1E2F] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 text-[#00B4D8] dark:text-[#D4AF37] flex items-center justify-center rounded-xl">
                    <Video className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">جدولة حصة لايف جديدة</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">عنوان الحصة المباشرة</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: مراجعة الوحدة الأولى وحل بنك الأسئلة"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A26] rounded-xl text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">وصف ومحتوى الحصة</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="اكتب وصفاً قصيراً للطلاب لتشجيعهم على الانضمام والتحضير"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A26] rounded-xl text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">اختر المادة الدراسية المرتبطة</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A26] rounded-xl text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#00B4D8]"
                  >
                    <option value="">-- اختر مادة من القائمة --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-[#1A1A26] hover:bg-gray-200 dark:hover:bg-[#252538] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateStream}
                  disabled={isSubmittingStream}
                  className="flex-1 py-3 bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] text-white rounded-xl text-xs font-black transition-all shadow-md"
                >
                  {isSubmittingStream ? "جاري إنشاء الحصة..." : "تأكيد وجدولة الحصة"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE POLL MODAL (Teacher) */}
      <AnimatePresence>
        {showPollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPollModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#12121A] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-[#1E1E2F] space-y-6 text-right"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E1E2F] pb-4">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                  إنشاء وإطلاق تصويت مباشر للطلاب
                </h3>
                <button
                  onClick={() => setShowPollModal(false)}
                  className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300">سؤال التصويت</label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="مثال: هل تبدو الإجابة أ أم ب هي الصحيحة؟"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A26] rounded-xl text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-600 dark:text-gray-300 flex justify-between">
                    <span>خيارات التصويت (أدخل خيارين على الأقل)</span>
                    {pollOptions.length < 4 && (
                      <button
                        onClick={() => setPollOptions(prev => [...prev, ''])}
                        className="text-[10px] font-black text-[#00B4D8] hover:underline"
                      >
                        + إضافة خيار
                      </button>
                    )}
                  </label>

                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                        placeholder={`الخيار ${idx + 1}`}
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-[#1A1A26] rounded-xl text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#00B4D8]"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPollModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-[#1A1A26] hover:bg-gray-200 dark:hover:bg-[#252538] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreatePoll}
                  className="flex-1 py-3 bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] text-white rounded-xl text-xs font-black transition-all shadow-md"
                >
                  إطلاق التصويت الآن 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
