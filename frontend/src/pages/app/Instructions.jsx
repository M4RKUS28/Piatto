import React from 'react';
import Lottie from 'lottie-react';
import { useParams } from 'react-router-dom';
import { getInstructions } from '../../api/instructionApi';
import AnimatedTimer from './Instructions/AnimatedTimer';

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

// --- Build Instruction Content ---
const buildInstructionContent = (instruction, stepIndex, timerData, handlers) => {
  const { heading, description, timer } = instruction;

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-white rounded-2xl shadow-md">
      <h3 className="text-lg sm:text-xl md:text-xl font-semibold text-[#2D2D2D] mb-2">{heading}</h3>
      <p className="text-sm sm:text-base text-[#2D2D2D] mb-4">{description}</p>
      {timer && timerData && !timerData.isFloating && (
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
      )}
      {timer && timerData && timerData.isFloating && (
        <div className="mt-4 h-24 sm:h-28">
          {/* Empty space placeholder when timer is floating */}
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

  // Timer state management
  // Track which step timers are floating and which is expanded
  const [floatingTimerSteps, setFloatingTimerSteps] = React.useState([]); // Array of step indices
  const [expandedTimerStep, setExpandedTimerStep] = React.useState(null); // Only one can be expanded
  const timerRefs = React.useRef({});

  // Handle timer starting to float
  const handleStartFloating = React.useCallback((stepIndex) => {
    setFloatingTimerSteps((prev) => {
      if (prev.includes(stepIndex)) return prev;
      return [...prev, stepIndex];
    });
    // New timer is always expanded, collapse others
    setExpandedTimerStep(stepIndex);
  }, []);

  // Handle timer returning to step
  const handleReturnToStep = React.useCallback((stepIndex) => {
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
          setError('Failed to load instructions. Please try again.');
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
            Generating Instructions...
          </h2>
          <p className="text-[#2D2D2D] opacity-75 text-sm sm:text-base">
            Our AI chef is preparing detailed cooking instructions for your recipe. This usually takes just a few moments.
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
            Oops! Something went wrong
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
          Cooking Instructions
        </h1>
        <p className="text-[#2D2D2D] mt-3 sm:mt-4 max-w-lg text-sm sm:text-base">
          Follow the steps along the path to complete your recipe.
        </p>
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

            const timerData = instruction.timer ? {
              isFloating,
              isExpanded,
              timerRef: (el) => {
                if (el) timerRefs.current[index] = el;
              }
            } : null;

            const handlers = {
              onStartFloating: handleStartFloating,
              onReturnToStep: handleReturnToStep,
              onExpand: () => handleExpandTimer(index)
            };

            return (
              <StepDiv
                key={index}
                ref={(el) => (stepRefs.current[index] = el)}
                circleRef={(el) => (circleRefs.current[index] = el)}
                instruction={instruction}
                content={buildInstructionContent(instruction, index, timerData, handlers)}
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
    </div>
  );
};

export default CookingInstructions;