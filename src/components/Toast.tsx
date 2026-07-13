import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle, AlertCircle, Info, AlertTriangle,
  Zap, Sparkles, Gift, Crown, Star, Bell, ThumbsUp,
  Play, Film, CreditCard, Shield, Wifi, WifiOff
} from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

// Enhanced toast item with progress bar and action buttons
function ToastItem({ 
  toast, 
  onDismiss 
}: { 
  toast: ToastMessage; 
  onDismiss: (id: string) => void; 
}) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss with progress bar
  useEffect(() => {
    if (isPaused) return;
    
    const duration = toast.duration || 5000;
    const interval = 10;
    const step = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, toast.duration, onDismiss, isPaused]);

  // Pause timer on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Icon mapping with animations
  const getIcon = () => {
    const iconProps = { className: 'w-5 h-5 shrink-0' };
    
    const icons = {
      success: {
        icon: CheckCircle,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        animation: { scale: [0.8, 1.2, 1], transition: { duration: 0.3 } }
      },
      error: {
        icon: AlertCircle,
        color: 'text-red-400',
        bg: 'bg-red-400/10',
        animation: { rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }
      },
      info: {
        icon: Info,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        animation: { scale: [1, 1.1, 1], transition: { duration: 0.3 } }
      },
      warning: {
        icon: AlertTriangle,
        color: 'text-amber-400',
        bg: 'bg-amber-400/10',
        animation: { rotate: [0, 5, -5, 0], transition: { duration: 0.4 } }
      },
      premium: {
        icon: Crown,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        animation: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0], transition: { duration: 0.5 } }
      },
      gift: {
        icon: Gift,
        color: 'text-pink-400',
        bg: 'bg-pink-400/10',
        animation: { scale: [0.8, 1.3, 1], transition: { duration: 0.4 } }
      }
    };

    const config = icons[toast.type] || icons.info;
    const IconComponent = config.icon;
    
    return (
      <motion.div
        animate={config.animation}
        className={`p-2 rounded-xl ${config.bg}`}
      >
        <IconComponent className={`${iconProps.className} ${config.color}`} />
      </motion.div>
    );
  };

  // Background styles based on type
  const getBackgroundStyle = () => {
    const styles = {
      success: 'bg-gray-900/95 border-emerald-500/20 backdrop-blur-xl',
      error: 'bg-gray-900/95 border-red-500/20 backdrop-blur-xl',
      info: 'bg-gray-900/95 border-blue-500/20 backdrop-blur-xl',
      warning: 'bg-gray-900/95 border-amber-500/20 backdrop-blur-xl',
      premium: 'bg-gradient-to-r from-gray-900/95 to-amber-900/20 border-amber-500/30 backdrop-blur-xl',
      gift: 'bg-gradient-to-r from-gray-900/95 to-pink-900/20 border-pink-500/30 backdrop-blur-xl',
    };
    
    return styles[toast.type] || styles.info;
  };

  // Progress bar color
  const getProgressColor = () => {
    const colors = {
      success: 'bg-gradient-to-r from-emerald-400 to-green-500',
      error: 'bg-gradient-to-r from-red-400 to-rose-500',
      info: 'bg-gradient-to-r from-blue-400 to-cyan-500',
      warning: 'bg-gradient-to-r from-amber-400 to-orange-500',
      premium: 'bg-gradient-to-r from-yellow-400 to-amber-500',
      gift: 'bg-gradient-to-r from-pink-400 to-rose-500',
    };
    
    return colors[toast.type] || colors.info;
  };

  // Action button if provided
  const handleAction = useCallback(() => {
    if (toast.action) {
      toast.action();
      onDismiss(toast.id);
    }
  }, [toast, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9, rotateX: -10 }}
      animate={{ 
        opacity: isExiting ? 0 : 1, 
        x: isExiting ? 100 : 0, 
        scale: isExiting ? 0.9 : 1,
        rotateX: isExiting ? -10 : 0
      }}
      exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-2xl ${getBackgroundStyle()}`}
      style={{
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 20px -5px rgba(0,0,0,0.3)',
      }}
    >
      {/* Glass shimmer effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
        }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          {getIcon()}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title (optional) */}
            {toast.title && (
              <motion.h4
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-black text-white mb-0.5"
              >
                {toast.title}
              </motion.h4>
            )}
            
            {/* Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-gray-300 leading-relaxed"
            >
              {toast.message}
            </motion.p>

            {/* Action Button */}
            {toast.action && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleAction}
                className="mt-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-bold text-white transition-all"
              >
                {toast.actionLabel || 'Take Action'}
              </motion.button>
            )}
          </div>

          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => onDismiss(toast.id), 200);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ width: '100%' }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10"
        >
          <motion.div
            className={`h-full ${getProgressColor()}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </motion.div>
      </div>

      {/* Corner glow effect */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/5 rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
}

// Toast container with grouping and stacking
export default function ToastContainer({ toasts, removeToast }: ToastProps) {
  const [groupedToasts, setGroupedToasts] = useState<ToastMessage[]>([]);

  // Group similar toasts
  useEffect(() => {
    const grouped = toasts.reduce((acc, toast) => {
      const existingGroup = acc.find(t => t.type === toast.type && t.message === toast.message);
      if (existingGroup) {
        existingGroup.count = (existingGroup.count || 1) + 1;
      } else {
        acc.push({ ...toast, count: 1 });
      }
      return acc;
    }, [] as (ToastMessage & { count?: number })[]);
    
    setGroupedToasts(grouped);
  }, [toasts]);

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm md:max-w-md"
      style={{ perspective: '1000px' }}
    >
      <AnimatePresence mode="popLayout">
        {groupedToasts.map((toast) => (
          <div key={toast.id} className="relative">
            <ToastItem 
              toast={toast} 
              onDismiss={removeToast} 
            />
            
            {/* Notification count badge */}
            {(toast.count || 1) > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg"
              >
                {toast.count}
              </motion.div>
            )}
          </div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {toasts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-600 text-xs py-8"
        >
          No notifications
        </motion.div>
      )}
    </div>
  );
}

// Custom hook for creating toasts with actions
export function useToast(addToast: (msg: string, type: ToastMessage['type']) => string) {
  const success = useCallback((message: string, title?: string, action?: { label: string; onClick: () => void }) => {
    return addToast(message, 'success');
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    return addToast(message, 'error');
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    return addToast(message, 'info');
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    return addToast(message, 'warning');
  }, [addToast]);

  const premium = useCallback((message: string, action?: () => void) => {
    const id = addToast(message, 'premium');
    // Store action for later use
    if (action) {
      // You would need to implement action storage in the toast system
    }
    return id;
  }, [addToast]);

  const promise = useCallback(async <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    const id = addToast(loading, 'info');
    
    try {
      await promise;
      removeToast(id);
      addToast(success, 'success');
    } catch (err) {
      removeToast(id);
      addToast(error, 'error');
    }
  }, [addToast]);

  return { success, error, info, warning, premium, promise };
}