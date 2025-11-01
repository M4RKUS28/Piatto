import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chat from './Chat';

/**
 * ChatContainer - Draggable chat container with a speech bubble pointer
 * The pointer dynamically points towards the associated step
 */
const ChatContainer = ({ stepIndex, stepHeading, stepPosition, onClose, initialPosition, cookingSessionId }) => {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(initialPosition || { x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pointerStyle, setPointerStyle] = useState({ side: 'left', position: 50 });

  // Calculate pointer position based on container and step positions
  const calculatePointerPosition = useCallback(() => {
    if (!containerRef.current || !stepPosition) return;

    const container = containerRef.current.getBoundingClientRect();
    const containerCenter = {
      x: container.left + container.width / 2,
      y: container.top + container.height / 2
    };

    // Step position (center of step circle)
    const step = {
      x: stepPosition.x,
      y: stepPosition.y
    };

    // Calculate distances to each edge and find closest point on each edge
    const edges = [
      {
        side: 'top',
        distance: Math.abs(container.top - step.y),
        position: Math.max(10, Math.min(90, ((step.x - container.left) / container.width) * 100)),
        shouldShow: step.y < container.top
      },
      {
        side: 'bottom',
        distance: Math.abs(container.bottom - step.y),
        position: Math.max(10, Math.min(90, ((step.x - container.left) / container.width) * 100)),
        shouldShow: step.y > container.bottom
      },
      {
        side: 'left',
        distance: Math.abs(container.left - step.x),
        position: Math.max(10, Math.min(90, ((step.y - container.top) / container.height) * 100)),
        shouldShow: step.x < container.left
      },
      {
        side: 'right',
        distance: Math.abs(container.right - step.x),
        position: Math.max(10, Math.min(90, ((step.y - container.top) / container.height) * 100)),
        shouldShow: step.x > container.right
      }
    ];

    // Find the edge closest to the step
    const closestEdge = edges.reduce((closest, edge) => {
      if (!edge.shouldShow) return closest;
      if (!closest || edge.distance < closest.distance) return edge;
      return closest;
    }, null);

    if (closestEdge) {
      setPointerStyle({
        side: closestEdge.side,
        position: closestEdge.position
      });
    }
  }, [stepPosition]);

  // Update pointer position when container moves or step position changes
  useEffect(() => {
    calculatePointerPosition();
  }, [position, stepPosition, calculatePointerPosition]);

  // Handle drag start
  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-close-button')) return; // Don't drag when clicking close button

    const container = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - container.left,
      y: e.clientY - container.top
    });
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Render the pointer based on calculated position
  const renderPointer = () => {
    const pointerSize = 16; // Size of the triangular pointer
    const baseStyles = 'absolute w-0 h-0 border-solid';

    const styles = {
      top: {
        className: `${baseStyles} border-l-transparent border-r-transparent border-b-white`,
        style: {
          left: `${pointerStyle.position}%`,
          top: `-${pointerSize}px`,
          borderLeftWidth: `${pointerSize}px`,
          borderRightWidth: `${pointerSize}px`,
          borderBottomWidth: `${pointerSize}px`,
          transform: 'translateX(-50%)'
        }
      },
      bottom: {
        className: `${baseStyles} border-l-transparent border-r-transparent border-t-white`,
        style: {
          left: `${pointerStyle.position}%`,
          bottom: `-${pointerSize}px`,
          borderLeftWidth: `${pointerSize}px`,
          borderRightWidth: `${pointerSize}px`,
          borderTopWidth: `${pointerSize}px`,
          transform: 'translateX(-50%)'
        }
      },
      left: {
        className: `${baseStyles} border-t-transparent border-b-transparent border-r-white`,
        style: {
          top: `${pointerStyle.position}%`,
          left: `-${pointerSize}px`,
          borderTopWidth: `${pointerSize}px`,
          borderBottomWidth: `${pointerSize}px`,
          borderRightWidth: `${pointerSize}px`,
          transform: 'translateY(-50%)'
        }
      },
      right: {
        className: `${baseStyles} border-t-transparent border-b-transparent border-l-white`,
        style: {
          top: `${pointerStyle.position}%`,
          right: `-${pointerSize}px`,
          borderTopWidth: `${pointerSize}px`,
          borderBottomWidth: `${pointerSize}px`,
          borderLeftWidth: `${pointerSize}px`,
          transform: 'translateY(-50%)'
        }
      }
    };

    const config = styles[pointerStyle.side];
    return <div className={config.className} style={config.style} />;
  };

  return (
    <div
      ref={containerRef}
      className="fixed bg-white rounded-2xl shadow-2xl transition-shadow hover:shadow-3xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '400px',
        height: '500px',
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Pointer/Tail */}
      {renderPointer()}

      {/* Header */}
      <div className="bg-[#035035] text-white px-4 py-3 rounded-t-2xl flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold text-sm">AI Assistent - Step {stepIndex + 1}</span>
        </div>
        <button
          onClick={onClose}
          className="chat-close-button w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="text-white text-lg leading-none">×</span>
        </button>
      </div>

      {/* Chat Content */}
      <div className="p-4 h-[calc(100%-52px)] overflow-hidden">
        <Chat stepIndex={stepIndex} stepHeading={stepHeading} cookingSessionId={cookingSessionId} />
      </div>
    </div>
  );
};

export default ChatContainer;
