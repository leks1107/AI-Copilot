import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AnswerOverlay = ({ answer, settings, isVisible }) => {
  if (!isVisible) return null;

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const positionClasses = settings.stealthMode
    ? 'bottom-4 right-4 max-w-xs'
    : 'bottom-1/4 left-1/2 transform -translate-x-1/2 max-w-2xl';

  return (
    <div
      className={`fixed ${positionClasses} bg-white rounded-lg shadow-xl p-4 z-50 transition-all duration-300 ${
        settings.stealthMode ? 'opacity-80 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => onClose()}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div
        className={`${fontSizeClasses[settings.fontSize]} text-gray-700 whitespace-pre-wrap`}
      >
        {answer}
      </div>

      {settings.stealthMode && (
        <div className="mt-2 text-xs text-gray-500">
          Press Ctrl+Space to toggle visibility
        </div>
      )}
    </div>
  );
};

export default AnswerOverlay; 