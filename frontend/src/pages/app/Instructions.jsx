import { useState, useEffect } from 'react';
import { PiCheckCircle, PiChatCircle, PiPaperPlaneRight } from 'react-icons/pi';
import { getRecipeById } from '../../api/recipeApi';
import {
  startCookingSession,
  updateCookingState,
  askCookingQuestion,
  finishCookingSession
} from '../../api/cookingApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Instructions = ({ recipeId }) => {
  // State management
  const [cookingSessionId, setCookingSessionId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Handler to start cooking session
  const handleStartCooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionId = await startCookingSession(recipeId);
      setCookingSessionId(sessionId);
      setCurrentStep(0);
    } catch (err) {
      console.error('Failed to start cooking session:', err);
      setError('Failed to start cooking session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler to mark step as complete and move to next
  const handleCompleteStep = async (stepIndex) => {
    if (!cookingSessionId) return;

    try {
      const newStep = stepIndex + 1;
      await updateCookingState(cookingSessionId, newStep);
      setCurrentStep(newStep);
    } catch (err) {
      console.error('Failed to update cooking state:', err);

      // Show error message in chat
      setChatMessages(prev => [...prev, {
        type: 'error',
        text: 'Failed to update progress. Please try again.'
      }]);
    }
  };

  // Handler to ask AI question
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!userQuestion.trim() || !cookingSessionId || chatLoading) return;

    const question = userQuestion.trim();
    setUserQuestion('');

    // Add user message to chat
    setChatMessages(prev => [...prev, { type: 'user', text: question }]);

    try {
      setChatLoading(true);
      const response = await askCookingQuestion(cookingSessionId, question);

      // Add AI response to chat
      // The response structure might be { prompts: [...], responses: [...] }
      // We'll take the last response
      const aiResponse = response.responses?.[response.responses.length - 1] || response.response || 'No response received';
      setChatMessages(prev => [...prev, { type: 'ai', text: aiResponse }]);
    } catch (err) {
      console.error('Failed to ask question:', err);
      setChatMessages(prev => [...prev, {
        type: 'error',
        text: 'Sorry, I couldn\'t process your question. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handler to finish cooking session
  const handleFinishCooking = async () => {
    if (!cookingSessionId) return;

    try {
      await finishCookingSession(cookingSessionId);
      // Clear session state
      setCookingSessionId(null);
      setCurrentStep(0);
      setChatMessages([]);
      setShowChat(false);
    } catch (err) {
      console.error('Failed to finish cooking session:', err);

      // Show error message in chat
      setChatMessages(prev => [...prev, {
        type: 'error',
        text: 'Failed to finish cooking session. You can still close this session locally.'
      }]);

      // Allow user to clear session locally after a delay
      setTimeout(() => {
        setCookingSessionId(null);
        setCurrentStep(0);
        setChatMessages([]);
        setShowChat(false);
      }, 3000);
    }
  };

  // Fetch recipe instructions on mount
  useEffect(() => {
    const fetchInstructions = async () => {
      if (!recipeId) return;

      try {
        setLoading(true);
        setError(null);
        const recipe = await getRecipeById(recipeId);

        // Transform instructions from backend format to component format
        const transformedInstructions = recipe.instructions?.map((instruction) => ({
          title: instruction.Instruction?.split('.')[0] || 'Step',
          description: instruction.Instruction || '',
          timer: instruction.timer || null
        })) || [];

        setInstructions(transformedInstructions);
      } catch (err) {
        console.error('Failed to fetch recipe instructions:', err);
        setError('Failed to load instructions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructions();
  }, [recipeId]);

  // Retry handler
  const handleRetry = () => {
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage message={error} onRetry={handleRetry} />
      </div>
    );
  }

  // No cooking session - show start button
  if (!cookingSessionId) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-[#035035] bg-opacity-10 flex items-center justify-center">
              <PiCheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#035035]" />
            </div>
            <h2 className="font-poppins font-bold text-xl sm:text-2xl text-[#035035] mb-2 break-words px-4">
              Ready to Cook?
            </h2>
            <p className="text-sm sm:text-base text-[#2D2D2D]/70 mb-6 break-words px-4">
              Start a cooking session to get step-by-step guidance and access to the AI cooking assistant.
            </p>
          </div>
          <button
            onClick={handleStartCooking}
            className="bg-[#035035] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg min-h-[44px] text-sm sm:text-base"
            style={{
              transitionDuration: '300ms',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            Start Cooking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-4 sm:p-6 md:p-8">
        <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-[#035035] mb-2 break-words">
          Instructions
        </h2>
        <p className="text-sm sm:text-base text-[#2D2D2D]/70 mb-4 sm:mb-6 break-words">
          Follow these steps for the perfect Bolognese
        </p>

        <div className="space-y-4 sm:space-y-6">
          {instructions.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div
                key={index}
                className={`group relative ${isCompleted ? 'opacity-60' : ''}`}
              >
                {/* Step number circle */}
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-poppins font-bold text-base sm:text-lg shadow-md ${isCompleted
                      ? 'bg-[#A8C9B8] text-white'
                      : isCurrent
                        ? 'bg-[#035035] text-white ring-4 ring-[#035035] ring-opacity-20'
                        : 'bg-[#035035] text-white'
                      }`}>
                      {isCompleted ? <PiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : index + 1}
                    </div>
                    {index < instructions.length - 1 && (
                      <div className={`w-0.5 h-full mx-auto mt-2 ${isCompleted ? 'bg-[#A8C9B8]' : 'bg-[#A8C9B8] opacity-30'
                        }`} />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-6 sm:pb-8">
                    <h3 className="font-poppins font-semibold text-lg sm:text-xl text-[#035035] mb-2 break-words">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#2D2D2D] leading-relaxed break-words">
                      {step.description}
                    </p>
                    {step.timer && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#FFF8F0] rounded-full text-xs sm:text-sm text-[#FF9B7B] font-medium">
                        <span>⏱️</span>
                        <span>{step.timer} min</span>
                      </div>
                    )}

                    {/* Complete step button */}
                    {isCurrent && !isCompleted && (
                      <button
                        onClick={() => handleCompleteStep(index)}
                        className="mt-3 flex items-center gap-2 text-sm sm:text-base bg-[#035035] text-white px-4 sm:px-5 py-2 sm:py-3 rounded-full hover:scale-105 transition-all shadow-md min-h-[44px]"
                        style={{
                          transitionDuration: '300ms',
                          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                      >
                        <PiCheckCircle className="w-5 h-5" />
                        <span>{index === instructions.length - 1 ? 'Complete' : 'Next Step'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Finish Cooking Button */}
        {currentStep >= instructions.length && instructions.length > 0 && (
          <div className="mt-6 sm:mt-8 p-5 sm:p-6 bg-[#035035] bg-opacity-5 rounded-2xl border-2 border-[#035035] text-center">
            <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#035035] mb-2">
              🎉 Great Job!
            </h3>
            <p className="text-sm sm:text-base text-[#2D2D2D]/70 mb-5 sm:mb-6">
              You've completed all the steps. Enjoy your meal!
            </p>
            <button
              onClick={handleFinishCooking}
              className="bg-[#035035] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg min-h-[44px] text-sm sm:text-base"
              style={{
                transitionDuration: '300ms',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              Finish Cooking
            </button>
          </div>
        )}

        {/* AI Assistant Chat */}
        <div className="mt-6 sm:mt-8">
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full flex items-center justify-between p-4 bg-[#035035] text-white rounded-2xl hover:bg-[#046847] transition-colors shadow-md min-h-[44px]"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <PiChatCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="font-poppins font-semibold text-sm sm:text-base">AI Cooking Assistant</span>
            </div>
            <span className="text-sm flex-shrink-0">
              {showChat ? '▼' : '▶'}
            </span>
          </button>

          {showChat && (
            <div className="mt-4 p-4 sm:p-6 bg-white rounded-2xl border-2 border-[#035035]/20 shadow-lg">
              {/* Chat messages */}
              <div className="space-y-3 sm:space-y-4 mb-4 max-h-80 sm:max-h-96 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-sm sm:text-base text-[#2D2D2D]/60 text-center py-6 sm:py-8">
                    Ask me anything about this recipe! I'm here to help.
                  </p>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-2xl break-words ${message.type === 'user'
                          ? 'bg-[#035035] text-white'
                          : message.type === 'error'
                            ? 'bg-[#FF9B7B] bg-opacity-10 text-[#FF9B7B] border border-[#FF9B7B]'
                            : 'bg-[#F5F5F5] text-[#2D2D2D]'
                          }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#F5F5F5] p-3 rounded-2xl">
                      <LoadingSpinner size="small" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat input */}
              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 px-4 py-3 border-2 border-[#A8C9B8] rounded-full focus:outline-none focus:border-[#035035] transition-colors text-sm sm:text-base min-h-[44px]"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={!userQuestion.trim() || chatLoading}
                  className="bg-[#035035] text-white p-3 rounded-full hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                  style={{
                    transitionDuration: '300ms',
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <PiPaperPlaneRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Instructions;