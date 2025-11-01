import React from 'react';
import Lottie from 'lottie-react';
import { useParams } from 'react-router-dom';
import { getInstructions } from '../../api/instructionApi';
import { startCookingSession } from '../../api/cookingApi';
import WakeWordDetection from '../../components/WakeWordDetection';
import AnimatedTimer from './Instructions/AnimatedTimer';
import AnimatingTimerPortal from './Instructions/AnimatingTimerPortal';
import ChatContainer from './Instructions/ChatContainer';
import { useTranslation } from 'react-i18next'

 // --- Configuration ---
const CURVE_AMOUNT = 180;

// Calculate responsive circle radius based on viewport width
const getCircleRadius = () => {
  const width = window.innerWidth;
  // Base size: 36px for mobile (320px), scales up to 60px for large screens (1920px)
  const minRadius = 36;
  const maxRadius = 60;
  const minWidth = 320;
  const maxWidth = 1920;

  const radius = minRadius + ((width - minWidth) / (maxWidth - minWidth)) * (maxRadius - minRadius);
  return Math.max(minRadius, Math.min(maxRadius, radius));
};

// --- StepCircle Component ---
const StepCircle = ({ animationFile, circleRadius }) => {
  const [animationData, setAnimationData] = React.useState(null);

  React.useEffect(() => {
    fetch(`/lottie-animations/${animationFile}`)
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Error loading Lottie animation:", error));
  }, [animationFile]);

  return (
    <div
      className="relative flex-shrink-0 rounded-full border-[0px] border-[#035035] bg-[#FFF8F0]"
      style={{
        width: `${circleRadius * 2}px`,
        height: `${circleRadius * 2}px`
      }}
    >
      <div className="absolute inset-2">
        {animationData && (
          <Lottie
            animationData={animationData}
            loop={true}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

// --- AI Question Button Component ---
const AIQuestionButton = ({ onClick, isFocused }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  if (!isFocused) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute top-4 right-4 flex items-center gap-2 border border-gray-100 hover:border-gray-300 bg-white/50 hover:bg-white/90 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer z-10 px-2 py-2"
    >
      <span className="text-xl flex-shrink-0">✨</span>
      <span
        className="overflow-hidden transition-all duration-300 text-sm font-medium whitespace-nowrap text-[#2D2D2D]"
        style={{
          maxWidth: isHovered ? '80px' : '0',
          opacity: isHovered ? 1 : 0
        }}
      >
        AI Fragen
      </span>
    </button>
  );
};

// --- Build Instruction Content ---
const buildInstructionContent = (instruction, stepIndex, timerData, handlers, isFocused) => {
  const { heading, description, timer } = instruction;

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-white rounded-2xl shadow-md relative">
      <AIQuestionButton onClick={handlers.onOpenChat} isFocused={isFocused} />
      <h3 className="text-lg sm:text-xl md:text-xl font-semibold text-[#2D2D2D] mb-2">{heading}</h3>
      <p className="text-sm sm:text-base text-[#2D2D2D] mb-4">{description}</p>
      {timer && timerData && !timerData.isFloating && (
        <div style={{
          opacity: timerData.isHidden ? 0 : 1,
          pointerEvents: timerData.isHidden ? 'none' : 'auto'
        }}>
          <AnimatedTimer
            stepIndex={stepIndex}
            heading={heading}
            timerSeconds={timer}
            isFloating={false}
            isExpanded={false}
            onStartFloating={handlers.onStartFloating}
            onReturnToStep={handlers.onReturnToStep}
            onExpand={handlers.onExpand}
            timerRef={timerData.timerRef}
          />
        </div>
      )}
    </div>
  );
};

// --- StepDiv Component ---
const StepDiv = React.forwardRef(({ instruction, content, index, circleRef, circleRadius, isFocused, onClick }, ref) => {
  // Alternate positioning: even steps at 0px, odd steps vary by screen size
  const marginLeftClass = index % 2 === 0 ? 'ml-0' : 'ml-0 sm:ml-12 md:ml-20 lg:ml-24';

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 sm:gap-4 md:gap-6 p-2 sm:p-3 md:p-4 ${marginLeftClass} transition-all duration-300 ${!isFocused ? 'opacity-40 grayscale cursor-pointer' : 'opacity-100'}`}
      onClick={onClick}
    >
      <div ref={circleRef} className="cursor-pointer">
        <StepCircle animationFile={instruction.animationFile} circleRadius={circleRadius} />
      </div>
      <div className="flex-1 cursor-pointer">
        {content}
      </div>
    </div>
  );
});

// --- Main Component ---
const CookingInstructions = ({
  instructions: instructionsProp
}) => {
  const { t } = useTranslation(['pages']);
  const { recipeId } = useParams();
  const [instructions, setInstructions] = React.useState(instructionsProp || null);
  const [loading, setLoading] = React.useState(!instructionsProp);
  const [error, setError] = React.useState(null);
  const [stepPositions, setStepPositions] = React.useState([]);
  const [circleRadius, setCircleRadius] = React.useState(getCircleRadius());
  const stepRefs = React.useRef([]);
  const circleRefs = React.useRef([]);
  const containerRef = React.useRef(null);
  const pollIntervalRef = React.useRef(null);
  const [focusedStep, setFocusedStep] = React.useState(0);

  // Cooking session state
  const [cookingSessionId, setCookingSessionId] = React.useState(null);

  // Timer state management
  // Track which step timers are floating and which is expanded
  const [floatingTimerSteps, setFloatingTimerSteps] = React.useState([]); // Array of step indices
  const [expandedTimerStep, setExpandedTimerStep] = React.useState(null); // Only one can be expanded
  const [animatingTimers, setAnimatingTimers] = React.useState([]); // Timers currently animating
  const [hiddenTimers, setHiddenTimers] = React.useState([]); // Timers hidden during animation
  const timerRefs = React.useRef({});

  // Chat state management
  const [openChatStep, setOpenChatStep] = React.useState(null);
  const [chatStepPosition, setChatStepPosition] = React.useState(null);
  const [savedChatConfig, setSavedChatConfig] = React.useState(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('piatto_chat_config');
      return saved ? JSON.parse(saved) : { position: null, size: null };
    } catch {
      return { position: null, size: null };
    }
  });

  // Handle opening chat for a step
  const handleOpenChat = React.useCallback((stepIndex) => {
    setOpenChatStep(stepIndex);
  }, []);

  // Handle closing chat
  const handleCloseChat = React.useCallback(() => {
    setOpenChatStep(null);
    setChatStepPosition(null);
  }, []);

  // Handle saving chat position and size
  const handleSaveChatConfig = React.useCallback((position, size) => {
    const config = { position, size };
    setSavedChatConfig(config);
    // Save to localStorage for persistence
    try {
      localStorage.setItem('piatto_chat_config', JSON.stringify(config));
    } catch (err) {
      console.error('Failed to save chat config to localStorage:', err);
    }
  }, []);

  // Track step position for chat pointer
  React.useEffect(() => {
    if (openChatStep === null) return;

    const updateStepPosition = () => {
      const circleEl = circleRefs.current[openChatStep];
      if (!circleEl) return;

      const rect = circleEl.getBoundingClientRect();
      setChatStepPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    };

    // Initial position
    updateStepPosition();

    // Update on scroll and resize
    window.addEventListener('scroll', updateStepPosition, true);
    window.addEventListener('resize', updateStepPosition);

    return () => {
      window.removeEventListener('scroll', updateStepPosition, true);
      window.removeEventListener('resize', updateStepPosition);
    };
  }, [openChatStep]);

  // Handle timer starting to float
  const handleStartFloating = React.useCallback((stepIndex) => {
    // Get positions for animation
    const stepTimerEl = timerRefs.current[stepIndex];
    if (!stepTimerEl) {
      // Fallback: instant transition
      setFloatingTimerSteps((prev) => {
        if (prev.includes(stepIndex)) return prev;
        return [...prev, stepIndex];
      });
      setExpandedTimerStep(stepIndex);
      return;
    }

    const fromRect = stepTimerEl.getBoundingClientRect();

    // Hide the original timer during animation
    setHiddenTimers((prev) => [...prev, stepIndex]);

    // Calculate target position (top-right corner)
    // Use responsive widths
    const containerWidth = window.innerWidth < 640 ? 288 : window.innerWidth < 768 ? 320 : 384; // w-72, w-80, w-96
    const toRect = {
      left: window.innerWidth - containerWidth - 16, // width minus padding
      top: 16 + (floatingTimerSteps.length * 50), // stack vertically with gap
      width: containerWidth,
      height: 120 // Approximate compact height
    };

    // Add to animating timers
    const animationId = `anim-${stepIndex}-${Date.now()}`;
    setAnimatingTimers((prev) => [
      ...prev,
      {
        id: animationId,
        stepIndex,
        fromRect,
        toRect,
        isCompacting: true
      }
    ]);

    // After animation completes, show in floating state
    setTimeout(() => {
      setAnimatingTimers((prev) => prev.filter((t) => t.id !== animationId));
      setHiddenTimers((prev) => prev.filter((idx) => idx !== stepIndex));
      setFloatingTimerSteps((prev) => {
        if (prev.includes(stepIndex)) return prev;
        return [...prev, stepIndex];
      });
      setExpandedTimerStep(stepIndex);
    }, 600); // Match animation duration
  }, [floatingTimerSteps]);

  // Handle timer returning to step
  const handleReturnToStep = React.useCallback((stepIndex) => {
    // Simply remove from floating and show back in step - no animation
    setFloatingTimerSteps((prev) => prev.filter((idx) => idx !== stepIndex));
    if (expandedTimerStep === stepIndex) {
      setExpandedTimerStep(null);
    }
  }, [expandedTimerStep]);

  // Handle expanding a collapsed timer
  const handleExpandTimer = React.useCallback((stepIndex) => {
    setExpandedTimerStep(stepIndex);
  }, []);

  // Handle step click with smooth scroll to center
  const handleStepClick = React.useCallback((index) => {
    setFocusedStep(index);
    // Close chat when switching steps
    setOpenChatStep(null);

    // Scroll the step to center of viewport
    const stepElement = stepRefs.current[index];
    if (stepElement) {
      // Find the scrollable parent container
      let scrollableParent = stepElement.parentElement;
      while (scrollableParent) {
        const style = window.getComputedStyle(scrollableParent);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          break;
        }
        scrollableParent = scrollableParent.parentElement;
      }

      // Use the scrollable parent or fall back to window
      const scrollContainer = scrollableParent || window;

      if (scrollContainer === window) {
        const elementRect = stepElement.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
        window.scrollTo({
          top: middle,
          behavior: 'smooth'
        });
      } else {
        // Scroll within the container
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = stepElement.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        const middle = scrollContainer.scrollTop + relativeTop - (containerRect.height / 2) + (elementRect.height / 2);

        scrollContainer.scrollTo({
          top: middle,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  // Start cooking session when recipeId is available
  React.useEffect(() => {
    const startSession = async () => {
      if (!recipeId) return;

      try {
        const sessionId = await startCookingSession(parseInt(recipeId, 10));
        setCookingSessionId(sessionId);
      } catch (err) {
        console.error('Failed to start cooking session:', err);
      }
    };

    startSession();
  }, [recipeId]);

  // Fetch instructions with polling logic
  React.useEffect(() => {
    // Don't fetch if instructions were provided as prop or no recipeId
    if (instructionsProp || !recipeId) {
      return;
    }

    const fetchInstructions = async () => {
      try {
        const data = await getInstructions(recipeId);
        // Transform API response to match expected format
        const transformedInstructions = data.map(step => ({
          heading: step.heading,
          description: step.description,
          animationFile: step.animation,
          timer: step.timer
        }));

        setInstructions(transformedInstructions);
        setLoading(false);
        setError(null);

        // Clear polling interval once instructions are fetched
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } catch (err) {
        // If 404, instructions don't exist yet - continue polling
        if (err.response?.status === 404) {
          console.log('Instructions not ready yet, will retry...');
        } else {
          // Other errors - stop polling and show error
          console.error('Error fetching instructions:', err);
          setError(t('instructions.errorLoading', 'Failed to load instructions. Please try again.'));
          setLoading(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }
    };

    // Initial fetch
    fetchInstructions();

    // Set up polling every 2 seconds
    pollIntervalRef.current = setInterval(fetchInstructions, 2000);

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [recipeId, instructionsProp]);

  // Center first step on initial load
  React.useEffect(() => {
    if (instructions && stepRefs.current[0]) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        handleStepClick(0);
      }, 200);
    }
  }, [instructions, handleStepClick]);

  // Calculate circle positions for the SVG paths
  React.useEffect(() => {
    const calculatePositions = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const positions = [];
      const currentRadius = getCircleRadius();
      setCircleRadius(currentRadius);

      circleRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          const relativeLeft = rect.left - containerRect.left;

          // Center of the circle
          const centerX = relativeLeft + currentRadius;
          const centerY = relativeTop + currentRadius;

          positions.push({
            id: index + 1,
            x: centerX,
            y: centerY
          });
        }
      });

      setStepPositions(positions);
    };

    calculatePositions();
    window.addEventListener('resize', calculatePositions);

    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(calculatePositions, 100);

    return () => window.removeEventListener('resize', calculatePositions);
  }, [instructions]);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-[#FFF8F0] min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#A8C9B8] border-t-[#035035]"></div>
          </div>
          <h2 className="font-['Poppins',_sans-serif] font-bold text-[#035035] text-2xl sm:text-3xl mb-3">
            {t('instructions.generating', 'Generating Instructions...')}
          </h2>
          <p className="text-[#2D2D2D] opacity-75 text-sm sm:text-base">
            {t('instructions.generatingDescription', 'Our AI chef is preparing detailed cooking instructions for your recipe. This usually takes just a few moments.')}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-[#FFF8F0] min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 text-6xl">⚠️</div>
          <h2 className="font-['Poppins',_sans-serif] font-bold text-[#FF9B7B] text-2xl sm:text-3xl mb-3">
            {t('instructions.errorTitle', 'Oops! Something went wrong')}
          </h2>
          <p className="text-[#2D2D2D] opacity-75 text-sm sm:text-base">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Show instructions
  return (
    <div className="bg-[#FFF8F0] min-h-full w-full flex flex-col items-center p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-8 text-center">
        <h1 className="font-['Poppins',_sans-serif] font-bold text-[#2D2D2D] text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem]">
          {t('instructions.title', 'Cooking Instructions')}
        </h1>
        <p className="text-[#2D2D2D] mt-3 sm:mt-4 max-w-lg text-sm sm:text-base">
          {t('instructions.subtitle', 'Follow the steps along the path to complete your recipe.')}
        </p>
      </div>

      {/* Wake Word Detection Module */}
      <div className="w-full max-w-4xl mb-6">
        <WakeWordDetection />
      </div>

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className="w-full max-w-4xl relative"
      >
        {/* SVG Layer for connecting paths */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {stepPositions.map((step, index) => {
            const nextStep = stepPositions[index + 1];
            if (!nextStep) return null;

            return (
              <path
                key={step.id}
                d={`M ${step.x} ${step.y} C ${step.x} ${step.y + CURVE_AMOUNT}, ${nextStep.x} ${nextStep.y - CURVE_AMOUNT}, ${nextStep.x} ${nextStep.y}`}
                stroke="#A8C9B8"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="10 12"
              />
            );
          })}
        </svg>

        {/* StepDivs */}
        <div
          className="relative flex flex-col gap-6 sm:gap-8 md:gap-10"
          style={{ zIndex: 1 }}
        >
          {instructions.map((instruction, index) => {
            const isFloating = floatingTimerSteps.includes(index);
            const isExpanded = expandedTimerStep === index;
            const isHidden = hiddenTimers.includes(index);

            const timerData = instruction.timer ? {
              isFloating,
              isExpanded,
              isHidden,
              timerRef: (el) => {
                if (el) timerRefs.current[index] = el;
              }
            } : null;

            const handlers = {
              onStartFloating: handleStartFloating,
              onReturnToStep: handleReturnToStep,
              onExpand: () => handleExpandTimer(index),
              onOpenChat: () => handleOpenChat(index)
            };

            return (
              <StepDiv
                key={index}
                ref={(el) => (stepRefs.current[index] = el)}
                circleRef={(el) => (circleRefs.current[index] = el)}
                instruction={instruction}
                content={buildInstructionContent(instruction, index, timerData, handlers, focusedStep === index)}
                index={index}
                circleRadius={circleRadius}
                isFocused={focusedStep === index}
                onClick={() => handleStepClick(index)}
              />
            );
          })}
        </div>
      </div>

      {/* Floating Timers Container */}
      {floatingTimerSteps.length > 0 && (
        <div className="fixed top-4 right-4 z-50 w-72 sm:w-80 md:w-96 flex flex-col gap-2">
          {/* Render floating timers - newest at bottom */}
          {floatingTimerSteps.map((stepIndex) => {
            const instruction = instructions[stepIndex];
            if (!instruction || !instruction.timer) return null;

            const isExpanded = expandedTimerStep === stepIndex;

            return (
              <AnimatedTimer
                key={stepIndex}
                stepIndex={stepIndex}
                heading={instruction.heading}
                timerSeconds={instruction.timer}
                isFloating={true}
                isExpanded={isExpanded}
                onStartFloating={handleStartFloating}
                onReturnToStep={handleReturnToStep}
                onExpand={() => handleExpandTimer(stepIndex)}
                timerRef={(el) => {
                  if (el) timerRefs.current[`floating-${stepIndex}`] = el;
                }}
              />
            );
          })}
        </div>
      )}

      {/* Animating Timers Portal */}
      <AnimatingTimerPortal timers={animatingTimers} instructions={instructions} />

      {/* Chat Container */}
      {openChatStep !== null && chatStepPosition && cookingSessionId && (
        <ChatContainer
          stepIndex={openChatStep}
          stepHeading={instructions[openChatStep]?.heading}
          stepPosition={chatStepPosition}
          onClose={handleCloseChat}
          cookingSessionId={cookingSessionId}
          onSaveConfig={handleSaveChatConfig}
          initialPosition={(() => {
            // Use saved position if available, otherwise calculate default
            if (savedChatConfig.position) {
              return savedChatConfig.position;
            }

            // Calculate initial position to the left of the step
            const stepEl = stepRefs.current[openChatStep];
            if (!stepEl) return { x: 100, y: 100 };

            const rect = stepEl.getBoundingClientRect();
            // Position to the left of the step, with some padding
            return {
              x: Math.max(20, rect.left - 420), // 400px width + 20px gap
              y: Math.max(20, rect.top - 50)
            };
          })()}
          initialSize={savedChatConfig.size || { width: 400, height: 500 }}
        />
      )}
    </div>
  );
};

export default CookingInstructions;