import { motion } from 'motion/react';

interface LuxuriousLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LuxuriousLoader({ fullScreen = false, size = 'md', text }: LuxuriousLoaderProps) {
  const containerClasses = fullScreen
    ? "min-h-screen w-full bg-gray-50 dark:bg-[#0D0D12] flex flex-col items-center justify-center p-4 relative overflow-hidden"
    : "flex flex-col items-center justify-center p-6 relative";

  const sizeMap = {
    sm: { ring: "w-12 h-12", font: "text-[11px]", textMargin: "mt-2" },
    md: { ring: "w-20 h-20", font: "text-xs", textMargin: "mt-4" },
    lg: { ring: "w-32 h-32", font: "text-sm", textMargin: "mt-6" },
  };

  const selectedSize = sizeMap[size];

  return (
    <div className={containerClasses}>
      {/* Decorative background gradients for full screen luxurious feel */}
      {fullScreen && (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#00B4D8]/10 dark:bg-[#D4AF37]/5 blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative flex items-center justify-center">
        {/* Outer Ring 1 - Golden / Blue Gradient */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className={`${selectedSize.ring} rounded-full border-t-2 border-r-2 border-transparent border-t-[#00B4D8] dark:border-t-[#D4AF37] border-r-[#0077B6] dark:border-r-[#B8860B] absolute`}
        />

        {/* Outer Ring 2 - Opposite rotation */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className={`${selectedSize.ring} rounded-full border-b-2 border-l-2 border-transparent border-b-[#0077B6]/30 dark:border-b-[#B8860B]/30 border-l-[#00B4D8]/30 dark:border-l-[#D4AF37]/30 scale-90 absolute`}
        />

        {/* Inner Glowing Aura */}
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 0.6, 0.2] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute w-12 h-12 bg-gradient-to-tr from-[#00B4D8]/30 to-[#0077B6]/30 dark:from-[#D4AF37]/20 dark:to-[#B8860B]/20 rounded-full blur-md"
        />

        {/* Pulsing Core */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-10 h-10 bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] dark:from-[#B8860B] dark:to-[#D4AF37] rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg shadow-[#00B4D8]/30 dark:shadow-[#D4AF37]/30 border border-white/10 select-none z-10"
        >
          ت
        </motion.div>
      </div>

      {/* Elegant Pulsing/Fading Loading Text */}
      {(text || fullScreen) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${selectedSize.textMargin} flex flex-col items-center gap-1 z-10`}
        >
          <span className={`${selectedSize.font} font-black text-gray-800 dark:text-gray-100 flex items-center gap-1.5`}>
            {text || "جاري تحميل Teachland..."}
            {/* Elegant Dots Animation */}
            <span className="flex gap-0.5">
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1 h-1 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]" />
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.25 }} className="w-1 h-1 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]" />
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.5 }} className="w-1 h-1 rounded-full bg-[#00B4D8] dark:bg-[#D4AF37]" />
            </span>
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">يرجى الانتظار لحظة</span>
        </motion.div>
      )}
    </div>
  );
}
