import { useState } from 'react';

const PROMPT_PLACEHOLDER = 'e.g., Something healthy for dinner, Quick pasta dish, Comfort food...';

export default function PromptStep({ onSubmit, initialValue = '', loading = false }) {
        const [promptText, setPromptText] = useState(initialValue);
        const [validationError, setValidationError] = useState('');

        const validatePrompt = (value) => {
                if (!value || value.trim().length === 0) {
                        return 'Please tell us what you want to cook';
                }
                if (value.trim().length < 3) {
                        return 'Please enter at least 3 characters';
                }
                return '';
        };

        const handleSubmit = (event) => {
                event.preventDefault();
                const error = validatePrompt(promptText);
                if (error) {
                        setValidationError(error);
                        return;
                }

                setValidationError('');
                onSubmit(promptText.trim());
        };

        const handleInputChange = (event) => {
                setPromptText(event.target.value);
                if (validationError) {
                        setValidationError('');
                }
        };

        return (
                <div>
                        <h2 className="text-3xl font-bold text-[#035035] mb-6 text-center">
                                What do you want to cook today?
                        </h2>
                        <p className="text-center text-[#2D2D2D] opacity-60 mb-8">
                                Describe what you're in the mood for, and we'll help you create the perfect recipe
                        </p>

                        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto" aria-label="Recipe prompt form">
                                <div className="mb-6">
                                        <label htmlFor="prompt-input" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                What do you want to cook?
                                        </label>
                                        <textarea
                                                id="prompt-input"
                                                value={promptText}
                                                onChange={handleInputChange}
                                                placeholder={PROMPT_PLACEHOLDER}
                                                disabled={loading}
                                                rows={4}
                                                className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none font-['Inter'] text-base
                                                        ${validationError ? 'border-[#FF9B7B] focus:border-[#FF9B7B]' : 'border-[#F5F5F5] focus:border-[#035035]'}
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                `}
                                                aria-invalid={validationError ? 'true' : 'false'}
                                                aria-describedby={validationError ? 'prompt-error' : undefined}
                                                aria-label="Enter what you want to cook"
                                        />
                                        {validationError && (
                                                <p
                                                        id="prompt-error"
                                                        className="mt-2 text-sm text-[#FF9B7B]"
                                                        role="alert"
                                                        aria-live="polite"
                                                >
                                                        {validationError}
                                                </p>
                                        )}
                                </div>

                                <div className="flex justify-center">
                                        <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-[#035035] text-white px-8 py-3 rounded-full font-semibold text-base
                                                        hover:scale-105 active:scale-95 transition-all duration-200
                                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                        min-w-[120px]
                                                "
                                                aria-label="Proceed to ingredients step"
                                        >
                                                {loading ? 'Loading...' : 'Next'}
                                        </button>
                                </div>
                        </form>
                </div>
        );
}
