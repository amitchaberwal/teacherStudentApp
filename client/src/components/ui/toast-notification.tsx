import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const toastVariants = cva(
  "fixed bottom-4 right-4 z-50 fade-in bg-white rounded-lg shadow-lg p-4 flex items-start max-w-sm animate-in fade-in slide-in-from-bottom-5",
  {
    variants: {
      type: {
        success: "border-l-4 border-green-500",
        error: "border-l-4 border-red-500",
        warning: "border-l-4 border-yellow-500",
        info: "border-l-4 border-blue-500",
      },
    },
    defaultVariants: {
      type: "info",
    },
  }
);

const iconVariants = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

const iconMap = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
};

export const useToastNotification = () => {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = useCallback((props: ToastProps) => {
    setToast(props);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
};

const ToastNotification = () => {
  const { toast, hideToast } = useToastNotification();
  
  useEffect(() => {
    if (toast && toast.duration) {
      const timer = setTimeout(() => {
        hideToast();
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast) return null;

  const { type = 'info', title, message } = toast;

  return (
    <div className={cn(toastVariants({ type }))}>
      <span className={`material-icons mr-3 ${iconVariants[type]}`}>
        {iconMap[type]}
      </span>
      <div className="flex-1">
        {title && <h4 className="font-medium">{title}</h4>}
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
      <button 
        className="text-gray-400 hover:text-gray-800" 
        onClick={hideToast}
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default ToastNotification;
