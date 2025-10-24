import React from 'react';
import Lottie from 'lottie-react';
import { useTimer } from 'react-timer-hook';
import { useParams } from 'react-router-dom';
import { getInstructions } from '../../api/instructionApi';

// --- Mock Data ---
const mockInstructions = [
  {
    heading: 'Chop your vegetables',
    description: 'Wash and dry your vegetables, then chop them into bite-sized pieces using a big knife. Aim for even sizes so they cook uniformly.',
    animationFile: 'big_knife.json'
  },
  {
    heading: 'Start the pan and heat some oil',
    description: 'Place a large pan on medium-high heat and add a drizzle of olive oil. Wait until it shimmers — this means it’s hot enough to start cooking.',
    animationFile: 'fire_in_pan.json'
  },
  {
    heading: 'Fry the vegetables',
    description: 'Add your chopped vegetables to the hot pan. Fry them for a few minutes until they start to soften and get a light golden color.',
    animationFile: 'fry_in_pan.json'
  },
  {
    heading: 'Let it cook and stir occasionally',
    description: 'Lower the heat slightly, cover partially, and let the veggies cook through while stirring every couple of minutes to prevent sticking.',
    animationFile: 'let_cook_and_stirr.json',
    timer: 300
  },
  {
    heading: 'Steam for tenderness',
    description: 'Add a splash of water and cover the pan fully with a lid to trap steam. Let it steam for 3–5 minutes until everything is tender and fragrant.',
    animationFile: 'steaming_with_lid.json',
    timer: 240
  },
  {
    heading: 'Combine with cooked pasta and bake',
    description: 'Mix your cooked pasta with the veggies, toss everything with a bit of cheese or sauce, and transfer to a baking dish. Bake in a preheated oven until bubbling and golden.',
    animationFile: 'oven_convect.json'
  },
  {
    heading: 'Reheat leftovers easily',
    description: 'If you have leftovers, place a portion in the microwave and heat until warm throughout. Perfect for an easy next-day meal!',
    animationFile: 'microwave.json'
  }
];

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

// --- Timer Component ---
const Timer = ({ expiryTimestamp, timerSeconds }) => {
  const {
    seconds,
    minutes,
    hours,
    isRunning,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp,
    onExpire: () => console.warn('Timer expired'),
  });

  const handleReset = () => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + timerSeconds);
    restart(time, false);
  };

  const handleStart = () => {
    if (!isRunning) {
      resume();
    }
  };

  const handlePause = () => {
    pause();
  };

  // Format time with leading zeros
  const formatTime = (value) => String(value).padStart(2, '0');

  return (
    <div className="mt-4 bg-white p-4 sm:p-5 rounded-xl border-2 border-[#FF9B7B] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      {/* Time Display - Left Side (or Top on mobile) */}
      <div className="flex flex-col">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2D2D2D] font-mono tracking-wide">
          {hours > 0 && <span>{formatTime(hours)}:</span>}
          <span>{formatTime(minutes)}</span>
          <span>:</span>
          <span>{formatTime(seconds)}</span>
        </div>
        <div className="mt-1 text-xs text-[#FF9B7B] font-medium uppercase tracking-wide">
          {isRunning ? '⏱ Running' : '⏸ Paused'}
        </div>
      </div>

      {/* Buttons - Right Side (or Bottom on mobile) */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className={`
            px-3 sm:px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wide
            transition-all duration-200 flex-1 sm:flex-none
            ${isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#035035] text-white hover:bg-[#024028] hover:scale-105 active:scale-95'
            }
          `}
        >
          ▶ Start
        </button>

        <button
          onClick={handlePause}
          disabled={!isRunning}
          className={`
            px-3 sm:px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wide
            transition-all duration-200 flex-1 sm:flex-none
            ${!isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#FF9B7B] text-white hover:bg-[#FF8B6B] hover:scale-105 active:scale-95'
            }
          `}
        >
          ⏸ Pause
        </button>

        <button
          onClick={handleReset}
          className="
            px-3 sm:px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wide
            transition-all duration-200 flex-1 sm:flex-none
            bg-white text-[#FF9B7B] hover:bg-[#FFF8F0] hover:scale-105 active:scale-95
            border-2 border-[#FF9B7B]
          "
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
};

// --- Build Instruction Content ---
const buildInstructionContent = (instruction) => {
  const { heading, description, timer } = instruction;

  // Create timer expiry timestamp if timer is provided
  let timerExpiryTimestamp = null;
  if (timer) {
    const time = new Date();
    time.setSeconds(time.getSeconds() + timer);
    timerExpiryTimestamp = time;
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-white rounded-2xl shadow-md">
      <h3 className="text-lg sm:text-xl md:text-xl font-semibold text-[#2D2D2D] mb-2">{heading}</h3>
      <p className="text-sm sm:text-base text-[#2D2D2D] mb-4">{description}</p>
      {timer && (
        <Timer expiryTimestamp={timerExpiryTimestamp} timerSeconds={timer} />
      )}
    </div>
  );
};

// --- StepDiv Component ---
const StepDiv = React.forwardRef(({ instruction, content, index, circleRef, circleRadius }, ref) => {
  // Alternate positioning: even steps at 0px, odd steps vary by screen size
  const marginLeftClass = index % 2 === 0 ? 'ml-0' : 'ml-0 sm:ml-12 md:ml-20 lg:ml-24';

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 sm:gap-4 md:gap-6 p-2 sm:p-3 md:p-4 ${marginLeftClass}`}
    >
      <div ref={circleRef}>
        <StepCircle animationFile={instruction.animationFile} circleRadius={circleRadius} />
      </div>
      <div className="flex-1">
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
          {instructions.map((instruction, index) => (
            <StepDiv
              key={index}
              ref={(el) => (stepRefs.current[index] = el)}
              circleRef={(el) => (circleRefs.current[index] = el)}
              instruction={instruction}
              content={buildInstructionContent(instruction)}
              index={index}
              circleRadius={circleRadius}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CookingInstructions;