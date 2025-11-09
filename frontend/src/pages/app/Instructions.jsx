import React from 'react';
import Lottie from 'lottie-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInstructions } from '../../api/instructionApi';
import {
  startCookingSession,
  updateCookingState,
  finishCookingSession,
  getCookingSession,
  getStoredCookingSessionId,
  clearStoredCookingSessionId
} from '../../api/cookingApi';
import SessionStartDialog from '../../components/SessionStartDialog';
import AnimatedTimer from './Instructions/AnimatedTimer';
import AnimatingTimerPortal from './Instructions/AnimatingTimerPortal';
import ChatContainer from './Instructions/ChatContainer';
import TimerProgressBar from './Instructions/TimerProgressBar';
import { useTranslation } from 'react-i18next'
import useMediaQuery from '../../hooks/useMediaQuery';
import useWakeWordDetection from '../../hooks/useWakeWordDetection';
import { unlockAudio } from '../../utils/audioContext';

 // --- Configuration ---
const CURVE_AMOUNT = 180;
const MOBILE_NAV_HEIGHT = 64;
const VOICE_PREFERENCE_STORAGE_KEY = 'piatto_voice_assistant_preference';

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
const StepCircle = ({ animationFile, circleRadius, isDimmed = false }) => {
  const [animationData, setAnimationData] = React.useState(null);

  React.useEffect(() => {
    fetch(`/lottie-animations/${animationFile}`)
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Error loading Lottie animation:", error));
  }, [animationFile]);

  return (
    <div
      className="relative flex-shrink-0 rounded-full border-[0px] border-[#035035] bg-[#FFF8F0] transition-all duration-300"
      style={{
        width: `${circleRadius * 2}px`,
        height: `${circleRadius * 2}px`,
        opacity: isDimmed ? 0.4 : 1,
        filter: isDimmed ? 'grayscale(100%)' : 'none'
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
const AIQuestionButton = React.forwardRef(({ onClick, isFocused, isEnabled }, ref) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { t } = useTranslation('instructions');

  if (!isFocused || !isEnabled) return null;

  return (
    <button
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute top-4 right-4 flex items-center gap-2 border border-gray-100 hover:border-gray-300 bg-white/50 hover:bg-white/90 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer z-10 px-2 py-1"
      aria-label={t('aiButtonAria', 'Ask the AI for help')}
      title={t('aiButtonAria', 'Ask the AI for help')}
    >
      <span className="text-xl flex-shrink-0">✨</span>
      <span
        className="overflow-hidden transition-all duration-300 text-sm font-medium whitespace-nowrap text-[#2D2D2D]"
        style={{
          maxWidth: isHovered ? '80px' : '0',
          opacity: isHovered ? 1 : 0
        }}
      >
        {t('aiButtonLabel', 'Ask AI')}
      </span>
    </button>
  );
});

// --- Build Instruction Content ---
const buildInstructionContent = (instruction, stepIndex, timerData, handlers, isFocused, canOpenChat, timerState, aiButtonRef) => {
  const { heading, description, timer } = instruction;

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-white rounded-2xl shadow-md relative">
      <AIQuestionButton ref={aiButtonRef} onClick={handlers.onOpenChat} isFocused={isFocused} isEnabled={canOpenChat} />
      <h3 className="text-lg sm:text-xl md:text-xl font-semibold text-[#2D2D2D] mb-2">{heading}</h3>
      <p className="text-sm sm:text-base text-[#2D2D2D] mb-4">{description}</p>

      {/* Show progress bar when timer is floating */}
      {timer && timerData?.isFloating && timerState && (
        <TimerProgressBar
          currentSeconds={timerState.currentSeconds}
          totalSeconds={timerState.totalSeconds}
          isRunning={timerState.isRunning}
        />
      )}

      {/* Show full timer when not floating */}
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
            onTimerUpdate={handlers.onTimerUpdate}
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
  const shouldDim = hasActiveStep && !isFocused;
  const cursorClass = isInteractive ? 'cursor-pointer' : 'cursor-not-allowed';

  return (
    <div
      ref={ref}
      className={`relative flex items-center gap-3 sm:gap-4 md:gap-6 p-2 sm:p-3 md:p-4 ${marginLeftClass} transition-all duration-300 ${cursorClass}`}
      onClick={isInteractive ? onClick : undefined}
    >
      <div ref={circleRef} className={cursorClass} style={{ position: 'relative' }}>
        {/* Background box to mask the SVG line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${circleRadius * 2}px`,
            height: `${circleRadius * 2}px`,
            backgroundColor: '#FFF8F0',
            borderRadius: '50%',
            zIndex: 5
          }}
        />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <StepCircle animationFile={instruction.animationFile} circleRadius={circleRadius} isDimmed={shouldDim} />
        </div>
      </div>
      <div className={`flex-1 ${cursorClass} ${shouldDim ? 'opacity-40 grayscale' : ''} transition-all duration-300`}>
        {content}
      </div>
    </div>
  );
});

// --- Main Component ---
const CookingInstructions = ({
  instructions: instructionsProp,
  recipeId: recipeIdProp,
  onRegisterSessionControls,
  onRegisterStepsArea,
  onRegisterAiButton,
}) => {
  const { t } = useTranslation(['instructions', 'pages']);
  const { recipeId: recipeIdFromParams } = useParams();
  const navigate = useNavigate();
  const recipeId = recipeIdProp ?? recipeIdFromParams;
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
  const sessionControlsRef = React.useRef(null);
  const aiButtonRef = React.useRef(null);

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
  const [isStartDialogOpen, setIsStartDialogOpen] = React.useState(false);
  const [startDialogMode, setStartDialogMode] = React.useState('new');
  const [, setVoicePreference] = React.useState(null);
  const [resumeVoicePrompted, setResumeVoicePrompted] = React.useState(false);
  const [isNewSessionStart, setIsNewSessionStart] = React.useState(false);
  const sessionSnapshotRef = React.useRef({ sessionActive: false, isLastStep: false, cookingSessionId: null });

  // Initialize voice assistant with cooking session ID
  const voiceAssistant = useWakeWordDetection(cookingSessionId);
  // Show as active when wake word detection is listening (not just when session active)
  const voiceAssistantActive = voiceAssistant?.isListening ?? false;
  const wakeWordSupported = voiceAssistant?.browserSupported !== false;
  const voiceAssistantBusy = Boolean(voiceAssistant?.assistantState && voiceAssistant.assistantState !== 'idle');

  // Debug: Log cookingSessionId changes
  React.useEffect(() => {
    console.log(`[Instructions] cookingSessionId changed:`, cookingSessionId, `sessionActive:`, sessionActive);
  }, [cookingSessionId, sessionActive]);

  // Ref to store voiceAssistant for cleanup without triggering re-renders
  const voiceAssistantRef = React.useRef(voiceAssistant);
  React.useEffect(() => {
    voiceAssistantRef.current = voiceAssistant;
  }, [voiceAssistant]);

  // Ref to track if voice assistant was already auto-started for this session
  const voiceAutoStartedRef = React.useRef(null);

  const resetSessionVisuals = React.useCallback(() => {
    setOpenChatStep(null);
    setChatStepPosition(null);
    setFloatingTimerSteps([]);
    setExpandedTimerStep(null);
    setAnimatingTimers([]);
    setHiddenTimers([]);
    setTimerStates({});
    timerRefs.current = {};
    previousSyncedStep.current = null;
  }, []);

  const startVoiceAssistant = React.useCallback(() => {
    voiceAssistant?.startListening?.();
  }, [voiceAssistant]);

  const stopVoiceAssistant = React.useCallback(() => {
    voiceAssistant?.stopListening?.();
  }, [voiceAssistant]);

  // Auto-start voice assistant when new session starts with voice preference
  React.useEffect(() => {
    // Only auto-start if this is a new session and we haven't started yet for this session
    if (isNewSessionStart && cookingSessionId && sessionActive && voiceAutoStartedRef.current !== cookingSessionId) {
      // Get voice preference from localStorage
      try {
        const savedPreference = localStorage.getItem(VOICE_PREFERENCE_STORAGE_KEY);
        if (savedPreference === 'with') {
          console.log('[Instructions] Auto-starting voice assistant for new session');
          // Mark this session as auto-started
          voiceAutoStartedRef.current = cookingSessionId;
          // Wait for next tick to ensure cookingSessionId is propagated to hook
          requestAnimationFrame(() => {
            startVoiceAssistant();
          });
        }
      } catch (err) {
        console.warn('Failed to read voice preference:', err);
      }
    }
  }, [isNewSessionStart, cookingSessionId, sessionActive, startVoiceAssistant]);

  React.useEffect(() => {
    if (!onRegisterSessionControls) {
      return undefined;
    }
    onRegisterSessionControls(sessionControlsRef.current);
    return () => {
      onRegisterSessionControls(null);
    };
  }, [onRegisterSessionControls, sessionActive, isSessionStarting]);

  React.useEffect(() => {
    if (!onRegisterStepsArea) {
      return undefined;
    }
    onRegisterStepsArea(containerRef.current);
    return () => {
      onRegisterStepsArea(null);
    };
  }, [onRegisterStepsArea, instructions]);

  React.useEffect(() => {
    if (!onRegisterAiButton) {
      return undefined;
    }
    onRegisterAiButton(aiButtonRef.current);
    return () => {
      onRegisterAiButton(null);
    };
  }, [onRegisterAiButton, focusedStep, sessionActive]);

  React.useEffect(() => {
    sessionSnapshotRef.current = {
      sessionActive,
      isLastStep,
      cookingSessionId,
    };
  }, [sessionActive, isLastStep, cookingSessionId]);

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      const snapshot = sessionSnapshotRef.current;
      if (snapshot.sessionActive && snapshot.isLastStep && snapshot.cookingSessionId) {
        try {
          fetch(`/api/cooking/${snapshot.cookingSessionId}/finish`, {
            method: 'DELETE',
            credentials: 'include',
            keepalive: true,
          }).catch(() => {});
        } catch (err) {
          console.warn('Failed to finish session on unload:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      const snapshot = sessionSnapshotRef.current;
      if (snapshot.sessionActive && snapshot.isLastStep && snapshot.cookingSessionId) {
        finishCookingSession(snapshot.cookingSessionId).catch(() => {});
      }
      // Use ref to avoid re-running cleanup on every render
      voiceAssistantRef.current?.stopListening?.();
    };
  }, []); // Empty deps = only runs on unmount

  // Timer state management
  // Track which step timers are floating and which is expanded
  const [floatingTimerSteps, setFloatingTimerSteps] = React.useState([]); // Array of step indices
  const [expandedTimerStep, setExpandedTimerStep] = React.useState(null); // Only one can be expanded
  const [animatingTimers, setAnimatingTimers] = React.useState([]); // Timers currently animating
  const [hiddenTimers, setHiddenTimers] = React.useState([]); // Timers hidden during animation
  const timerRefs = React.useRef({});
  // Track timer states for progress bars
  const [timerStates, setTimerStates] = React.useState({}); // Map of stepIndex -> timer state

  // Scroll-to-focus state management
  const scrollDeltaAccumulator = React.useRef(0);
  const scrollTimeout = React.useRef(null);
  const isAutoScrolling = React.useRef(false);
  const lastScrollTime = React.useRef(Date.now());

  // Scroll threshold: ~300px of scroll = 1 step change
  // This means 1-3 mouse wheel notches (~100px each) = 1 step
  // 4-6 wheel notches = 1-2 steps, etc.
  const SCROLL_THRESHOLD_PER_STEP = 300;

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
      setSessionError(t('startPrompt', 'Please start the cooking session first.'));
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

  // Handle timer state updates
  const handleTimerUpdate = React.useCallback((stepIndex, timerState) => {
    setTimerStates((prev) => ({
      ...prev,
      [stepIndex]: timerState
    }));
  }, []);

  const scrollStepIntoView = React.useCallback((index, isAuto = false) => {
    const stepElement = stepRefs.current[index];
    if (!stepElement) return;

    if (isAuto) {
      isAutoScrolling.current = true;
    }

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

    if (isAuto) {
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 600);
    }
  }, []);

  const navigateToStep = React.useCallback(async (step, { scroll = true, sessionIdOverride, isManual = true } = {}) => {
    if (!instructions || step < 1 || step > instructions.length) {
      return;
    }

    setSessionError(null);
    setNavigationError(null);
    setFocusedStep(step);
    setOpenChatStep(null);

    const arrayIndex = step - 1; // Convert 1-based to 0-based for array access

    if (scroll) {
      // If manual navigation (click or button), set auto-scroll flag to prevent interference
      scrollStepIntoView(arrayIndex, isManual);
    }

    const sessionIdToUse = sessionIdOverride ?? cookingSessionId;

    if (sessionIdToUse && previousSyncedStep.current !== step) {
      setIsNavigating(true);
      try {
        await updateCookingState(sessionIdToUse, step);
        previousSyncedStep.current = step;
      } catch (err) {
        console.error('Failed to update cooking state:', err);
        setNavigationError(t('syncError', 'Failed to update the cooking state. Please try again.'));
      } finally {
        setIsNavigating(false);
      }
    }
  }, [instructions, cookingSessionId, scrollStepIntoView, t]);

  // Handle wheel/scroll events for navigation
  const handleWheelNavigation = React.useCallback((event) => {
    if (!sessionActive || !focusedStep || !instructions || isAutoScrolling.current) {
      return;
    }

    // Only handle scroll events from the instructions container
    // Allow recipe view and other areas to scroll normally
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      return; // Scroll event is outside instructions - allow normal scrolling
    }

    // Prevent default scrolling behavior (only for instructions area)
    event.preventDefault();

    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTime.current;

    // Reset accumulator if it's been more than 500ms since last scroll
    if (timeSinceLastScroll > 500) {
      scrollDeltaAccumulator.current = 0;
    }

    lastScrollTime.current = now;

    // Accumulate scroll delta (works for mouse wheel, trackpad, etc.)
    scrollDeltaAccumulator.current += event.deltaY;

    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Calculate how many steps to move based on accumulated scroll
    const stepsToMove = Math.floor(Math.abs(scrollDeltaAccumulator.current) / SCROLL_THRESHOLD_PER_STEP);

    if (stepsToMove > 0) {
      const direction = scrollDeltaAccumulator.current > 0 ? 1 : -1; // 1 = down, -1 = up
      const targetStep = focusedStep + (direction * stepsToMove);

      // Clamp to valid step range
      const clampedStep = Math.max(1, Math.min(instructions.length, targetStep));

      if (clampedStep !== focusedStep) {
        // Reset accumulator
        scrollDeltaAccumulator.current = 0;

        // Navigate to new step
        navigateToStep(clampedStep, { scroll: true, isManual: false });
      }
    }

    // Reset accumulator after a short delay if no more scrolling
    scrollTimeout.current = setTimeout(() => {
      scrollDeltaAccumulator.current = 0;
    }, 500);
  }, [sessionActive, focusedStep, instructions, navigateToStep, SCROLL_THRESHOLD_PER_STEP]);

  const handleStepClick = React.useCallback((index) => {
    if (!sessionActive) {
      setSessionError(t('startPrompt', 'Please start the cooking session first.'));
      return;
    }

    navigateToStep(index + 1); // Convert 0-based array index to 1-based step
  }, [sessionActive, navigateToStep, t]);

  const handleStartCooking = React.useCallback(async (withVoice) => {
    if (!recipeId || !instructions || instructions.length === 0) {
      return;
    }

    // Unlock audio on user interaction (critical for mobile browsers)
    unlockAudio().catch((err) => {
      console.warn('Failed to unlock audio:', err);
    });

    setSessionError(null);
    setNavigationError(null);
    setSessionFinished(false);
    setVoicePreference(null);
    setResumeVoicePrompted(false);
    setIsNewSessionStart(true);
    resetSessionVisuals();

    setIsSessionStarting(true);
    try {
      const sessionId = await startCookingSession(parseInt(recipeId, 10));
      setCookingSessionId(sessionId);
      await navigateToStep(1, { sessionIdOverride: sessionId });

      const preference = withVoice ? 'with' : 'without';
      setVoicePreference(preference);

      // Save preference to localStorage
      try {
        localStorage.setItem(VOICE_PREFERENCE_STORAGE_KEY, preference);
      } catch (err) {
        console.warn('Failed to save voice preference:', err);
      }

      // Voice assistant will be auto-started by useEffect when cookingSessionId is set
      // (only if preference is 'with')
    } catch (err) {
      console.error('Failed to start cooking session:', err);
      setSessionError(t('startError', 'Failed to start the cooking session. Please try again.'));
    } finally {
      setIsSessionStarting(false);
    }
  }, [recipeId, instructions, navigateToStep, t, resetSessionVisuals]);

  const handlePreviousStep = React.useCallback(() => {
    if (!sessionActive || !hasActiveStep || focusedStep === 1) {
      return;
    }

    navigateToStep(focusedStep - 1);
  }, [sessionActive, hasActiveStep, focusedStep, navigateToStep]);

  const finalizeSession = React.useCallback(async ({ silent = false } = {}) => {
    if (!cookingSessionId) {
      return false;
    }

    if (!silent) {
      setNavigationError(null);
      setIsFinishingSession(true);
    }

    try {
      await finishCookingSession(cookingSessionId);
      stopVoiceAssistant();
      resetSessionVisuals();
      setCookingSessionId(null);
      setFocusedStep(null);
      setVoicePreference(null);
      setResumeVoicePrompted(false);
      setIsNewSessionStart(false);
      if (!silent) {
        setSessionFinished(true);
        setSessionError(null);
      }
      return true;
    } catch (err) {
      console.error('Failed to finish cooking session:', err);
      if (!silent) {
        setNavigationError(t('finishError', 'Failed to finish the cooking session.'));
      }
      return false;
    } finally {
      if (!silent) {
        setIsFinishingSession(false);
      }
    }
  }, [cookingSessionId, resetSessionVisuals, stopVoiceAssistant, t]);

  const applyVoicePreference = React.useCallback((withVoice) => {
    const preference = withVoice ? 'with' : 'without';
    setVoicePreference(preference);

    // Save preference to localStorage
    try {
      localStorage.setItem(VOICE_PREFERENCE_STORAGE_KEY, preference);
    } catch (err) {
      console.warn('Failed to save voice preference:', err);
    }

    if (withVoice) {
      startVoiceAssistant();
    } else {
      stopVoiceAssistant();
    }
    setIsStartDialogOpen(false);
    setStartDialogMode('new');
  }, [startVoiceAssistant, stopVoiceAssistant]);

  const handleVoicePreferenceSelection = React.useCallback(async (withVoice) => {
    // Unlock audio on user interaction (critical for mobile browsers)
    unlockAudio().catch((err) => {
      console.warn('Failed to unlock audio:', err);
    });

    if (startDialogMode === 'resume') {
      applyVoicePreference(withVoice);
      return;
    }

    setIsStartDialogOpen(false);
    setStartDialogMode('new');
    await handleStartCooking(withVoice);
  }, [startDialogMode, applyVoicePreference, handleStartCooking]);

  const handleReturnToLibrary = React.useCallback(async () => {
    if (sessionActive && isLastStep) {
      const completed = await finalizeSession();
      if (!completed) {
        return;
      }
    }
    navigate('/app');
  }, [sessionActive, isLastStep, finalizeSession, navigate]);

  const handleNextStep = React.useCallback(async () => {
    if (!sessionActive || !hasActiveStep) {
      setSessionError(t('startPrompt', 'Please start the cooking session first.'));
      return;
    }

    if (totalSteps === 0) {
      return;
    }

    if (focusedStep >= totalSteps) {
      await finalizeSession();
      return;
    }

    await navigateToStep(focusedStep + 1);
  }, [sessionActive, hasActiveStep, totalSteps, focusedStep, navigateToStep, finalizeSession, t]);

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

  resetSessionVisuals();
  setCookingSessionId(session.id);
  setSessionFinished(false);
  setSessionError(null);
  setNavigationError(null);
  setVoicePreference(null);
  setResumeVoicePrompted(false);
  setIsNewSessionStart(false);
  stopVoiceAssistant();
  previousSyncedStep.current = clampedStep;

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
  }, [recipeId, instructions, sessionActive, sessionRestored, scrollStepIntoView, resetSessionVisuals, stopVoiceAssistant]);

  React.useEffect(() => {
    if (sessionRestored && sessionActive && !resumeVoicePrompted && !isNewSessionStart) {
      // Check if user has a saved voice preference
      try {
        const savedPreference = localStorage.getItem(VOICE_PREFERENCE_STORAGE_KEY);
        if (savedPreference) {
          // Auto-apply saved preference without showing dialog
          const withVoice = savedPreference === 'with';
          setVoicePreference(savedPreference);
          if (withVoice) {
            startVoiceAssistant();
          } else {
            stopVoiceAssistant();
          }
          setResumeVoicePrompted(true);
          return;
        }
      } catch (err) {
        console.warn('Failed to load voice preference:', err);
      }

      // No saved preference - show dialog
      setStartDialogMode('resume');
      setIsStartDialogOpen(true);
      setResumeVoicePrompted(true);
    }
  }, [sessionRestored, sessionActive, resumeVoicePrompted, isNewSessionStart, startVoiceAssistant, stopVoiceAssistant]);

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
          setError(t('errorLoading', 'Failed to load instructions. Please try again.'));
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

  // Set up wheel event listener for scroll-based navigation
  React.useEffect(() => {
    if (!sessionActive || !containerRef.current) {
      return;
    }

    // Add wheel listener to window to capture all scroll events
    // Note: NOT using passive: true because we call preventDefault()
    window.addEventListener('wheel', handleWheelNavigation, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheelNavigation);

      // Clean up timeouts
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [sessionActive, handleWheelNavigation]);

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
            {t('generating', 'Generating Instructions...')}
          </h2>
          <p className="text-[#2D2D2D] opacity-75 text-sm sm:text-base">
            {t('generatingDescription', 'Our AI chef is preparing detailed cooking instructions for your recipe. This usually takes just a few moments.')}
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
            {t('errorTitle', 'Oops! Something went wrong')}
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
          {t('title', 'Cooking Instructions')}
        </h1>
        <p className="text-[#2D2D2D] mt-3 sm:mt-4 max-w-lg text-sm sm:text-base">
          {t('subtitle', 'Follow the steps along the path to complete your recipe.')}
        </p>
      </div>

        {/* Session Start Control */}
        <div className="w-full max-w-4xl mb-6">
          {!sessionActive ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <button
                ref={sessionControlsRef}
                type="button"
                onClick={() => {
                  // Unlock audio on user interaction (critical for mobile browsers)
                  unlockAudio().catch(() => {});

                  setStartDialogMode('new');
                  setIsStartDialogOpen(true);
                }}
                disabled={isSessionStarting || totalSteps === 0}
                className={`group relative px-12 py-6 rounded-full font-bold text-lg uppercase tracking-wide transition-all duration-300 ${
                  isSessionStarting || totalSteps === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#035035] to-[#046847] text-white hover:scale-110 active:scale-95 shadow-2xl hover:shadow-[0_20px_60px_rgba(3,80,53,0.4)] animate-pulse hover:animate-none'
                }`}
              >
                <span className="relative z-10">
                  {isSessionStarting ? t('starting', 'Starting...') : t('startSessionButton', '🚀 Start Session')}
                </span>
                {!isSessionStarting && totalSteps > 0 && (
                  <span className="absolute inset-0 rounded-full bg-[#A8C9B8] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                )}
              </button>
              <p className="mt-6 text-sm text-[#2D2D2D]/70 text-center max-w-md">
                {t('startVoiceInfo', 'In the next step you decide whether to use the voice assistant.')}
              </p>
            </div>
          ) : null}
          {(sessionError || navigationError) && (
            <div className="mt-3 space-y-2">
              {sessionError && <p className="text-sm text-red-600">{sessionError}</p>}
              {navigationError && <p className="text-sm text-red-600">{navigationError}</p>}
            </div>
          )}
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

            // Check if either connected step is focused
            const currentStepFocused = focusedStep === index + 1;
            const nextStepFocused = focusedStep === index + 2;
            const shouldDim = hasActiveStep && !currentStepFocused && !nextStepFocused;

            return (
              <path
                key={step.id}
                d={`M ${step.x} ${step.y} C ${step.x} ${step.y + CURVE_AMOUNT}, ${nextStep.x} ${nextStep.y - CURVE_AMOUNT}, ${nextStep.x} ${nextStep.y}`}
                stroke="#A8C9B8"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="10 12"
                style={{
                  opacity: shouldDim ? 0.4 : 1,
                  filter: shouldDim ? 'grayscale(100%)' : 'none',
                  transition: 'opacity 300ms, filter 300ms'
                }}
              />
            );
          })}
        </svg>

        {/* StepDivs */}
        <div
          className="relative flex flex-col gap-6 sm:gap-8 md:gap-10"
          style={{ zIndex: 10 }}
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
              onOpenChat: () => handleOpenChat(index),
              onTimerUpdate: handleTimerUpdate
            };

            const timerState = timerStates[index];
            // Only pass aiButtonRef for the first step (index 0)
            const buttonRef = index === 0 ? aiButtonRef : null;

            return (
              <StepDiv
                key={index}
                ref={(el) => (stepRefs.current[index] = el)}
                circleRef={(el) => (circleRefs.current[index] = el)}
                instruction={instruction}
                content={buildInstructionContent(instruction, index, timerData, handlers, focusedStep === index + 1, sessionActive, timerState, buttonRef)}
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

      {/* Session Finished Message - Shown at the bottom after all instructions */}
      {sessionFinished && (
        <div className="w-full max-w-4xl mt-12 mb-6">
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-green-700 mb-6">
              {t('finishedMessage', 'Cooking session complete – enjoy your meal!')}
            </p>
            <button
              type="button"
              onClick={handleReturnToLibrary}
              className="px-8 py-4 rounded-full text-base font-semibold uppercase tracking-wide bg-[#FF9B7B] text-white transition hover:bg-[#ff8a61] hover:scale-105 active:scale-95 shadow-lg"
            >
              ← {t('backToLibrary', 'Back to Library')}
            </button>
          </div>
        </div>
      )}

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
                onTimerUpdate={handleTimerUpdate}
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

      <SessionStartDialog
        isOpen={isStartDialogOpen}
        mode={startDialogMode}
        isSubmitting={startDialogMode === 'new' ? isSessionStarting : false}
        onClose={() => {
          setIsStartDialogOpen(false);
          setStartDialogMode('new');
        }}
        onSelect={handleVoicePreferenceSelection}
        wakeWordSupported={wakeWordSupported}
      />

      {/* Fixed Navigation Controls - Bottom Right - Only show when session is active */}
      {sessionActive && (
        <>
          {/* Voice Assistant Activity Feedback */}
          {voiceAssistant?.assistantState && voiceAssistant.assistantState !== 'idle' && (
            <div className="fixed bottom-24 right-6 z-40 bg-white border-2 border-[#A8C9B8] rounded-2xl shadow-2xl px-4 py-3 animate-slideIn">
              <div className="flex items-center gap-3">
                {voiceAssistant.assistantState === 'detected' && (
                  <>
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-sm font-semibold text-[#035035]">
                        Hey Piatto detected!
                      </p>
                      <p className="text-xs text-gray-600">Starting recording...</p>
                    </div>
                  </>
                )}
                {voiceAssistant.assistantState === 'listening' && (
                  <>
                    <div className="relative">
                      <span className="text-2xl">🎤</span>
                      <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-600">
                        Listening...
                      </p>
                      <p className="text-xs text-gray-600">Speak your question</p>
                    </div>
                  </>
                )}
                {voiceAssistant.assistantState === 'processing' && (
                  <>
                    <div className="animate-spin">
                      <span className="text-2xl">⚙️</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#035035]">
                        Processing...
                      </p>
                      <p className="text-xs text-gray-600">Preparing your answer</p>
                    </div>
                  </>
                )}
                {voiceAssistant.assistantState === 'playing' && (
                  <>
                    <span className="text-2xl animate-pulse">🔊</span>
                    <div>
                      <p className="text-sm font-semibold text-[#035035]">
                        Playing response
                      </p>
                      <p className="text-xs text-gray-600">Audio output active</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div ref={sessionControlsRef} className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          {/* Previous Step Button */}
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={!hasActiveStep || focusedStep === 1 || navigationBusy}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              !hasActiveStep || focusedStep === 1 || navigationBusy
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-[#035035] text-[#035035] hover:bg-[#f1f9f5] hover:scale-110'
            } shadow-lg`}
            title={t('previous', 'Back')}
          >
            <span className="text-lg">◀</span>
          </button>

          {/* Next Step Button */}
          <button
            type="button"
            onClick={handleNextStep}
            disabled={!hasActiveStep || navigationBusy}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              !hasActiveStep || navigationBusy
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#035035] text-white hover:bg-[#024028] hover:scale-110'
            } shadow-lg`}
            title={isLastStep ? t('finish', 'Finish') : t('next', 'Next')}
          >
            <span className="text-lg">{isLastStep ? '✓' : '▶'}</span>
          </button>

          {/* Step Status */}
          <div className="bg-white border-2 border-[#A8C9B8] rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#035035]">
                {t('stepLabel', 'Step')}
              </span>
              <span className="text-sm font-bold text-[#035035]">
                {hasActiveStep ? `${focusedStep}/${totalSteps}` : '—'}
              </span>
            </div>
          </div>

          {/* Ask Piatto Button (Direct Voice Assistant) */}
          {cookingSessionId && voiceAssistant && (
            <button
              type="button"
              onClick={() => {
                // Unlock audio on user interaction (critical for mobile browsers)
                unlockAudio().catch(() => {});

                // If wake word detection is supported but not active, show settings dialog
                if (wakeWordSupported && !voiceAssistantActive) {
                  setStartDialogMode('resume');
                  setIsStartDialogOpen(true);
                  return;
                }
                // Otherwise, start recording directly
                voiceAssistant.startRecording?.();
              }}
              disabled={voiceAssistantBusy}
              className={`relative transition-all duration-200 ${
                voiceAssistantBusy ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'
              }`}
              title={
                wakeWordSupported
                  ? (voiceAssistantActive
                      ? t('voiceAssistant.askPiatto', 'Ask Piatto directly')
                      : t('voiceAssistant.enableFirst', 'Enable voice assistant first'))
                  : t('voiceAssistant.manualOnlyTitle', 'Tap to ask Piatto (wake word unavailable)')
              }
            >
              <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center shadow-lg ${
                voiceAssistantBusy
                  ? 'bg-gray-400 border-gray-300 shadow-gray-400/50'
                  : voiceAssistantActive
                  ? 'bg-[#035035] border-[#024028] shadow-[#035035]/50'
                  : wakeWordSupported
                  ? 'bg-blue-500 border-blue-300 shadow-blue-500/50'
                  : 'bg-[#035035] border-[#024028] shadow-[#035035]/50'
              } transition-all duration-300`}>
                <span className="text-lg">💬</span>
              </div>
              {voiceAssistant.assistantState === 'listening' && (
                <div className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-75" />
              )}
            </button>
          )}

          {/* Voice Assistant Status */}
          <button
            type="button"
            onClick={() => {
              // Unlock audio on user interaction (critical for mobile browsers)
              unlockAudio().catch(() => {});

              setStartDialogMode('resume');
              setIsStartDialogOpen(true);
            }}
            className="relative transition-all duration-200 hover:scale-110"
            title={
              wakeWordSupported
                ? (voiceAssistantActive
                    ? t('voiceAssistant.activeTitle', 'Voice assistant active')
                    : t('voiceAssistant.inactiveTitle', 'Voice assistant inactive'))
                : t('voiceAssistant.unsupportedTitle', 'Wake word detection unavailable')
            }
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-full border-4 ${
                voiceAssistantActive
                  ? 'bg-green-500 border-green-300 shadow-lg shadow-green-500/50'
                  : wakeWordSupported
                  ? 'bg-orange-500 border-orange-300 shadow-lg shadow-orange-500/50'
                  : 'bg-amber-500 border-amber-300 shadow-lg shadow-amber-500/50'
              } flex items-center justify-center transition-all duration-300`}>
                <span className="text-lg">🎤</span>
              </div>
              {voiceAssistantActive && (
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
              )}
            </div>
          </button>
        </div>
        </>
      )}
    </div>
  );
};

export default CookingInstructions;
