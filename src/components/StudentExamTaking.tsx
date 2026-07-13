import React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, Clock, BookOpen, ChevronRight, ChevronLeft, Award, CheckCircle, AlertTriangle } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation?: string;
}

interface StudentExamTakingProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
  db: any;
  userData: any;
  onSubmissionSuccess: (submissionData: any) => void;
}

export default function StudentExamTaking({
  exam,
  isOpen,
  onClose,
  db,
  userData,
  onSubmissionSuccess,
}: StudentExamTakingProps) {
  const [examStarted, setExamStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds
  const [submitting, setSubmitting] = useState(false);
  
  // Results view states
  const [showResults, setShowResults] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize time left when exam changes or is opened
  useEffect(() => {
    if (isOpen && exam) {
      setExamStarted(false);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setTimeLeft((exam.timeLimit || 30) * 60);
      setShowResults(false);
      setSubmissionResult(null);
    }
  }, [isOpen, exam]);

  // Timer effect
  useEffect(() => {
    if (examStarted && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto submit when time runs out
            setTimeout(() => {
              handleAutoSubmit();
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, timeLeft]);

  const handleStart = () => {
    setExamStarted(true);
    toast.success("بدأ الامتحان! بالتوفيق والنجاح 👍");
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = async (overrideAnswers?: Record<string, number>) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const finalAnswers = overrideAnswers || selectedAnswers;
      const questionsList: Question[] = exam.questions || [];

      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      questionsList.forEach((q) => {
        const selected = finalAnswers[q.id];
        const pts = Number(q.points) || 1;
        totalPoints += pts;
        if (selected !== undefined && selected === q.correctOptionIndex) {
          correctCount += 1;
          earnedPoints += pts;
        }
      });

      const percentScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = percentScore >= 50;

      const submissionId = `${userData.id}_${exam.id}`;
      const submissionData = {
        id: submissionId,
        userId: userData.id,
        userName: userData.name || "طالب",
        quizId: exam.id,
        courseId: exam.courseId || "",
        lessonId: "comprehensive", // marks it as comprehensive
        score: percentScore,
        totalPoints,
        correctAnswers: correctCount,
        totalQuestions: questionsList.length,
        answers: finalAnswers,
        submittedAt: new Date().toISOString(),
        passed,
      };

      await setDoc(doc(db, "quiz_submissions", submissionId), submissionData);
      
      setSubmissionResult(submissionData);
      onSubmissionSuccess(submissionData);
      setShowResults(true);
      toast.success("تم تسليم الامتحان الشامل وحفظ نتيجتك بنجاح! 🎉");
    } catch (err) {
      console.error("Error submitting comprehensive exam:", err);
      toast.error("فشل تسليم الامتحان. يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.error("انتهى الوقت المحدد للامتحان الشامل! يتم الآن تسليم إجاباتك تلقائياً...");
    handleSubmit();
  };

  if (!isOpen || !exam) return null;

  const questionsList: Question[] = exam.questions || [];
  const activeQuestion = questionsList[currentIdx];

  // Format countdown timer (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#1A1A24] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right border border-gray-100 dark:border-[#2D2D3D]"
        >
          {/* RESULTS VIEW */}
          {showResults && submissionResult ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 flex-1 overflow-y-auto">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                submissionResult.passed 
                  ? "bg-green-100 dark:bg-green-950/30 text-green-500 shadow-green-500/10" 
                  : "bg-red-100 dark:bg-red-950/30 text-red-500 shadow-red-500/10"
              }`}>
                {submissionResult.passed ? <CheckCircle className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {submissionResult.passed ? "تهانينا! لقد اجتزت الامتحان الشامل 🎉" : "حظاً موفقاً المرة القادمة! لم تجتز الامتحان ⚠️"}
                </h3>
                <p className="text-sm text-gray-400 font-bold">{exam.title}</p>
              </div>

              {/* Score Dashboard */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-md bg-gray-50 dark:bg-[#13131C] p-6 rounded-3xl border border-gray-100 dark:border-[#2D2D3D]">
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-400 font-bold">النتيجة الإجمالية</p>
                  <p className={`text-3xl font-black ${submissionResult.passed ? "text-green-500" : "text-red-500"}`}>
                    {submissionResult.score}%
                  </p>
                </div>
                <div className="text-center space-y-1 border-r border-gray-200 dark:border-[#2D2D3D]/50 pr-4">
                  <p className="text-xs text-gray-400 font-bold">الإجابات الصحيحة</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-white">
                    {submissionResult.correctAnswers} / {submissionResult.totalQuestions}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 max-w-md leading-relaxed font-medium">
                تم تسجيل هذه المحاولة وحفظ الدرجة في لوحة القيادة الخاصة بك. يمكنك مراجعة تقرير الأخطاء بالتفصيل لاحقاً من قسم الاختبارات والتقييم بالضغط على "تقرير الإجابات والأخطاء".
              </p>

              <div className="flex gap-4 w-full max-w-sm pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-gray-100 dark:bg-[#2D2D3D] text-gray-800 dark:text-white hover:bg-gray-200 rounded-2xl text-xs font-black transition-colors"
                >
                  العودة للوحة القيادة
                </button>
              </div>
            </div>
          ) : !examStarted ? (
            /* PRE-START INSTRUCTIONS */
            <div className="p-8 flex flex-col flex-1 overflow-hidden">
              <div className="space-y-6 overflow-y-auto flex-1 pr-1">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2D2D3D] pb-4">
                  <div>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-3 py-1 rounded-full">
                      امتحان شامل نشط 🏆
                    </span>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mt-2">{exam.title}</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#2D2D3D] text-gray-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-bold">تعليمات وتفاصيل الامتحان الشامل:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-[#13131C] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#00B4D8] dark:text-[#D4AF37]" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">المدة الزمنية</p>
                        <p className="text-xs font-black text-gray-800 dark:text-white">{exam.timeLimit} دقيقة كاملة</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#13131C] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">عدد الأسئلة</p>
                        <p className="text-xs font-black text-gray-800 dark:text-white">{questionsList.length} سؤال تفاعلي</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#00B4D8]/5 border-r-4 border-[#00B4D8] p-4 rounded-xl space-y-2">
                    <p className="text-xs font-black text-[#0077B6] flex items-center gap-1">
                      ⚠️ ملاحظات هامة قبل بدء الحل:
                    </p>
                    <ul className="text-[11px] text-gray-600 dark:text-gray-300 space-y-1 pl-4 list-disc font-medium">
                      <li>بمجرد الضغط على زر "بدء الامتحان"، سيبدأ المؤقت التنازلي فوراً ولا يمكن إيقافه مؤقتاً.</li>
                      <li>في حال خروجك أو إغلاقك للصفحة، سيستمر المؤقت بالعمل وسيتم تسليم إجاباتك تلقائياً عند انتهاء المدة.</li>
                      <li>تأكد من استقرار اتصال الإنترنت لديك قبل البدء.</li>
                    </ul>
                  </div>

                  {exam.description && (
                    <div className="bg-gray-50 dark:bg-[#1D1D28] p-4 rounded-2xl text-xs text-gray-500 leading-relaxed font-bold border border-gray-100 dark:border-[#2D2D3D]/50">
                      وصف المعلم: {exam.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-[#2D2D3D] mt-6 shrink-0">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-gray-100 dark:bg-[#2D2D3D] text-gray-700 dark:text-white hover:bg-gray-200 rounded-2xl text-xs font-black transition-colors"
                >
                  تراجع وإلغاء
                </button>
                <button
                  onClick={handleStart}
                  className="w-full py-3.5 bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] text-white hover:opacity-95 rounded-2xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  بدء وحل الامتحان الآن 🚀
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE EXAM RUNNING */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Active Header */}
              <div className="p-6 border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50 dark:bg-[#13131C] flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white truncate max-w-sm">{exam.title}</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                    السؤال {currentIdx + 1} من {questionsList.length}
                  </p>
                </div>
                {/* Timer Clock widget */}
                <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border font-black text-sm select-none ${
                  timeLeft !== null && timeLeft < 120 
                    ? "bg-red-50 text-red-600 border-red-200 animate-pulse" 
                    : "bg-[#00B4D8]/10 text-[#0077B6] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] border-transparent"
                }`}>
                  <Clock className="w-4 h-4 shrink-0" />
                  <span dir="ltr">{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</span>
                </div>
              </div>

              {/* Question Screen */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Enhanced Progress Bars */}
                <div className="space-y-4 mb-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                      <span>الأسئلة المُجاب عليها ({Object.keys(selectedAnswers).length} من {questionsList.length})</span>
                      <span>{Math.round((Object.keys(selectedAnswers).length / questionsList.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-[#2D2D3D] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-l from-[#00B4D8] to-[#0077B6] dark:from-[#D4AF37] dark:to-[#AA7C11] transition-all duration-300"
                        style={{ width: `${(Object.keys(selectedAnswers).length / questionsList.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                      <span>الوقت المتبقي</span>
                      <span dir="ltr">{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-[#2D2D3D] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${timeLeft !== null && timeLeft < 120 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-l from-green-400 to-green-600'}`}
                        style={{ width: `${timeLeft !== null ? (timeLeft / ((exam.timeLimit || 30) * 60)) * 100 : 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {activeQuestion && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] bg-gray-100 dark:bg-[#222230] text-gray-500 px-2.5 py-0.5 rounded-full font-bold">
                        درجة السؤال: {activeQuestion.points || 1} درجات
                      </span>
                      <h3 className="text-base font-black text-gray-900 dark:text-white leading-relaxed">
                        {activeQuestion.text}
                      </h3>
                    </div>

                    {/* Options targets */}
                    <div className="space-y-3">
                      {activeQuestion.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[activeQuestion.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(activeQuestion.id, optIdx)}
                            className={`w-full p-4 rounded-2xl text-right border text-xs font-black transition-all flex items-center justify-between ${
                              isSelected
                                ? "bg-gradient-to-l from-[#00B4D8]/10 to-transparent border-[#00B4D8] dark:from-[#D4AF37]/10 dark:to-transparent dark:border-[#D4AF37] shadow-sm scale-[1.01]"
                                : "bg-white dark:bg-[#1A1A24] border-gray-100 dark:border-[#2D2D3D]/50 hover:bg-gray-50 dark:hover:bg-[#20202d]"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center border font-bold text-xs ${
                                isSelected 
                                  ? "bg-[#00B4D8] border-[#00B4D8] text-white dark:bg-[#D4AF37] dark:border-[#D4AF37]" 
                                  : "border-gray-200 dark:border-gray-700 text-gray-400"
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className={isSelected ? "text-[#0077B6] dark:text-[#D4AF37]" : "text-gray-700 dark:text-gray-300"}>
                                {option}
                              </span>
                            </span>
                            {isSelected && (
                              <span className="text-xs text-[#00B4D8] dark:text-[#D4AF37]">محدد ✅</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="p-6 border-t border-gray-100 dark:border-[#2D2D3D] flex justify-between items-center bg-white dark:bg-[#1A1A24]">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((p) => p - 1)}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-[#2D2D3D] hover:bg-gray-100 dark:hover:bg-[#3d3d52] disabled:opacity-40 text-gray-500 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>

                {currentIdx < questionsList.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((p) => p + 1)}
                    className="px-5 py-2.5 bg-[#00B4D8] dark:bg-[#D4AF37] text-white hover:opacity-95 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    التالي
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmit()}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-green-500 text-white hover:bg-green-600 rounded-xl text-xs font-black transition-all shadow-md shadow-green-500/10 flex items-center gap-1"
                  >
                    <Award className="w-4 h-4" />
                    {submitting ? "جاري التسليم..." : "إنهاء وتسليم الإجابات 🏁"}
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
