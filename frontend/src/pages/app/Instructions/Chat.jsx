import React from 'react';

/**
 * Chat component - Placeholder for AI chat functionality
 * Will be implemented in future iterations
 */
const Chat = ({ stepIndex, stepHeading }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Placeholder content */}
      <div className="flex-1 flex items-center justify-center text-[#2D2D2D] opacity-50">
        <p className="text-sm">Chat für Step {stepIndex + 1}: {stepHeading}</p>
      </div>
    </div>
  );
};

export default Chat;
