import React from 'react';
import Lottie from 'lottie-react';
import { useParams } from 'react-router-dom';
import { getInstructions } from '../../api/instructionApi';
import {
  startCookingSession,
  updateCookingState,
  finishCookingSession,
  getCookingSession,
  getStoredCookingSessionId,
  clearStoredCookingSessionId
} from '../../api/cookingApi';
import WakeWordDetection from '../../components/WakeWordDetection';
import AnimatedTimer from './Instructions/AnimatedTimer';
import AnimatingTimerPortal from './Instructions/AnimatingTimerPortal';
import ChatContainer from './Instructions/ChatContainer';
import { useTranslation } from 'react-i18next'
import useMediaQuery from '../../hooks/useMediaQuery';

 // --- Configuration ---
const CURVE_AMOUNT = 180;
const MOBILE_NAV_HEIGHT = 64;

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
const AIQuestionButton = ({ onClick, isFocused, isEnabled }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  if (!isFocused || !isEnabled) return null;

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
const buildInstructionContent = (instruction, stepIndex, timerData, handlers, isFocused, canOpenChat) => {
  const { heading, description, timer } = instruction;

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-white rounded-2xl shadow-md relative">
      <AIQuestionButton onClick={handlers.onOpenChat} isFocused={isFocused} isEnabled={canOpenChat} />
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
const StepDiv = React.forwardRef(({ instruction, content, index, circleRef, circleRadius, isFocused, hasActiveStep, isInteractive, onClick }, ref) => {
  // Alternate positioning: even steps at 0px, odd steps vary by screen size
  const marginLeftClass = index % 2 === 0 ? 'ml-0' : 'ml-0 sm:ml-12 md:ml-20 lg:ml-24';
  const dimClass = hasActiveStep && !isFocused ? 'opacity-40 grayscale' : 'opacity-100';
  const cursorClass = isInteractive ? 'cursor-pointer' : 'cursor-not-allowed';

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 sm:gap-4 md:gap-6 p-2 sm:p-3 md:p-4 ${marginLeftClass} transition-all duration-300 ${dimClass} ${cursorClass}`}
      onClick={isInteractive ? onClick : undefined}
    >
      <div ref={circleRef} className={cursorClass}>
        <StepCircle animationFile={instruction.animationFile} circleRadius={circleRadius} />
      </div>
      <div className={`flex-1 ${cursorClass}`}>
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
  const [focusedStep, setFocusedStep] = React.useState(null);

  // Cooking session state
  const [cookingSessionId, setCookingSessionId] = React.useState(null);
  const [sessionFinished, setSessionFinished] = React.useState(false);
  const [sessionRestored, setSessionRestored] = React.useState(false);
  const [isSessionStarting, setIsSessionStarting] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isFinishingSession, setIsFinishingSession] = React.useState(false);
  const [sessionError, setSessionError] = React.useState(null);
  const [navigationError, setNavigationError] = React.useState(null);
  const previousSyncedStep = React.useRef(null);
  const sessionActive = Boolean(cookingSessionId) && !sessionFinished;
  const hasActiveStep = focusedStep !== null;
  const totalSteps = instructions?.length ?? 0;
  const isLastStep = hasActiveStep && totalSteps > 0 ? focusedStep === totalSteps : false;
  const navigationBusy = isNavigating || isFinishingSession;

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
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileLayoutMetrics, setMobileLayoutMetrics] = React.useState({
    chatHeight: 0,
    navHeight: MOBILE_NAV_HEIGHT
  });
  const handleMobileLayoutMetrics = React.useCallback((metrics) => {
    if (!metrics) {
      setMobileLayoutMetrics((prev) => {
        if (prev.chatHeight === 0 && prev.navHeight === MOBILE_NAV_HEIGHT) {
          return prev;
        }
        return { chatHeight: 0, navHeight: MOBILE_NAV_HEIGHT };
      });
      return;
    }

    const next = {
      chatHeight: metrics.chatHeight ?? 0,
      navHeight: metrics.navHeight ?? MOBILE_NAV_HEIGHT
    };

    setMobileLayoutMetrics((prev) => {
      if (prev.chatHeight === next.chatHeight && prev.navHeight === next.navHeight) {
        return prev;
      }
      return next;
    });
  }, []);
  const mobileContentPadding = isMobile && openChatStep !== null
    ? mobileLayoutMetrics.chatHeight + mobileLayoutMetrics.navHeight + 32
    : undefined;

  // Handle opening chat for a step
  const handleOpenChat = React.useCallback((stepIndex) => {
    if (!sessionActive) {
      setSessionError(t('instructions.startPrompt', 'Bitte starte zuerst die Kochsession.'));
      return;
    }
    setSessionError(null);
    setOpenChatStep(stepIndex);
  }, [sessionActive, t]);

  // Handle closing chat
  const handleCloseChat = React.useCallback(() => {
    setOpenChatStep(null);
    setChatStepPosition(null);
    setMobileLayoutMetrics({ chatHeight: 0, navHeight: MOBILE_NAV_HEIGHT });
  }, []);

  React.useEffect(() => {
    if (openChatStep === null) {
      setMobileLayoutMetrics({ chatHeight: 0, navHeight: MOBILE_NAV_HEIGHT });
    }
  }, [openChatStep]);

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

  const scrollStepIntoView = React.useCallback((index) => {
    const stepElement = stepRefs.current[index];
    if (!stepElement) return;

    let scrollableParent = stepElement.parentElement;
    while (scrollableParent) {
      const style = window.getComputedStyle(scrollableParent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        break;
      }
      scrollableParent = scrollableParent.parentElement;
    }

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
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = stepElement.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top;
      const middle = scrollContainer.scrollTop + relativeTop - (containerRect.height / 2) + (elementRect.height / 2);

      scrollContainer.scrollTo({
        top: middle,
        behavior: 'smooth'
      });
    }
  }, []);

  const navigateToStep = React.useCallback(async (step, { scroll = true, sessionIdOverride } = {}) => {
    if (!instructions || step < 1 || step > instructions.length) {
      return;
    }

    console.log('🔄 Switching state:', { from: focusedStep, to: step });

    setSessionError(null);
    setNavigationError(null);
    setFocusedStep(step);
    setOpenChatStep(null);

    const arrayIndex = step - 1; // Convert 1-based to 0-based for array access

    if (scroll) {
      scrollStepIntoView(arrayIndex);
    }

    const sessionIdToUse = sessionIdOverride ?? cookingSessionId;

    if (sessionIdToUse && previousSyncedStep.current !== step) {
      setIsNavigating(true);
      try {
        await updateCookingState(sessionIdToUse, step);
        previousSyncedStep.current = step;
        console.log('✅ State updated successfully. Current state:', step);
      } catch (err) {
        console.error('Failed to update cooking state:', err);
        setNavigationError(t('instructions.syncError', 'Kochstatus konnte nicht aktualisiert werden. Bitte versuche es erneut.'));
      } finally {
        setIsNavigating(false);
      }
    }
  }, [instructions, cookingSessionId, scrollStepIntoView, t, focusedStep]);

  const handleStepClick = React.useCallback((index) => {
    if (!sessionActive) {
      setSessionError(t('instructions.startPrompt', 'Bitte starte zuerst die Kochsession.'));
      return;
    }

    navigateToStep(index + 1); // Convert 0-based array index to 1-based step
  }, [sessionActive, navigateToStep, t]);

  const handleStartCooking = React.useCallback(async () => {
    if (!recipeId || !instructions || instructions.length === 0) {
      return;
    }

    console.log('🚀 Starting cooking session. Initial state will be: 1');

    setSessionError(null);
    setNavigationError(null);
    setSessionFinished(false);
    setOpenChatStep(null);
    setChatStepPosition(null);
    setFloatingTimerSteps([]);
    setExpandedTimerStep(null);
    setAnimatingTimers([]);
    setHiddenTimers([]);
    timerRefs.current = {};
    previousSyncedStep.current = null;

    setIsSessionStarting(true);
    try {
      const sessionId = await startCookingSession(parseInt(recipeId, 10));
      setCookingSessionId(sessionId);
      console.log('✅ Cooking session started with ID:', sessionId);
      await navigateToStep(1, { sessionIdOverride: sessionId });
    } catch (err) {
      console.error('Failed to start cooking session:', err);
      setSessionError(t('instructions.startError', 'Die Kochsession konnte nicht gestartet werden. Bitte versuche es erneut.'));
    } finally {
      setIsSessionStarting(false);
    }
  }, [recipeId, instructions, navigateToStep, t]);

  const handlePreviousStep = React.useCallback(() => {
    if (!sessionActive || !hasActiveStep || focusedStep === 1) {
      return;
    }

    navigateToStep(focusedStep - 1);
  }, [sessionActive, hasActiveStep, focusedStep, navigateToStep]);

  const handleNextStep = React.useCallback(async () => {
    if (!sessionActive || !hasActiveStep) {
      setSessionError(t('instructions.startPrompt', 'Bitte starte zuerst die Kochsession.'));
      return;
    }

    if (totalSteps === 0) {
      return;
    }

    if (focusedStep >= totalSteps) {
      if (!cookingSessionId) {
        return;
      }

      setNavigationError(null);
      setIsFinishingSession(true);
      try {
        await finishCookingSession(cookingSessionId);
        setSessionFinished(true);
        setSessionError(null);
        setOpenChatStep(null);
        setChatStepPosition(null);
        setCookingSessionId(null);
        setFocusedStep(null);
        setFloatingTimerSteps([]);
        setExpandedTimerStep(null);
        setAnimatingTimers([]);
        setHiddenTimers([]);
        timerRefs.current = {};
        previousSyncedStep.current = null;
      } catch (err) {
        console.error('Failed to finish cooking session:', err);
        setNavigationError(t('instructions.finishError', 'Die Kochsession konnte nicht beendet werden.'));
      } finally {
        setIsFinishingSession(false);
      }
      return;
    }

    await navigateToStep(focusedStep + 1);
  }, [sessionActive, hasActiveStep, totalSteps, focusedStep, navigateToStep, cookingSessionId, t]);

  // Attempt to restore an existing session for this recipe
  React.useEffect(() => {
    if (!recipeId || !instructions || instructions.length === 0) {
      return;
    }

    if (sessionActive || sessionRestored) {
      return;
    }

    const storedSessionId = getStoredCookingSessionId();

    if (!storedSessionId && storedSessionId !== 0) {
      setSessionRestored(true);
      return;
    }

    let isCancelled = false;

    const restoreSession = async () => {
      try {
        const session = await getCookingSession(storedSessionId);
        if (isCancelled) {
          return;
        }

        if (!session || String(session.recipe_id) !== String(recipeId)) {
          clearStoredCookingSessionId();
          setSessionRestored(true);
          return;
        }

        const parsedState = Number(session.state);
        const safeState = Number.isFinite(parsedState) ? parsedState : 1;
        const clampedStep = Math.min(
          Math.max(safeState, 1),
          instructions.length
        );

        setCookingSessionId(session.id);
        setSessionFinished(false);
        setSessionError(null);
        setNavigationError(null);
        setOpenChatStep(null);
        previousSyncedStep.current = clampedStep;

        console.log('🔄 Restored cooking session. Session ID:', session.id, 'Initial state:', clampedStep);
        setFocusedStep(clampedStep);
        requestAnimationFrame(() => {
          scrollStepIntoView(clampedStep - 1); // Convert 1-based to 0-based for array access
        });
      } catch (err) {
        console.error('Failed to restore cooking session:', err);
        clearStoredCookingSessionId();
      } finally {
        if (!isCancelled) {
          setSessionRestored(true);
        }
      }
    };

    restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [recipeId, instructions, sessionActive, sessionRestored, scrollStepIntoView]);

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
  }, [recipeId, instructionsProp, t]);

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
    <div
      className="bg-[#FFF8F0] min-h-full w-full flex flex-col items-center p-3 sm:p-4 md:p-6"
      style={mobileContentPadding ? { paddingBottom: mobileContentPadding } : undefined}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-8 text-center">
        <h1 className="font-['Poppins',_sans-serif] font-bold text-[#2D2D2D] text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem]">
          {t('instructions.title', 'Cooking Instructions')}
        </h1>
        <p className="text-[#2D2D2D] mt-3 sm:mt-4 max-w-lg text-sm sm:text-base">
          {t('instructions.subtitle', 'Follow the steps along the path to complete your recipe.')}
        </p>
      </div>

        {/* Session Controls */}
        <div className="w-full max-w-4xl mb-6">
          {!sessionActive ? (
            <div className="bg-white border-2 border-[#A8C9B8] rounded-2xl px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
              <div className="flex-1 text-sm sm:text-base text-[#2D2D2D]">
                {t('instructions.startDescription', 'Starte die Kochsession, sobald du bereit bist loszulegen.')}
              </div>
              <button
                type="button"
                onClick={handleStartCooking}
                disabled={isSessionStarting || totalSteps === 0}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all duration-200 ${
                  isSessionStarting || totalSteps === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#035035] text-white hover:bg-[#024028] hover:scale-105 active:scale-95'
                }`}
              >
                {isSessionStarting ? t('instructions.starting', 'Starte...') : t('instructions.startButton', 'Start Cooking')}
              </button>
            </div>
          ) : (
            <div className="bg-white border-2 border-[#A8C9B8] rounded-2xl px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
              <div className="text-sm sm:text-base text-[#2D2D2D] font-medium">
                {t('instructions.currentStep', 'Aktueller Schritt')}: {hasActiveStep ? `${focusedStep}/${totalSteps}` : '—'}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={!hasActiveStep || focusedStep === 1 || navigationBusy}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !hasActiveStep || focusedStep === 1 || navigationBusy
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-white border-2 border-[#035035] text-[#035035] hover:bg-[#f1f9f5]'
                  }`}
                >
                  {t('instructions.previous', 'Zurück')}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!hasActiveStep || navigationBusy}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !hasActiveStep || navigationBusy
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#035035] text-white hover:bg-[#024028] hover:scale-105 active:scale-95'
                  }`}
                >
                  {navigationBusy
                    ? t('instructions.working', 'Bitte warten...')
                    : isLastStep
                      ? t('instructions.finish', 'Finish')
                      : t('instructions.next', 'Weiter')}
                </button>
              </div>
            </div>
          )}
          {(sessionError || navigationError || sessionFinished) && (
            <div className="mt-3 space-y-2">
              {sessionError && <p className="text-sm text-red-600">{sessionError}</p>}
              {navigationError && <p className="text-sm text-red-600">{navigationError}</p>}
              {sessionFinished && (
                <p className="text-sm text-green-700">
                  {t('instructions.finishedMessage', 'Kochsession abgeschlossen – guten Appetit!')}
                </p>
              )}
            </div>
          )}
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
                content={buildInstructionContent(instruction, index, timerData, handlers, focusedStep === index + 1, sessionActive)}
                index={index}
                circleRadius={circleRadius}
                isFocused={focusedStep === index + 1}
                hasActiveStep={hasActiveStep}
                isInteractive={sessionActive}
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
          isMobile={isMobile}
          onMobileHeightChange={handleMobileLayoutMetrics}
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