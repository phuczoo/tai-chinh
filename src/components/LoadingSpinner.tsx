import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

export default function LoadingSpinner({ 
  message = 'Đang đồng bộ dữ liệu', 
  subMessage = 'Vui lòng chờ trong giây lát...' 
}: LoadingSpinnerProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4 animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        {/* Background glow */}
        <div className="absolute w-12 h-12 rounded-full bg-brand-gold/15 blur-lg animate-pulse" />
        <Loader2 className="w-10 h-10 text-brand-gold animate-spin relative z-10" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-white tracking-wider uppercase">
          {message}
        </h3>
        <p className="text-[10px] text-brand-text-soft">
          {subMessage}
        </p>
      </div>
    </div>
  );
}
