import React from 'react';
import { Loader, Wand2, CheckCircle } from 'lucide-react';

interface OptimizedLoadingIndicatorProps {
  phase: 'idle' | 'starting' | 'processing' | 'completing';
  isActive: boolean;
}

// Optimized loading indicator component that doesn't block other UI operations
export const OptimizedLoadingIndicator: React.FC<OptimizedLoadingIndicatorProps> = ({ 
  phase, 
  isActive 
}) => {
  if (!isActive) return null;

  // Get phase-specific content for smooth state transitions
  const getPhaseContent = () => {
    switch (phase) {
      case 'starting':
        return {
          icon: <Wand2 className="w-4 h-4 animate-pulse" />,
          text: 'Initializing...',
          color: 'text-blue-400'
        };
      case 'processing':
        return {
          icon: <Loader className="w-4 h-4 animate-spin" />,
          text: 'AI is analyzing...',
          color: 'text-purple-400'
        };
      case 'completing':
        return {
          icon: <CheckCircle className="w-4 h-4 animate-pulse" />,
          text: 'Finalizing...',
          color: 'text-green-400'
        };
      default:
        return {
          icon: <Loader className="w-4 h-4 animate-spin" />,
          text: 'Processing...',
          color: 'text-blue-400'
        };
    }
  };

  const { icon, text, color } = getPhaseContent();

  return (
    <div className="flex items-center gap-2">
      <div className={`${color} transition-colors duration-200`}>
        {icon}
      </div>
      <span className={`text-sm ${color} transition-colors duration-200`}>
        {text}
      </span>
    </div>
  );
};