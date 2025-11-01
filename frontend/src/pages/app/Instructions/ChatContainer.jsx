import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chat from './Chat';

const MOBILE_MIN_HEIGHT = 60;
const MOBILE_BOTTOM_OFFSET = 60;
const DESKTOP_MIN_WIDTH = 320;
const DESKTOP_MIN_HEIGHT = 400;

/**
 * ChatContainer - Draggable chat container with a speech bubble pointer.
 * Desktop: free positioning with resize handles on all sides.
 * Mobile: fixed full width above navigation, height adjustable via top drag handle.
 */
const ChatContainer = ({
  stepIndex,
  stepHeading,
  stepPosition,
  onClose,
  initialPosition,
  initialSize,
  cookingSessionId,
  onSaveConfig,
  isMobile = false,
  onMobileHeightChange
}) => {
  const containerRef = useRef(null);
  const draggingPointerId = useRef(null);
  const resizingPointerId = useRef(null);

  const [position, setPosition] = useState(() => initialPosition || { x: 100, y: 100 });
  const [size, setSize] = useState(() => ({
    width: initialSize?.width ?? 400,
    height: initialSize?.height ?? 500
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
  const [pointerStyle, setPointerStyle] = useState(null);
  const [navOffset, setNavOffset] = useState(MOBILE_BOTTOM_OFFSET);

  const getMobileLimits = useCallback(() => {
    if (typeof window === 'undefined') {
      return { min: MOBILE_MIN_HEIGHT, max: MOBILE_MIN_HEIGHT * 2 };
    }
    const viewportHeight = window.innerHeight || 0;
    const max = viewportHeight
      ? Math.max(viewportHeight - (navOffset + 48), MOBILE_MIN_HEIGHT)
      : MOBILE_MIN_HEIGHT;
    return { min: MOBILE_MIN_HEIGHT, max };
  }, [navOffset]);

  // Snap to fixed positioning and clamp height when switching to mobile layout
  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const limits = getMobileLimits();
    setPosition({ x: 0, y: 0 });
    setSize((prev) => {
      const clampedHeight = Math.min(Math.max(prev.height, limits.min), limits.max);
      if (clampedHeight === prev.height) {
        return prev;
      }
      return { ...prev, height: clampedHeight };
    });
  }, [isMobile, getMobileLimits]);

  // Measure the navigation bar height to align the chat on mobile precisely above it
  useEffect(() => {
    if (!isMobile || typeof document === 'undefined') {
      setNavOffset(MOBILE_BOTTOM_OFFSET);
      return;
    }

    const navElement = document.querySelector('nav.fixed.bottom-0');

    if (!navElement) {
      setNavOffset(MOBILE_BOTTOM_OFFSET);
      return;
    }

    const updateOffset = () => {
      const height = navElement.getBoundingClientRect().height;
      setNavOffset(height || MOBILE_BOTTOM_OFFSET);
    };

    updateOffset();

    let resizeObserver;

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(updateOffset);
      resizeObserver.observe(navElement);
    } else {
      window.addEventListener('resize', updateOffset);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateOffset);
      }
    };
  }, [isMobile]);

  // Keep height within viewport bounds on orientation/viewport changes (mobile)
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      const limits = getMobileLimits();
      setSize((prev) => {
        const desired = Math.min(Math.max(prev.height, limits.min), limits.max);
        if (desired === prev.height) {
          return prev;
        }
        return { ...prev, height: desired };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, getMobileLimits]);

  // Calculate pointer position based on container and step positions (desktop only)
  const calculatePointerPosition = useCallback(() => {
    if (!containerRef.current || !stepPosition || isMobile) return;

    const container = containerRef.current.getBoundingClientRect();

    const edges = [
      {
        side: 'top',
        distance: Math.abs(container.top - stepPosition.y),
        position: Math.max(10, Math.min(90, ((stepPosition.x - container.left) / container.width) * 100)),
        shouldShow: stepPosition.y < container.top
      },
      {
        side: 'bottom',
        distance: Math.abs(container.bottom - stepPosition.y),
        position: Math.max(10, Math.min(90, ((stepPosition.x - container.left) / container.width) * 100)),
        shouldShow: stepPosition.y > container.bottom
      },
      {
        side: 'left',
        distance: Math.abs(container.left - stepPosition.x),
        position: Math.max(10, Math.min(90, ((stepPosition.y - container.top) / container.height) * 100)),
        shouldShow: stepPosition.x < container.left
      },
      {
        side: 'right',
        distance: Math.abs(container.right - stepPosition.x),
        position: Math.max(10, Math.min(90, ((stepPosition.y - container.top) / container.height) * 100)),
        shouldShow: stepPosition.x > container.right
      }
    ];

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
  }, [stepPosition, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    calculatePointerPosition();
  }, [position, size, stepPosition, calculatePointerPosition, isMobile]);

  // Save layout configuration when interactions finish
  useEffect(() => {
    if (onSaveConfig && !isDragging && !isResizing) {
      onSaveConfig(position, size);
    }
  }, [position, size, isDragging, isResizing, onSaveConfig]);

  // Notify parent about current height in mobile mode
  useEffect(() => {
    if (isMobile && onMobileHeightChange) {
      onMobileHeightChange(size.height);
    }
  }, [isMobile, size.height, onMobileHeightChange]);

  const handlePointerDown = (event) => {
    if (isMobile) return;
    if (event.target.closest('.chat-close-button')) return;
    if (event.target.closest('.resize-handle')) return;

    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    draggingPointerId.current = event.pointerId;
    setIsDragging(true);
    setDragOffset({
      x: event.clientX - container.left,
      y: event.clientY - container.top
    });
  };

  const handleResizeStart = (event, direction) => {
    event.preventDefault();
    event.stopPropagation();

    if (isMobile && direction !== 'n') {
      return;
    }

    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    resizingPointerId.current = event.pointerId;
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: event.clientX,
      y: event.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y
    });
  };

  // Drag interactions (desktop only)
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event) => {
      if (draggingPointerId.current !== event.pointerId) return;
      setPosition({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y
      });
    };

    const handlePointerUp = (event) => {
      if (draggingPointerId.current !== event.pointerId) return;
      draggingPointerId.current = null;
      setIsDragging(false);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragOffset]);

  // Resize interactions
  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event) => {
      if (resizingPointerId.current !== event.pointerId) return;

      const deltaX = event.clientX - resizeStart.x;
      const deltaY = event.clientY - resizeStart.y;

      if (isMobile) {
        const limits = getMobileLimits();
        const nextHeight = Math.min(Math.max(resizeStart.height - deltaY, limits.min), limits.max);
        setSize((prev) => ({ ...prev, height: nextHeight }));
        return;
      }

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(DESKTOP_MIN_WIDTH, resizeStart.width + deltaX);
      }
      if (resizeDirection.includes('w')) {
        const potentialWidth = resizeStart.width - deltaX;
        if (potentialWidth >= DESKTOP_MIN_WIDTH) {
          newWidth = potentialWidth;
          newX = resizeStart.posX + deltaX;
        }
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(DESKTOP_MIN_HEIGHT, resizeStart.height + deltaY);
      }
      if (resizeDirection.includes('n')) {
        const potentialHeight = resizeStart.height - deltaY;
        if (potentialHeight >= DESKTOP_MIN_HEIGHT) {
          newHeight = potentialHeight;
          newY = resizeStart.posY + deltaY;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (event) => {
      if (resizingPointerId.current !== event.pointerId) return;
      resizingPointerId.current = null;
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing, resizeDirection, resizeStart, isMobile, getMobileLimits]);

  const renderPointer = () => {
    if (isMobile) return null;

    const pointerSize = 16;
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

  const limits = getMobileLimits();
  const mobileHeight = Math.min(Math.max(size.height, limits.min), limits.max);
  const containerStyle = isMobile
    ? {
        left: 0,
        right: 0,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${MOBILE_BOTTOM_OFFSET}px)`,
        width: '100%',
        height: `${mobileHeight}px`,
        zIndex: 1000,
        cursor: isResizing ? 'ns-resize' : 'default'
      }
    : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'grab'
      };

  const containerClassName = [
    'fixed bg-white shadow-2xl transition-shadow',
    isMobile ? 'rounded-t-3xl rounded-b-none border border-[#035035]/10 overflow-hidden' : 'rounded-2xl hover:shadow-3xl'
  ].join(' ');

  const headerClassName = [
    'bg-[#035035] text-white px-4 py-3 flex items-center justify-between',
    isMobile ? 'rounded-t-3xl' : 'rounded-t-2xl cursor-grab active:cursor-grabbing'
  ].join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      style={containerStyle}
      onPointerDown={handlePointerDown}
    >
      {/* Resize Handles */}
      {!isMobile ? (
        <>
          <div
            className="resize-handle absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
            onPointerDown={(event) => handleResizeStart(event, 'nw')}
            style={{ marginTop: '-4px', marginLeft: '-4px', touchAction: 'none' }}
          />
          <div
            className="resize-handle absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
            onPointerDown={(event) => handleResizeStart(event, 'ne')}
            style={{ marginTop: '-4px', marginRight: '-4px', touchAction: 'none' }}
          />
          <div
            className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
            onPointerDown={(event) => handleResizeStart(event, 'sw')}
            style={{ marginBottom: '-4px', marginLeft: '-4px', touchAction: 'none' }}
          />
          <div
            className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
            onPointerDown={(event) => handleResizeStart(event, 'se')}
            style={{ marginBottom: '-4px', marginRight: '-4px', touchAction: 'none' }}
          />
          <div
            className="resize-handle absolute top-0 left-1/2 -translate-x-1/2 w-12 h-2 cursor-n-resize"
            onPointerDown={(event) => handleResizeStart(event, 'n')}
            style={{ marginTop: '-4px', touchAction: 'none' }}
          />
          <div
            className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-2 cursor-s-resize"
            onPointerDown={(event) => handleResizeStart(event, 's')}
            style={{ marginBottom: '-4px', touchAction: 'none' }}
          />
          <div
            className="resize-handle absolute left-0 top-1/2 -translate-y-1/2 w-2 h-12 cursor-w-resize"
            onPointerDown={(event) => handleResizeStart(event, 'w')}
            style={{ marginLeft: '-4px', touchAction: 'none' }}
          />
          <div
            className="resize-handle absolute right-0 top-1/2 -translate-y-1/2 w-2 h-12 cursor-e-resize"
            onPointerDown={(event) => handleResizeStart(event, 'e')}
            style={{ marginRight: '-4px', touchAction: 'none' }}
          />
        </>
      ) : (
        <div
          className="resize-handle absolute top-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-[#A8C9B8] rounded-full cursor-ns-resize"
          onPointerDown={(event) => handleResizeStart(event, 'n')}
          style={{ touchAction: 'none' }}
        />
      )}

      {/* Pointer/Tail */}
      {renderPointer()}

      {/* Header */}
      <div className={headerClassName}>
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
