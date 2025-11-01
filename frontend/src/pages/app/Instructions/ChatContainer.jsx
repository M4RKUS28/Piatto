import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chat from './Chat';

/**
 * ChatContainer - Draggable chat container with a speech bubble pointer
 * The pointer dynamically points towards the associated step
 */
const ChatContainer = ({ stepIndex, stepHeading, stepPosition, onClose, initialPosition, initialSize, cookingSessionId, onSaveConfig }) => {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(initialPosition || { x: 100, y: 100 });
  const [size, setSize] = useState(initialSize || { width: 400, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
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

  // Update pointer position when container moves, resizes, or step position changes
  useEffect(() => {
    calculatePointerPosition();
  }, [position, size, stepPosition, calculatePointerPosition]);

  // Save position and size whenever they change
  useEffect(() => {
    if (onSaveConfig && !isDragging && !isResizing) {
      // Only save after dragging/resizing is complete to avoid excessive saves
      onSaveConfig(position, size);
    }
  }, [position, size, isDragging, isResizing, onSaveConfig]);

  // Handle drag start
  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-close-button')) return; // Don't drag when clicking close button
    if (e.target.closest('.resize-handle')) return; // Don't drag when clicking resize handle

    const container = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - container.left,
      y: e.clientY - container.top
    });
  };

  // Handle resize start
  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y
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

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const minWidth = 300;
      const minHeight = 400;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      // Handle different resize directions
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, resizeStart.width + deltaX);
      }
      if (resizeDirection.includes('w')) {
        const potentialWidth = resizeStart.width - deltaX;
        if (potentialWidth >= minWidth) {
          newWidth = potentialWidth;
          newX = resizeStart.posX + deltaX;
        }
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minHeight, resizeStart.height + deltaY);
      }
      if (resizeDirection.includes('n')) {
        const potentialHeight = resizeStart.height - deltaY;
        if (potentialHeight >= minHeight) {
          newHeight = potentialHeight;
          newY = resizeStart.posY + deltaY;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, resizeStart]);

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
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Resize Handles */}
      <div
        className="resize-handle absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'nw')}
        style={{ marginTop: '-4px', marginLeft: '-4px' }}
      />
      <div
        className="resize-handle absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
        onMouseDown={(e) => handleResizeStart(e, 'ne')}
        style={{ marginTop: '-4px', marginRight: '-4px' }}
      />
      <div
        className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'sw')}
        style={{ marginBottom: '-4px', marginLeft: '-4px' }}
      />
      <div
        className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        onMouseDown={(e) => handleResizeStart(e, 'se')}
        style={{ marginBottom: '-4px', marginRight: '-4px' }}
      />
      <div
        className="resize-handle absolute top-0 left-1/2 -translate-x-1/2 w-12 h-2 cursor-n-resize"
        onMouseDown={(e) => handleResizeStart(e, 'n')}
        style={{ marginTop: '-4px' }}
      />
      <div
        className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-2 cursor-s-resize"
        onMouseDown={(e) => handleResizeStart(e, 's')}
        style={{ marginBottom: '-4px' }}
      />
      <div
        className="resize-handle absolute left-0 top-1/2 -translate-y-1/2 w-2 h-12 cursor-w-resize"
        onMouseDown={(e) => handleResizeStart(e, 'w')}
        style={{ marginLeft: '-4px' }}
      />
      <div
        className="resize-handle absolute right-0 top-1/2 -translate-y-1/2 w-2 h-12 cursor-e-resize"
        onMouseDown={(e) => handleResizeStart(e, 'e')}
        style={{ marginRight: '-4px' }}
      />

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
