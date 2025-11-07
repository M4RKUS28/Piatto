import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PiX, PiCaretRight } from 'react-icons/pi';
import Recipe from './Recipe';
import CookingInstructions from "./Instructions";
import { useTranslation } from 'react-i18next'
import useMediaQuery from '../../hooks/useMediaQuery';
import InstructionOnboardingTour from '../../components/InstructionOnboardingTour';

const ONBOARDING_STORAGE_KEY = 'piatto_instructions_onboarding_v1';

// Main RecipeView component
const RecipeView = () => {
  const { t } = useTranslation('recipeView');
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [recipeMinimized, setRecipeMinimized] = useState(false);
  const containerRef = useRef(null);
  const recipePanelRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const parsedRecipeId = parseInt(recipeId, 10);
  const [recipePanelNode, setRecipePanelNode] = useState(null);
  const [sessionControlsNode, setSessionControlsNode] = useState(null);
  const [stepsContainerNode, setStepsContainerNode] = useState(null);
  const [aiButtonNode, setAiButtonNode] = useState(null);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [pendingOnboarding, setPendingOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Validate recipeId
  useEffect(() => {
    if (isNaN(parsedRecipeId) || parsedRecipeId <= 0) {
      console.error('Invalid recipe ID:', recipeId);
      navigate('/app');
    }
  }, [recipeId, parsedRecipeId, navigate]);

  useEffect(() => {
    setRecipePanelNode(recipePanelRef.current);
  }, [recipeMinimized, isMobile]);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!seen) {
        setPendingOnboarding(true);
      }
    } catch (err) {
      console.warn('Failed to read onboarding state:', err);
    }
  }, []);

  useEffect(() => {
    if (!pendingOnboarding) {
      return;
    }
    if (recipePanelNode && sessionControlsNode && stepsContainerNode && aiButtonNode) {
      setIsOnboardingActive(true);
      setPendingOnboarding(false);
    }
  }, [pendingOnboarding, recipePanelNode, sessionControlsNode, stepsContainerNode, aiButtonNode]);

  useEffect(() => {
    if (!isOnboardingActive) {
      document.body.style.overflow = '';
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOnboardingActive]);

  const onboardingSteps = useMemo(() => ([
    {
      key: 'ingredients',
      title: t('onboarding.ingredientsTitle', 'Left Panel: Ingredients & Details'),
      description: t('onboarding.ingredientsDescription', 'Here you can find all ingredients, nutrition facts, and recipe information. Scroll to keep everything within reach.'),
      target: recipePanelNode,
      borderRadius: '0px',
    },
    {
      key: 'steps',
      title: t('onboarding.stepsTitle', 'Step-by-step Guidance'),
      description: t('onboarding.stepsDescription', 'Follow the path through each cooking step. Every step shows you exactly what to do.'),
      target: stepsContainerNode,
    },
    {
      key: 'ai-button',
      title: t('onboarding.aiButtonTitle', 'AI Questions'),
      description: t('onboarding.aiButtonDescription', 'Ask the AI for help on any step. Click the ✨ Ask AI button to get support for the current step.'),
      target: aiButtonNode,
      highlightParent: true,
      borderRadius: '16px',
    },
    {
      key: 'session-controls',
      title: t('onboarding.sessionControlsTitle', 'Session Controls'),
      description: t('onboarding.sessionControlsDescription', 'Navigate steps, track your progress, and control the voice assistant from here.'),
      target: sessionControlsNode,
      borderRadius: '9999px',
    },
  ]), [t, recipePanelNode, sessionControlsNode, stepsContainerNode, aiButtonNode]);

  const finalizeOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    setOnboardingStep(0);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (err) {
      console.warn('Failed to persist onboarding state:', err);
    }
  }, []);

  const handleOnboardingNext = useCallback(() => {
    if (!isOnboardingActive) {
      return;
    }
    if (onboardingStep >= onboardingSteps.length - 1) {
      finalizeOnboarding();
      return;
    }
    setOnboardingStep((prev) => prev + 1);
  }, [isOnboardingActive, onboardingStep, finalizeOnboarding, onboardingSteps.length]);

  const handleOnboardingBack = useCallback(() => {
    if (!isOnboardingActive) {
      return;
    }
    setOnboardingStep((prev) => Math.max(prev - 1, 0));
  }, [isOnboardingActive]);

  const handleOnboardingSkip = useCallback(() => {
    finalizeOnboarding();
  }, [finalizeOnboarding]);


  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      // Calculate new width as a percentage, clamping between 20% and 80%
      const newLeftWidth = Math.max(20, Math.min(((e.clientX - container.left) / container.width) * 100, 80));
      setLeftWidth(newLeftWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isMobile) {
      return undefined;
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isMobile]);

  // Simplified toggle handler for the recipe panel
  const handleToggleRecipe = () => {
    setRecipeMinimized(!recipeMinimized);
  };

  const activeOnboardingStep = isOnboardingActive
    ? onboardingSteps[Math.min(onboardingStep, Math.max(onboardingSteps.length - 1, 0))] ?? null
    : null;

  const instructionsProps = {
    recipeId: parsedRecipeId,
    onRegisterSessionControls: setSessionControlsNode,
    onRegisterStepsArea: setStepsContainerNode,
    onRegisterAiButton: setAiButtonNode,
  };

  const layout = isMobile ? (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-[#F5F5F5]">
      <div ref={recipePanelRef} className="w-full">
        <Recipe recipeId={parsedRecipeId} />
      </div>
      <div className="w-full flex-1">
        <CookingInstructions {...instructionsProps} />
      </div>
    </div>
  ) : (
    <div ref={containerRef} className="h-screen w-full max-w-full flex overflow-hidden bg-[#F5F5F5]">
      {/* Recipe Panel */}
      <div
        ref={recipePanelRef}
        className="relative flex-shrink-0 transition-all duration-300 ease-out min-w-[64px]"
        style={{
          width: recipeMinimized ? '64px' : `${leftWidth}%`,
        }}
      >
        {recipeMinimized ? (
          <div
            className="h-full bg-[#035035] flex flex-col items-center justify-center gap-3 px-2 cursor-pointer hover:bg-[#046847] transition-colors"
            onClick={handleToggleRecipe}
            aria-label={t('aria.expandRecipePanel', 'Expand recipe panel')}
          >
            <span
              className="text-white font-bold text-sm tracking-[0.35em]"
              style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
            >
              {t('recipeLabel', 'RECIPE')}
            </span>
            <PiCaretRight className="text-white text-2xl" />
          </div>
        ) : (
          <div className="h-full relative">
            <button onClick={handleToggleRecipe} className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-[#035035] hover:bg-[#FF9B7B] hover:text-white transition-all hover:scale-110">
              <PiX className="text-xl" />
            </button>
            <Recipe recipeId={parsedRecipeId} />
          </div>
        )}
      </div>

      {/* Draggable Divider (only shows when recipe is not minimized) */}
      {!recipeMinimized && (
        <div
          className="w-4 bg-[#A8C9B8] hover:bg-[#035035] cursor-col-resize flex-shrink-0 relative group transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
        >
        </div>
      )}

      {/* Instructions Panel (now permanent) */}
      <div className="relative flex-1 min-w-0">
        <div className="h-full overflow-y-auto">
          <CookingInstructions {...instructionsProps} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {layout}
      {isOnboardingActive && activeOnboardingStep && (
        <InstructionOnboardingTour
          step={activeOnboardingStep}
          stepIndex={onboardingStep}
          totalSteps={onboardingSteps.length}
          onNext={handleOnboardingNext}
          onBack={handleOnboardingBack}
          onSkip={handleOnboardingSkip}
        />
      )}
    </>
  );
};

export default RecipeView;