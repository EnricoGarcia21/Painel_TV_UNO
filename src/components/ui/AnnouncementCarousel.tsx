import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import type { Announcement } from '../../api/mockData';
import { cn } from '../../lib/utils';

interface AnnouncementCarouselProps {
  announcements: Announcement[];
  autoPlayInterval?: number; // milliseconds
}

export const AnnouncementCarousel: React.FC<AnnouncementCarouselProps> = ({
  announcements,
  autoPlayInterval = 15000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);

  const activeAnnouncement = announcements[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + announcements.length) % announcements.length);
    setProgress(0);
  };

  // Autoplay and progress bar logic
  useEffect(() => {
    if (announcements.length <= 1) return;

    if (!isHovered) {
      const step = 100 / (autoPlayInterval / 100); // Progress increment every 100ms
      
      progressIntervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + step;
        });
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentIndex, isHovered, announcements.length, autoPlayInterval]);

  if (!announcements || announcements.length === 0) return null;

  // Visual highlights based on notification type
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50/70 border-emerald-200/60',
          text: 'text-emerald-800',
          iconBg: 'bg-emerald-500 text-white',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          progressBar: 'bg-emerald-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/70 border-amber-200/60',
          text: 'text-amber-800',
          iconBg: 'bg-amber-500 text-white',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          progressBar: 'bg-amber-500',
        };
      case 'alert':
        return {
          bg: 'bg-red-50/70 border-red-200/60',
          text: 'text-red-800',
          iconBg: 'bg-red-500 text-white',
          badge: 'bg-red-100 text-red-800 border-red-200',
          progressBar: 'bg-red-500',
        };
      default: // info
        return {
          bg: 'bg-blue-50/70 border-blue-200/60',
          text: 'text-blue-800',
          iconBg: 'bg-blue-500 text-white',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          progressBar: 'bg-blue-500',
        };
    }
  };

  const currentStyles = getTypeStyles(activeAnnouncement.type);

  return (
    <div
      className={cn(
        "relative rounded-2xl border transition-all duration-500 glass-card p-6 overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-sm",
        currentStyles.bg
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-100/50">
        <div
          className={cn("h-full transition-all duration-100 ease-linear", currentStyles.progressBar)}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Megaphone Animated Icon */}
      <div className="flex-shrink-0">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          }}
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-md",
            currentStyles.iconBg
          )}
        >
          <Megaphone className="h-7 w-7" />
        </motion.div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 w-full text-center md:text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAnnouncement.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-2"
          >
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={cn("text-xs uppercase font-extrabold tracking-wider px-3 py-1 rounded-full border shadow-2xs", currentStyles.badge)}>
                {activeAnnouncement.type === 'success' ? 'Sucesso' :
                 activeAnnouncement.type === 'warning' ? 'Atenção' :
                 activeAnnouncement.type === 'alert' ? 'Destaque' : 'Informativo'}
              </span>
              
              <div className="flex items-center text-xs text-slate-500 gap-1.5 font-bold ml-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activeAnnouncement.date}</span>
                <span className="opacity-50">•</span>
                <User className="h-3.5 w-3.5" />
                <span className="font-semibold">{activeAnnouncement.author}</span>
              </div>
            </div>

            <h4 className="text-2xl font-black text-slate-900 leading-snug font-display">
              {activeAnnouncement.title}
            </h4>
            <p className="text-base text-slate-800 leading-relaxed font-medium line-clamp-2">
              {activeAnnouncement.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual Controls */}
      <div className="flex-shrink-0 flex items-center gap-1 bg-white/60 border border-slate-200/50 rounded-xl p-1 shadow-2xs">
        <button
          onClick={handlePrev}
          className="p-2 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
        
        {/* Slide Counter */}
        <span className="text-xs font-semibold text-slate-600 px-2 min-w-[40px] text-center">
          {currentIndex + 1} / {announcements.length}
        </span>
        
        <button
          onClick={handleNext}
          className="p-2 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
};
