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
    instruction: "Bring a large pot of salted water to a rolling boil. Use plenty of water to give the pasta room to move freely. The water should be as salty as the sea!",
    duration: 300, // 5 minutes in seconds
    animation: "boil_water",
    tips: "Use about 4-5 quarts of water and 2 tablespoons of salt for perfect pasta",
    heatLevel: "high"
  },
  {
    id: 2,
    title: "Prepare the Meat Sauce",
    instruction: "Heat olive oil in a large pan over medium-high heat. Add the ground beef and break it up with a wooden spoon. Cook until browned all over, stirring occasionally.",
    duration: 480, // 8 minutes
    animation: "fry_in_pan",
    tips: "Don't move the meat too much at first - let it develop a nice brown crust for maximum flavor",
    heatLevel: "medium"
  },
  {
    id: 3,
    title: "Add Aromatics",
    instruction: "Add the chopped onions and minced garlic to the pan with the meat. Sauté until the onions become translucent and fragrant, about 3-4 minutes.",
    duration: 240, // 4 minutes
    animation: "let_cook_and_stirr",
    tips: "If the garlic starts to brown too quickly, reduce the heat slightly",
    heatLevel: "medium"
  },
  {
    id: 4,
    title: "Build the Sauce",
    instruction: "Stir in the tomato paste and cook for 2 minutes. Then add crushed tomatoes, beef broth, oregano, and basil. Season with salt and pepper. Bring to a simmer.",
    duration: 180, // 3 minutes
    animation: "let_cook_and_stirr",
    tips: "Cooking the tomato paste for a couple minutes removes the raw taste and deepens the flavor",
    heatLevel: "medium"
  },
  {
    id: 5,
    title: "Simmer the Sauce",
    instruction: "Reduce heat to low and let the sauce simmer gently, stirring occasionally. This allows the flavors to meld together beautifully.",
    duration: 900, // 15 minutes
    animation: "steaming_with_lid",
    tips: "The longer you simmer (up to 2 hours), the richer the sauce becomes. But 15-20 minutes minimum is perfect!",
    heatLevel: "low"
  },
  {
    id: 6,
    title: "Cook the Pasta",
    instruction: "Add the spaghetti to the boiling water and cook according to package directions until al dente. Reserve 1 cup of pasta water before draining.",
    duration: 540, // 9 minutes
    animation: "boil_water",
    tips: "Stir the pasta immediately after adding it to prevent sticking. Test it 1-2 minutes before the package time",
    heatLevel: "high"
  },
  {
    id: 7,
    title: "Combine and Serve",
    instruction: "Drain the pasta and add it to the sauce. Toss well to coat every strand. Add pasta water if needed to achieve the perfect consistency. Serve immediately with fresh basil and Parmesan.",
    duration: 120, // 2 minutes
    animation: "let_cook_and_stirr",
    tips: "The starchy pasta water helps the sauce cling to the noodles - don't skip this step!",
    heatLevel: "off"
  }
];

// ============================================================================
// COOKING INSTRUCTIONS COMPONENT
// ============================================================================
const CookingInstructions = ({ instructions = sampleInstructions }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerIntervalRef = useRef(null);

  const step = instructions[currentStep];
  const progressPercentage = ((currentStep + 1) / instructions.length) * 100;

  // Load animations
  const [animations, setAnimations] = useState({});

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
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete! ⏰', {
        body: `${step.title} is ready!`,
        icon: '🍳'
      });
    }
  };

  const nextStep = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setTimerActive(false);
      setTimeRemaining(0);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setTimerActive(false);
      setTimeRemaining(0);
    }
  };

  const startTimer = () => {
    if (step.duration) {
      setTimeRemaining(step.duration);
      setTimerActive(true);
    }
  };

  const toggleStepComplete = () => {
    const newCompleted = new Set(completedSteps);
    if (completedSteps.has(currentStep)) {
      newCompleted.delete(currentStep);
    } else {
      newCompleted.add(currentStep);
    }
    setCompletedSteps(newCompleted);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const heatColors = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-yellow-500',
    off: 'bg-gray-400'
  };

  const heatLabels = {
    high: 'High Heat',
    medium: 'Medium Heat',
    low: 'Low Heat',
    off: 'Heat Off'
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#FFF8F0]">
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header with Progress */}
        <motion.div
          className="mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-[#035035] mb-4">
            Cooking Instructions
          </h2>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-[#F5F5F5] rounded-full overflow-hidden shadow-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-[#035035] to-[#FF9B7B] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <p className="text-sm mt-2 text-[#2D2D2D]/70">
            Step {currentStep + 1} of {instructions.length} • {Math.round(progressPercentage)}% Complete
          </p>
        </motion.div>

        {/* Current Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6"
          >
            {/* Animation */}
            {step.animation && animations[step.animation] && (
              <div className="bg-gradient-to-br from-[#A8C9B8] to-[#FFF8F0] p-8 flex items-center justify-center">
                <div className="w-full max-w-md">
                  <Lottie
                    animationData={animations[step.animation]}
                    loop={true}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-[#FF9B7B]">
                      {currentStep + 1}
                    </span>
                    <h3 className="font-poppins text-2xl sm:text-3xl font-bold text-[#035035]">
                      {step.title}
                    </h3>
                  </div>
                  {step.heatLevel && (
                    <div className="flex items-center gap-2">
                      <motion.span
                        className={`w-3 h-3 rounded-full ${heatColors[step.heatLevel]}`}
                        animate={step.heatLevel === 'high' ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      <span className="text-sm text-[#2D2D2D]/70 capitalize">
                        {heatLabels[step.heatLevel]}
                      </span>
                    </div>
                  )}
                </div>

                <motion.button
                  onClick={toggleStepComplete}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`px-4 py-2 rounded-full font-semibold transition-all ${
                    completedSteps.has(currentStep)
                      ? 'bg-[#035035] text-white shadow-lg'
                      : 'bg-[#F5F5F5] text-[#2D2D2D] hover:bg-[#A8C9B8]/30'
                  }`}
                >
                  {completedSteps.has(currentStep) ? '✓ Done' : 'Mark Done'}
                </motion.button>
              </div>

              <p className="text-lg sm:text-xl leading-relaxed text-[#2D2D2D] mb-6">
                {step.instruction}
              </p>

              {step.tips && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#FFF8F0] border-l-4 border-[#FF9B7B] p-4 rounded-r-2xl mb-6"
                >
                  <p className="text-sm sm:text-base">
                    <span className="font-semibold text-[#035035]">💡 Pro Tip: </span>
                    {step.tips}
                  </p>
                </motion.div>
              )}

              {/* Timer */}
              {step.duration && (
                <motion.div
                  className={`p-6 rounded-2xl transition-all ${
                    timerActive 
                      ? 'bg-gradient-to-br from-[#FF9B7B] to-[#ff8a64] text-white shadow-2xl' 
                      : 'bg-[#F5F5F5] text-[#2D2D2D]'
                  }`}
                  animate={timerActive ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ repeat: timerActive ? Infinity : 0, duration: 1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⏱️</span>
                      <span className="font-semibold">
                        {timerActive ? 'Timer Running' : 'Timer Ready'}
                      </span>
                    </div>
                    <span className="text-sm opacity-80">
                      {Math.floor(step.duration / 60)} min {step.duration % 60 !== 0 && `${step.duration % 60} sec`}
                    </span>
                  </div>

                  <div className="text-center mb-4">
                    <motion.div
                      className="text-6xl sm:text-7xl font-bold mb-2"
                      animate={timerActive && timeRemaining <= 10 ? {
                        scale: [1, 1.1, 1],
                        color: timerActive ? ['#FFFFFF', '#FFD700', '#FFFFFF'] : '#2D2D2D'
                      } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {formatTime(timerActive ? timeRemaining : step.duration)}
                    </motion.div>

                    {/* Progress Ring */}
                    {timerActive && (
                      <div className="flex justify-center mb-4">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="opacity-30"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 1 }}
                            animate={{ pathLength: timeRemaining / step.duration }}
                            transition={{ duration: 0.5 }}
                            style={{
                              strokeDasharray: 352,
                              strokeDashoffset: 0
                            }}
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={startTimer}
                      disabled={timerActive}
                      whileHover={{ scale: timerActive ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        timerActive
                          ? 'bg-white/20 cursor-not-allowed'
                          : 'bg-white text-[#035035] hover:shadow-lg'
                      }`}
                    >
                      {timerActive ? '▶ Running' : '▶ Start Timer'}
                    </motion.button>

                    {timerActive && (
                      <motion.button
                        onClick={() => setTimerActive(false)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 py-3 rounded-xl font-bold bg-white/20 hover:bg-white/30 transition-all"
                      >
                        ⏸ Pause
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-4 mb-8">
          <motion.button
            onClick={previousStep}
            disabled={currentStep === 0}
            whileHover={{ scale: currentStep === 0 ? 1 : 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all ${
              currentStep === 0
                ? 'bg-[#F5F5F5] text-gray-400 cursor-not-allowed'
                : 'bg-white text-[#035035] hover:shadow-xl border-2 border-[#035035]'
            }`}
          >
            ← Previous
          </motion.button>

          <motion.button
            onClick={nextStep}
            disabled={currentStep === instructions.length - 1}
            whileHover={{ scale: currentStep === instructions.length - 1 ? 1 : 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all ${
              currentStep === instructions.length - 1
                ? 'bg-[#F5F5F5] text-gray-400 cursor-not-allowed'
                : 'bg-[#035035] text-white hover:shadow-xl'
            }`}
          >
            Next →
          </motion.button>
        </div>

        {/* Step Overview */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-poppins text-xl font-bold text-[#035035] mb-4">
            All Steps
          </h3>
          <div className="space-y-2">
            {instructions.map((s, index) => (
              <motion.button
                key={s.id}
                onClick={() => {
                  setCurrentStep(index);
                  setTimerActive(false);
                  setTimeRemaining(0);
                }}
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 ${
                  index === currentStep
                    ? 'bg-[#035035] text-white shadow-lg'
                    : completedSteps.has(index)
                    ? 'bg-[#A8C9B8] text-[#035035]'
                    : 'bg-[#FFF8F0] hover:bg-[#F5F5F5]'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === currentStep
                    ? 'bg-[#FF9B7B]'
                    : completedSteps.has(index)
                    ? 'bg-[#035035] text-white'
                    : 'bg-white text-[#035035]'
                }`}>
                  {completedSteps.has(index) ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{s.title}</p>
                  {s.duration && (
                    <p className="text-sm opacity-75">
                      ⏱️ {Math.floor(s.duration / 60)} minutes
                    </p>
                  )}
                </div>
                {index === currentStep && (
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Completion Celebration */}
      <AnimatePresence>
        {completedSteps.size === instructions.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
            onClick={() => setCompletedSteps(new Set())}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="font-poppins text-3xl font-bold text-[#035035] mb-2">
                Congratulations!
              </h2>
              <p className="text-lg text-[#2D2D2D] mb-6">
                You've completed all cooking steps! Time to enjoy your delicious creation.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCompletedSteps(new Set());
                  setCurrentStep(0);
                }}
                className="px-8 py-3 bg-[#035035] text-white rounded-full font-bold hover:shadow-lg transition-all"
              >
                Review Instructions
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CookingInstructions;