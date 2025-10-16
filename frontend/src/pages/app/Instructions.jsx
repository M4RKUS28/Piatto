import React from 'react';
import { PiCheckCircle } from 'react-icons/pi';

const Instructions = () => {
  const steps = [
    {
      title: "Prepare the base",
      description: "Heat olive oil in a large pot over medium heat. Add the finely chopped onion and cook until softened, about 5 minutes. Add minced garlic and cook for another minute until fragrant."
    },
    {
      title: "Brown the meat",
      description: "Add the ground beef to the pot, breaking it up with a wooden spoon. Cook until browned all over, about 8-10 minutes. Drain excess fat if needed."
    },
    {
      title: "Build the sauce",
      description: "Stir in the tomato paste and cook for 2 minutes. Add the crushed tomatoes, beef broth, dried oregano, and dried basil. Season with salt and pepper to taste."
    },
    {
      title: "Simmer",
      description: "Bring the sauce to a boil, then reduce heat to low. Let it simmer uncovered for 25-30 minutes, stirring occasionally, until the sauce has thickened and flavors have melded together."
    },
    {
      title: "Cook the pasta",
      description: "Meanwhile, bring a large pot of salted water to a boil. Add the spaghetti and cook according to package directions until al dente, about 8-10 minutes. Drain the pasta, reserving 1 cup of pasta water."
    },
    {
      title: "Combine and serve",
      description: "Add the drained spaghetti to the Bolognese sauce and toss to combine. If the sauce seems too thick, add a splash of reserved pasta water. Serve hot, garnished with fresh basil and grated Parmesan cheese."
    }
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 md:p-8">
        <h2 className="font-poppins font-bold text-3xl text-[#035035] mb-2">
          Instructions
        </h2>
        <p className="text-[#2D2D2D]/70 mb-6">
          Follow these steps for the perfect Bolognese
        </p>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Step number circle */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#035035] text-white flex items-center justify-center font-poppins font-bold text-lg shadow-md">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-[#A8C9B8] mx-auto mt-2" />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pb-8">
                  <h3 className="font-poppins font-semibold text-xl text-[#035035] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[#2D2D2D] leading-relaxed">
                    {step.description}
                  </p>

                  {/* Optional check button for completed steps */}
                  <button className="mt-3 flex items-center gap-2 text-sm text-[#A8C9B8] hover:text-[#035035] transition-colors opacity-0 group-hover:opacity-100">
                    <PiCheckCircle className="w-5 h-5" />
                    <span>Mark as complete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cooking Tips */}
        <div className="mt-8 p-6 bg-[#FFF8F0] rounded-2xl border-2 border-[#FF9B7B]/20">
          <h3 className="font-poppins font-semibold text-lg text-[#035035] mb-3">
            💡 Cooking Tips
          </h3>
          <ul className="space-y-2 text-sm text-[#2D2D2D]/80">
            <li>• For a richer flavor, use a mix of ground beef and pork</li>
            <li>• A splash of red wine adds depth to the sauce</li>
            <li>• The longer the sauce simmers, the better it tastes</li>
            <li>• Always reserve pasta water - it helps bind the sauce</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Instructions;