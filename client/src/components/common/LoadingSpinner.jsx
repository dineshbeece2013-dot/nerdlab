import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'Loading...', fullPage = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      {label && <p className="text-sm font-medium text-slate-400">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
