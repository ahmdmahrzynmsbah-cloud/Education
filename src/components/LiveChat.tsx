import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Trash2, Pin, PinOff, MessageSquare, Shield, Sparkles, 
  Smile, Flame, Heart, Award, ThumbsUp, HelpCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { LiveStream, LiveChatMessage, User } from '../types';
import toast from 'react-hot-toast';

interface LiveChatProps {
  activeStream: LiveStream;
  userData: User | null;
  sendReaction: (emoji: string) => void;
}

export default function LiveChat({ activeStream, userData, sendReaction }: LiveChatProps) {
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [pinnedMsg, setPinnedMsg] = useState<LiveChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  
  const isTeacher = userData?.role === 'teacher';
  const currentUserId = userData?.id || auth.currentUser?.uid || 'anonymous';
  const isLive = activeStream.status === 'live';

  // 1. Subscribe to Chat Messages
  useEffect(() => {
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
    }, (error) => {
      console.error("Error subscribing to chat: ", error);
    });

    return () => unsubscribeChat();
  }, [activeStream.id]);

  // 2. Subscribe to LiveStream Document to sync Pinned Message
  useEffect(() => {
    const unsubscribeStream = onSnapshot(doc(db, 'live_streams', activeStream.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as LiveStream;
        setPinnedMsg(data.pinnedMessage || null);
      }
    }, (error) => {
      console.error("Error subscribing to stream document for pin: ", error);
    });

    return () => unsubscribeStream();
  }, [activeStream.id]);

  // 3. Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    if (!isLive) {
      toast.error("عذراً، البث المباشر انتهى ولا يمكن إرسال رسائل جديدة.");
      return;
    }

    const text = chatInput.trim();
    setChatInput('');
    setIsSending(true);

    try {
      const chatColRef = collection(db, 'live_streams', activeStream.id, 'chat');
      await addDoc(chatColRef, {
        streamId: activeStream.id,
        userId: currentUserId,
        userName: userData?.name || 'مستخدم Teachland',
        userRole: userData?.role === 'teacher' ? 'معلم' : 'طالب',
        message: text,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error sending message: ", err);
      toast.error("فشل إرسال الرسالة.");
    } finally {
      setIsSending(false);
    }
  };

  // 4. Pin Message (Teacher Only)
  const handlePinMessage = async (msg: LiveChatMessage) => {
    if (!isTeacher) return;
    try {
      await updateDoc(doc(db, 'live_streams', activeStream.id), {
        pinnedMessage: msg
      });
      toast.success("تم تثبيت الرسالة بنجاح 📌");
    } catch (err) {
      console.error("Error pinning message: ", err);
      toast.error("فشل تثبيت الرسالة.");
    }
  };

  // 5. Unpin Message (Teacher Only)
  const handleUnpinMessage = async () => {
    if (!isTeacher) return;
    try {
      await updateDoc(doc(db, 'live_streams', activeStream.id), {
        pinnedMessage: null
      });
      toast.success("تم إلغاء تثبيت الرسالة.");
    } catch (err) {
      console.error("Error unpinning message: ", err);
      toast.error("فشل إلغاء التثبيت.");
    }
  };

  // 6. Delete Message (Teacher Only - Moderation)
  const handleDeleteMessage = async (msgId: string) => {
    if (!isTeacher) return;
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذه الرسالة من الدردشة؟")) {
      try {
        await deleteDoc(doc(db, 'live_streams', activeStream.id, 'chat', msgId));
        
        // If the deleted message was pinned, unpin it too
        if (pinnedMsg && pinnedMsg.id === msgId) {
          await updateDoc(doc(db, 'live_streams', activeStream.id), {
            pinnedMessage: null
          });
        }
        
        toast.success("تم حذف الرسالة.");
      } catch (err) {
        console.error("Error deleting message: ", err);
        toast.error("فشل حذف الرسالة.");
      }
    }
  };

  return (
    <div id="live-chat-panel" className="bg-white dark:bg-[#12121A] rounded-3xl border border-gray-100 dark:border-[#1E1E2F] h-[600px] lg:h-[calc(100vh-140px)] lg:max-h-[800px] lg:sticky lg:top-24 flex flex-col justify-between overflow-hidden shadow-xl text-right" dir="rtl">
      
      {/* Header */}
      <div className="p-4 bg-gray-50/80 dark:bg-[#1A1A26]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#222235] flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50"></div>
          ) : (
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
          )}
          <span className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#00B4D8] dark:text-[#D4AF37]" />
            الدردشة التفاعلية الحية
          </span>
        </div>
        
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800/60 px-2 py-0.5 rounded-md">
          {chatMessages.length} رسالة
        </span>
      </div>

      {/* Pinned Message Banner Area */}
      <AnimatePresence mode="wait">
        {pinnedMsg && (
          <motion.div
            key={pinnedMsg.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50/90 dark:bg-[#D4AF37]/10 border-b border-amber-200/50 dark:border-[#D4AF37]/20 p-3 flex items-start gap-2.5 relative z-10 overflow-hidden shrink-0"
          >
            <div className="p-1.5 bg-amber-500/20 text-amber-600 dark:text-[#D4AF37] rounded-xl shrink-0 mt-0.5">
              <Pin className="w-3.5 h-3.5 fill-current" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-black text-amber-700 dark:text-[#D4AF37]">
                  رسالة مثبتة من {pinnedMsg.userName}
                </span>
                <span className="text-[8px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded">
                  {pinnedMsg.userRole}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed truncate">
                {pinnedMsg.message}
              </p>
            </div>

            {isTeacher && (
              <button
                onClick={handleUnpinMessage}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors shrink-0"
                title="إلغاء التثبيت"
              >
                <PinOff className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages Panel */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs py-20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center border border-gray-100 dark:border-gray-800">
              <MessageSquare className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="font-bold">لا توجد رسائل حالياً</p>
              <p className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed">
                {isLive 
                  ? "رحّب بطلب زملائك والمعلم! أرسل رسالتك الأولى لبدء النقاش." 
                  : "انتهت الحصة ولم يتم إرسال رسائل."}
              </p>
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            const isSenderTeacher = msg.userRole === 'معلم';
            const isSystemReaction = msg.message.includes('تفاجأ وأرسل تفاعل: ');
            const isPinned = pinnedMsg?.id === msg.id;

            return (
              <div 
                key={msg.id} 
                className={`group relative flex flex-col gap-1 max-w-[88%] ${
                  isMe ? 'mr-auto ml-0 text-right' : 'ml-auto mr-0 text-right'
                }`}
              >
                {/* Header Information */}
                <div className={`flex items-center gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                    isSenderTeacher 
                      ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' 
                      : 'bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]'
                  }`}>
                    {msg.userRole}
                  </span>
                  <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">
                    {msg.userName}
                  </span>
                  
                  {isPinned && (
                    <span className="text-[8px] bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-[#D4AF37] px-1 py-0.2 rounded font-bold flex items-center gap-0.5">
                      <Pin className="w-2 h-2 fill-current" /> مثبتة
                    </span>
                  )}
                </div>

                {/* Message Box */}
                <div className={`relative p-3 rounded-2xl text-xs leading-relaxed transition-all shadow-sm ${
                  isSystemReaction
                    ? 'bg-amber-50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 font-bold border-r-4 border-amber-500'
                    : isSenderTeacher
                      ? 'bg-red-500/5 dark:bg-red-500/10 text-gray-800 dark:text-gray-100 border-r-4 border-red-500'
                      : 'bg-gray-100 dark:bg-[#1A1A26] text-gray-800 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-[#222233]'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>

                {/* Interactive Moderation Actions overlay on hover (Teacher only) */}
                {isTeacher && isLive && !isSystemReaction && (
                  <div className="absolute left-0 -top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white/95 dark:bg-[#12121A]/95 shadow-md border border-gray-100 dark:border-[#222235] rounded-lg px-1.5 py-0.5 gap-1 z-20">
                    <button
                      onClick={() => handlePinMessage(msg)}
                      disabled={isPinned}
                      className={`p-1 rounded-md transition-colors ${
                        isPinned 
                          ? 'text-gray-300 dark:text-gray-700' 
                          : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      }`}
                      title={isPinned ? "مثبتة بالفعل" : "تثبيت الرسالة"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                      title="حذف الرسالة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input and Emoji Triggers */}
      <div className="p-4 bg-gray-50 dark:bg-[#1A1A26] border-t border-gray-100 dark:border-[#222235] space-y-3 shrink-0">
        
        {/* Floating emoji triggers */}
        {isLive && (
          <div className="flex items-center justify-between gap-1 border-b border-gray-200/40 dark:border-gray-800/40 pb-2 overflow-x-auto select-none no-scrollbar">
            <span className="text-[10px] font-black text-gray-400 shrink-0">تفاعل سريع:</span>
            <div className="flex gap-1.5">
              {['❤️', '👍', '🔥', '🎉', '😂', '👏', '🧠', '✨'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-sm hover:scale-125 transition-transform active:scale-90 bg-white dark:bg-[#0D0D12] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={!isLive}
            placeholder={isLive ? "اكتب رسالتك التفاعلية هنا..." : "الدردشة مقفلة لأن البث انتهى"}
            className="flex-1 px-4 py-3 bg-white dark:bg-[#0D0D12] rounded-2xl text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#00B4D8] disabled:bg-gray-100 dark:disabled:bg-[#1E1E2F] disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isLive || !chatInput.trim() || isSending}
            className="p-3 bg-[#00B4D8] dark:bg-[#D4AF37] hover:bg-[#0077B6] dark:hover:bg-[#B8860B] text-white rounded-2xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4 transform rotate-180" />
          </button>
        </form>
      </div>

    </div>
  );
}
