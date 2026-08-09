import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const AlertBanner = ({ type = 'error', message, onClose }) => {
  if (!message) return null;

  const styles = {
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />,
    success: <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />,
    info: <Info className="w-5 h-5 flex-shrink-0 text-sky-400" />,
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${styles[type]} transition-all duration-200`}>
      <div className="flex items-center space-x-3">
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:opacity-75">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
