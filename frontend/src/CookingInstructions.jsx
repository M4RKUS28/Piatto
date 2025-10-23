import React from 'react';
import Lottie from 'lottie-react';

// --- Mock Data ---
const mockInstructions = [
  { animationFile: 'boil_water.json' },
  { animationFile: 'fry_in_pan.json' },
  { animationFile: 'steaming_with_lid.json' },
  { animationFile: 'boil_water.json' },
  { animationFile: 'steaming_with_lid.json' },
];

const mockDivs = [
  // Step 1: Long detailed instruction with image
  <div className="p-6 bg-white rounded-2xl shadow-md">
    <img
      src="https://images.unsplash.com/photo-1547558840-8ad6c8e662a4?w=400&h=200&fit=crop"
      alt="Boiling water"
      className="w-full h-48 object-cover rounded-xl mb-4"
    />
    <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">Bring Water to Boil</h3>
    <p className="text-[#2D2D2D] mb-4">
      Fill a large pot with 4-6 quarts of water. Add 1 tablespoon of salt to enhance the flavor of your pasta.
      Place the pot on high heat and cover with a lid to speed up the boiling process. You'll know the water is
      ready when you see large, rolling bubbles breaking the surface consistently.
    </p>
    <div className="flex items-center gap-3 bg-[#FFF8F0] p-4 rounded-xl">
      <div className="text-3xl">⏱️</div>
      <div>
        <div className="text-sm text-[#035035] font-semibold">Timer</div>
        <div className="text-2xl font-bold text-[#2D2D2D]">8-10 min</div>
      </div>
    </div>
  </div>,

  // Step 2: Medium instruction with bullet points
  <div className="p-6 bg-white rounded-2xl shadow-md">
    <h3 className="text-xl font-semibold text-[#2D2D2D] mb-3">Add Pasta and Stir</h3>
    <p className="text-[#2D2D2D] mb-3">
      Once the water is at a rolling boil, carefully add your pasta. Follow these important steps:
    </p>
    <ul className="list-disc list-inside space-y-2 text-[#2D2D2D] mb-4 ml-2">
      <li>Add pasta gradually to prevent clumping</li>
      <li>Stir immediately after adding</li>
      <li>Continue stirring occasionally during cooking</li>
      <li>Do not add oil to the water</li>
    </ul>
    <div className="flex items-center gap-3 bg-[#FFF8F0] p-4 rounded-xl">
      <div className="text-3xl">⏱️</div>
      <div>
        <div className="text-sm text-[#035035] font-semibold">Cook Time</div>
        <div className="text-2xl font-bold text-[#2D2D2D]">11-13 min</div>
      </div>
    </div>
  </div>,

  // Step 3: Short instruction with multiple images
  <div className="p-6 bg-white rounded-2xl shadow-md">
    <h3 className="text-xl font-semibold text-[#2D2D2D] mb-3">Test for Doneness</h3>
    <div className="grid grid-cols-2 gap-3 mb-4">
      <img
        src="https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=150&fit=crop"
        alt="Testing pasta"
        className="w-full h-32 object-cover rounded-lg"
      />
      <img
        src="https://images.unsplash.com/photo-1611171711912-e0f8b0e08be4?w=200&h=150&fit=crop"
        alt="Perfect pasta texture"
        className="w-full h-32 object-cover rounded-lg"
      />
    </div>
    <p className="text-[#2D2D2D] mb-4">
      The best way to test pasta is to taste it. Remove a piece, let it cool slightly, then bite into it.
      It should be tender but still firm to the bite (al dente). There should be no white, chalky center.
    </p>
    <div className="bg-[#A8C9B8] bg-opacity-30 p-3 rounded-lg border-l-4 border-[#035035]">
      <p className="text-sm text-[#2D2D2D] font-medium">💡 Pro Tip: Start testing 2 minutes before the package time</p>
    </div>
  </div>,

  // Step 4: Complex instruction with warnings
  <div className="p-6 bg-white rounded-2xl shadow-md">
    <img
      src="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=200&fit=crop"
      alt="Draining pasta"
      className="w-full h-48 object-cover rounded-xl mb-4"
    />
    <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">Drain and Reserve Pasta Water</h3>
    <div className="bg-[#FF9B7B] bg-opacity-20 p-3 rounded-lg mb-4 border-l-4 border-[#FF9B7B]">
      <p className="text-sm text-[#2D2D2D] font-semibold">⚠️ Caution: Steam and hot water - handle carefully!</p>
    </div>
    <p className="text-[#2D2D2D] mb-3">
      Before draining, use a measuring cup to scoop out about 1-2 cups of the starchy pasta cooking water.
      This liquid gold will help create a silky sauce later. Place a colander in the sink and carefully pour
      the pasta through it. Give it a gentle shake to remove excess water, but don't rinse unless making a cold pasta salad.
    </p>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[#FFF8F0] p-3 rounded-lg text-center">
        <div className="text-2xl mb-1">🌡️</div>
        <div className="text-xs text-[#035035] font-semibold">Temp Check</div>
        <div className="text-lg font-bold text-[#2D2D2D]">Steaming Hot</div>
      </div>
      <div className="bg-[#FFF8F0] p-3 rounded-lg text-center">
        <div className="text-2xl mb-1">💧</div>
        <div className="text-xs text-[#035035] font-semibold">Reserve</div>
        <div className="text-lg font-bold text-[#2D2D2D]">1-2 cups</div>
      </div>
    </div>
  </div>,

  // Step 5: Simple final step
  <div className="p-6 bg-white rounded-2xl shadow-md">
    <h3 className="text-xl font-semibold text-[#2D2D2D] mb-3">Serve Immediately</h3>
    <p className="text-[#2D2D2D] mb-4">
      Transfer the drained pasta to your serving dish or back into the pot if adding sauce.
      Pasta is best enjoyed immediately while hot. Top with your favorite sauce, garnish with
      fresh herbs and grated cheese, and serve!
    </p>
    <div className="bg-gradient-to-r from-[#035035] to-[#A8C9B8] p-4 rounded-xl text-white text-center">
      <div className="text-3xl mb-2">🍝</div>
      <div className="font-bold text-lg">Buon Appetito!</div>
      <div className="text-sm opacity-90">Enjoy your perfectly cooked pasta</div>
    </div>
  </div>,
];

// --- Configuration ---
const CIRCLE_RADIUS = 36;
const CURVE_AMOUNT = 100;
const VERTICAL_PADDING = 40;

// --- StepCircle Component ---
const StepCircle = ({ animationFile }) => {
  const [animationData, setAnimationData] = React.useState(null);

  React.useEffect(() => {
    fetch(`/lottie-animations/${animationFile}`)
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Error loading Lottie animation:", error));
  }, [animationFile]);

  return (
    <div
      className="relative flex-shrink-0 rounded-full border-[3px] border-[#035035] bg-[#FFF8F0]"
      style={{
        width: `${CIRCLE_RADIUS * 2}px`,
        height: `${CIRCLE_RADIUS * 2}px`
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

// --- StepDiv Component ---
const StepDiv = React.forwardRef(({ instruction, content, index, circleRef }, ref) => {
  // Alternate positioning: even steps at 0px, odd steps at 100px
  const marginLeft = index % 2 === 0 ? '0px' : '100px';

  return (
    <div
      ref={ref}
      className="flex items-center gap-6 p-4"
      style={{ marginLeft }}
    >
      <div ref={circleRef}>
        <StepCircle animationFile={instruction.animationFile} />
      </div>
      <div className="flex-1">
        {content}
      </div>
    </div>
  );
});

// --- Main Component ---
const CookingInstructions = ({
  instructions = mockInstructions,
  contentDivs = mockDivs
}) => {
  const [stepPositions, setStepPositions] = React.useState([]);
  const stepRefs = React.useRef([]);
  const circleRefs = React.useRef([]);
  const containerRef = React.useRef(null);

  // Calculate circle positions for the SVG paths
  React.useEffect(() => {
    const calculatePositions = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const positions = [];

      circleRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          const relativeLeft = rect.left - containerRect.left;

          // Center of the circle
          const centerX = relativeLeft + CIRCLE_RADIUS;
          const centerY = relativeTop + CIRCLE_RADIUS;

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

  return (
    <div className="bg-[#FFF8F0] min-h-screen w-full flex flex-col items-center p-4">
      {/* Header */}
      <div className="p-4 md:p-8 text-center">
        <h1 className="font-['Poppins',_sans-serif] font-bold text-[#2D2D2D] text-[clamp(1.75rem,4vw,2.5rem)]">
          Cooking Instructions
        </h1>
        <p className="text-[#2D2D2D] mt-4 max-w-lg">
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
          className="relative flex flex-col"
          style={{ gap: `${VERTICAL_PADDING}px`, zIndex: 1 }}
        >
          {instructions.map((instruction, index) => (
            <StepDiv
              key={index}
              ref={(el) => (stepRefs.current[index] = el)}
              circleRef={(el) => (circleRefs.current[index] = el)}
              instruction={instruction}
              content={contentDivs[index]}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CookingInstructions;