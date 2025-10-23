import React from 'react';

const steps = [
  { id: 1, position: { top: '10rem', left: '9.25rem' } },
  { id: 2, position: { top: '26rem', left: '1.75rem' } },
  { id: 3, position: { top: '42rem', left: '9.25rem' } },
];

const StepCircle = ({ number, position }) => (
  <div
    // CHANGE 2: Added z-10 to ensure the circle is on a higher layer than the path.
    className="absolute z-10 flex items-center justify-center w-14 h-14 bg-forest-green rounded-full shadow-soft"
    style={position}
  >
    <span className="font-display font-bold text-xl text-white select-none">
      {number}
    </span>
  </div>
);

const CookingInstructions = () => {
  return (
    <div className="relative bg-cream min-h-screen w-full overflow-hidden">
      <div className="absolute top-0 left-0 h-full z-0">
        <svg
          width="250"
          height="100%"
          viewBox="0 0 250 900"
          preserveAspectRatio="xMidYMax meet"
          className="h-full"
        >
          <path
            d="M 125 100 C 250 250, 0 400, 125 550 C 250 700, 0 850, 125 1000"
            // CHANGE 1: Reverted to 'Sage Green' for better contrast.
            stroke="#A8C9B8"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="10 12"
          />
        </svg>
      </div>

      {steps.map(step => (
        <StepCircle key={step.id} number={step.id} position={step.position} />
      ))}
    </div>
  );
};

export default CookingInstructions;