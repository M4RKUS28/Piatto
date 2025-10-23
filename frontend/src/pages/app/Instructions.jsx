import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

// ============================================================================
// SAMPLE DATA - Replace this with your actual recipe instructions
// ============================================================================
const sampleInstructions = [
  {
    id: 1,
    title: "Boil the Water",
    instruction: "Bring a large pot of salted water to a rolling boil. Use plenty of water to give the pasta room to move freely.",
    duration: 300, // 5 minutes in seconds
    animation: "boil_water",
    tips: "Use about 4-5 quarts of water and 2 tablespoons of salt",
    heatLevel: "high",
    needsTimer: true
  },
  {
    id: 2,
    title: "Prepare the Meat",
    instruction: "Heat olive oil in a large pan over medium-high heat. Add the ground beef and break it up with a wooden spoon. Cook until browned all over.",
    duration: 480,
    animation: "fry_in_pan",
    tips: "Don't move the meat too much at first - let it develop a nice crust",
    heatLevel: "medium",
    needsTimer: true
  },
  {
    id: 3,
    title: "Add Aromatics",
    instruction: "Add the chopped onions and minced garlic to the pan. Sauté until the onions become translucent and fragrant.",
    duration: 240,
    animation: "let_cook_and_stirr",
    tips: "If the garlic browns too quickly, reduce the heat",
    heatLevel: "medium",
    needsTimer: true
  },
  {
    id: 4,
    title: "Build the Sauce",
    instruction: "Stir in the tomato paste and cook for 2 minutes. Then add crushed tomatoes, beef broth, oregano, and basil. Season with salt and pepper.",
    duration: 180,
    animation: "let_cook_and_stirr",
    tips: "Cooking the tomato paste removes the raw taste",
    heatLevel: "medium",
    needsTimer: false
  },
  {
    id: 5,
    title: "Simmer the Sauce",
    instruction: "Reduce heat to low and let the sauce simmer gently, stirring occasionally. This allows the flavors to meld together beautifully.",
    duration: 900,
    animation: "steaming_with_lid",
    tips: "The longer you simmer, the richer the sauce becomes",
    heatLevel: "low",
    needsTimer: true
  },
  {
    id: 6,
    title: "Cook the Pasta",
    instruction: "Add the spaghetti to the boiling water and cook according to package directions until al dente. Reserve 1 cup of pasta water before draining.",
    duration: 540,
    animation: "boil_water",
    tips: "Test pasta 1-2 minutes before package time",
    heatLevel: "high",
    needsTimer: true
  },
  {
    id: 7,
    title: "Combine & Serve",
    instruction: "Drain the pasta and add it to the sauce. Toss well to coat every strand. Add pasta water if needed. Serve immediately with fresh basil and Parmesan.",
    duration: 120,
    animation: "let_cook_and_stirr",
    tips: "The starchy pasta water helps the sauce cling to the noodles",
    heatLevel: "off",
    needsTimer: false
  }
];

// ============================================================================
// COOKING INSTRUCTIONS COMPONENT
// ============================================================================
const CookingInstructions = ({ instructions = sampleInstructions }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [animations, setAnimations] = useState({});
  const timerIntervalRef = useRef(null);
  const stepRefs = useRef([]);

  const progressPercentage = (completedSteps.size / instructions.length) * 100;

  // Load animations
  useEffect(() => {
    const loadAnimations = async () => {
      const animFiles = [
        'boil_water',
        'fire_in_pan',
        'fry_in_pan',
        'let_cook_and_stirr',
        'microwave',
        'oven_convect',
        'steaming_with_lid'
      ];

      const loaded = {};
      for (const file of animFiles) {
        try {
          const response = await fetch(`/lottie-animations/${file}.json`);
          loaded[file] = await response.json();
        } catch (error) {
          console.error(`Failed to load ${file}:`, error);
        }
      }
      setAnimations(loaded);
    };

    loadAnimations();
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            playTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [timerActive, timeRemaining]);

  const playTimerComplete = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleStepClick = (index) => {
    setActiveStep(index);
    setTimerActive(false);
    setTimeRemaining(0);

    // Scroll to step
    stepRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  const startTimer = () => {
    const step = instructions[activeStep];
    if (step.duration) {
      setTimeRemaining(step.duration);
      setTimerActive(true);
    }
  };

  const completeStep = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(activeStep);
    setCompletedSteps(newCompleted);
    setTimerActive(false);
    setTimeRemaining(0);

    // Move to next step if available
    if (activeStep < instructions.length - 1) {
      setTimeout(() => {
        setActiveStep(activeStep + 1);
        stepRefs.current[activeStep + 1]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 500);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepStatus = (index) => {
    if (completedSteps.has(index)) return 'completed';
    if (index === activeStep) return 'active';
    if (index < activeStep) return 'available';
    return 'locked';
  };

  const heatIcons = {
    high: '🔥',
    medium: '🔶',
    low: '✨',
    off: '⭕'
  };

  return (
    <div className="h-full overflow-y-auto bg-[#FFF8F0] relative">
      {/* Fixed Header with Progress */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-[#035035] to-[#024a2f] text-white px-6 py-6 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-poppins font-bold text-2xl">Cooking Path</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-90">
                {completedSteps.size}/{instructions.length}
              </span>
              <div className="w-12 h-12 rounded-full bg-[#FF9B7B] flex items-center justify-center font-bold text-lg shadow-lg">
                {completedSteps.size}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#FF9B7B] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Duolingo-style Path */}
      <div className="max-w-3xl mx-auto px-6 py-8 relative">
        {/* Vertical Dashed Line */}
        <div className="absolute left-[calc(50%-1px)] top-0 bottom-0 w-0.5 border-l-4 border-dashed border-[#A8C9B8]"
             style={{ zIndex: 0 }} />

        {/* Steps */}
        <div className="relative space-y-12" style={{ zIndex: 1 }}>
          {instructions.map((step, index) => {
            const status = getStepStatus(index);
            const isActive = index === activeStep;
            const isCompleted = completedSteps.has(index);
            const isLocked = status === 'locked';

            return (
              <motion.div
                key={step.id}
                ref={el => stepRefs.current[index] = el}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Step Card */}
                <motion.div
                  onClick={() => !isLocked && handleStepClick(index)}
                  whileHover={{ scale: isLocked ? 1 : 1.02 }}
                  whileTap={{ scale: isLocked ? 1 : 0.98 }}
                  className={`relative ${
                    isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {/* Card Container */}
                  <div className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-500 ${
                    isActive 
                      ? 'ring-4 ring-[#FF9B7B] shadow-2xl' 
                      : isCompleted
                      ? 'ring-2 ring-[#035035]'
                      : isLocked
                      ? 'opacity-40 grayscale'
                      : 'hover:shadow-2xl'
                  }`}>

                    {/* Step Number Circle - Positioned on the left edge */}
                    <div className="absolute -left-6 top-8 z-10">
                      <motion.div
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                          isCompleted
                            ? 'bg-[#035035] text-white'
                            : isActive
                            ? 'bg-[#FF9B7B] text-white'
                            : isLocked
                            ? 'bg-[#F5F5F5] text-gray-400'
                            : 'bg-white text-[#035035] border-4 border-[#035035]'
                        }`}
                      >
                        {isCompleted ? '✓' : isLocked ? '🔒' : index + 1}
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="flex gap-4 p-6">
                      {/* Left: Small Lottie Animation */}
                      {step.animation && animations[step.animation] && !isLocked && (
                        <div className="flex-shrink-0 w-20 h-20">
                          <Lottie
                            animationData={animations[step.animation]}
                            loop={isActive}
                            autoplay={isActive}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                      )}

                      {/* Right: Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className={`font-poppins font-bold text-xl ${
                            isActive ? 'text-[#035035]' : 'text-[#2D2D2D]'
                          }`}>
                            {step.title}
                          </h3>

                          {step.heatLevel && !isLocked && (
                            <span className="text-2xl flex-shrink-0">
                              {heatIcons[step.heatLevel]}
                            </span>
                          )}
                        </div>

                        <p className={`text-base leading-relaxed mb-3 ${
                          isActive ? 'text-[#2D2D2D]' : 'text-[#2D2D2D]/70'
                        }`}>
                          {step.instruction}
                        </p>

                        {/* Pro Tip */}
                        {step.tips && isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-[#FFF8F0] border-l-4 border-[#FF9B7B] p-3 rounded-r-xl mb-3"
                          >
                            <p className="text-sm">
                              <span className="font-semibold text-[#035035]">💡 </span>
                              {step.tips}
                            </p>
                          </motion.div>
                        )}

                        {/* Timer - Only for active step with needsTimer */}
                        {isActive && step.needsTimer && step.duration && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-4 p-4 rounded-2xl ${
                              timerActive 
                                ? 'bg-gradient-to-br from-[#FF9B7B] to-[#ff8a64] text-white' 
                                : 'bg-[#F5F5F5] text-[#2D2D2D]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">⏱️</span>
                                <span className="font-semibold text-sm">
                                  {timerActive ? 'Timer Running' : `${Math.floor(step.duration / 60)} min timer`}
                                </span>
                              </div>

                              {timerActive && (
                                <div className="text-2xl font-bold">
                                  {formatTime(timeRemaining)}
                                </div>
                              )}
                            </div>

                            {!timerActive && (
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startTimer();
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full py-2 bg-[#035035] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                              >
                                Start Timer
                              </motion.button>
                            )}

                            {timerActive && (
                              <div className="flex gap-2">
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTimerActive(false);
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex-1 py-2 bg-white/20 rounded-xl font-semibold hover:bg-white/30 transition-all"
                                >
                                  Pause
                                </motion.button>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Complete Button - Only for active step */}
                        {isActive && !isCompleted && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              completeStep();
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-4 w-full py-3 bg-[#035035] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                          >
                            Complete Step
                          </motion.button>
                        )}

                        {/* Completed Badge */}
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#035035] text-white rounded-full font-semibold text-sm"
                          >
                            ✓ Completed
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Completion Celebration */}
        {completedSteps.size === instructions.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mt-12 bg-gradient-to-br from-[#035035] to-[#024a2f] text-white rounded-3xl p-8 text-center shadow-2xl"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { repeat: Infinity, duration: 2 },
                scale: { repeat: Infinity, duration: 1.5 }
              }}
              className="text-8xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="font-poppins text-3xl font-bold mb-2">
              Amazing Work!
            </h2>
            <p className="text-lg opacity-90 mb-6">
              You've completed all the cooking steps. Time to enjoy your delicious creation!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCompletedSteps(new Set());
                setActiveStep(0);
                stepRefs.current[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-8 py-3 bg-[#FF9B7B] text-white rounded-full font-bold hover:shadow-xl transition-all"
            >
              Start Over
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Floating Action Button - Quick Complete */}
      {activeStep < instructions.length && !completedSteps.has(activeStep) && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={completeStep}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-[#035035] text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-30 hover:bg-[#024a2f] transition-colors"
        >
          ✓
        </motion.button>
      )}
    </div>
  );
};

export default CookingInstructions;