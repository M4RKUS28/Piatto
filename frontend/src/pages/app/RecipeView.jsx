import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PiX, PiCaretRight } from 'react-icons/pi';
import Recipe from './Recipe';
import CookingInstructions from "./Instructions";
import { useTranslation } from 'react-i18next'
import useMediaQuery from '../../hooks/useMediaQuery';

// Main RecipeView component
const RecipeView = () => {
  const { t } = useTranslation('recipeView');
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [recipeMinimized, setRecipeMinimized] = useState(false);
  const containerRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const parsedRecipeId = parseInt(recipeId, 10);

  // Validate recipeId
  useEffect(() => {
    if (isNaN(parsedRecipeId) || parsedRecipeId <= 0) {
      console.error('Invalid recipe ID:', recipeId);
      navigate('/app/recipe-library');
    }
  }, [recipeId, parsedRecipeId, navigate]);

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

  if (isMobile) {
    return (
      <div className="min-h-screen w-full max-w-full flex flex-col bg-[#F5F5F5]">
        <div className="w-full">
          <Recipe recipeId={parsedRecipeId} />
        </div>
        <div className="w-full flex-1">
          <CookingInstructions recipeId={parsedRecipeId} />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen w-full max-w-full flex overflow-hidden bg-[#F5F5F5]">
      {/* Recipe Panel */}
      <div
        className="relative flex-shrink-0 transition-all duration-300 ease-out min-w-[64px]"
        style={{
          width: recipeMinimized ? '64px' : `${leftWidth}%`,
        }}
      >
        {recipeMinimized ? (
          <div
            className="h-full bg-[#035035] flex flex-col items-center justify-center gap-3 px-2 cursor-pointer hover:bg-[#046847] transition-colors"
            onClick={handleToggleRecipe}
            aria-label="Expand recipe panel"
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
          <CookingInstructions recipeId={parsedRecipeId} />
        </div>
      </div>
    </div>
  );
};

export default RecipeView;