import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
          />
          {/* Content Wrapper */}
          {children}
        </div>
      )}
    </AnimatePresence>
  );
};

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const DialogContent: React.FC<DialogContentProps> = ({ className, children, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
      className={cn(
        "relative z-50 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl glass-card",
        className
      )}
    >
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="h-4.5 w-4.5" />
          <span className="sr-only">Fechar</span>
        </button>
      )}
    </motion.div>
  );
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)} {...props} />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn("text-xl font-bold leading-none tracking-tight text-slate-900 font-display", className)} {...props} />
);

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn("text-sm text-slate-500", className)} {...props} />
);
