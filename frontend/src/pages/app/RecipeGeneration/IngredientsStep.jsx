import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadIngredientImage, getSignedImageUrl } from '../../../api/filesApi';

const INGREDIENTS_PLACEHOLDER = 'Enter your ingredients, separated by commas...';

export default function IngredientsStep({
        onSubmit,
        onBack,
        initialIngredients = '',
        initialImageKey = '',
        initialInputMethod = 'text',
        loading = false,
}) {
        const { user } = useAuth();
        const [inputMethod, setInputMethod] = useState(initialInputMethod);
        const [ingredientsText, setIngredientsText] = useState(initialIngredients);
        const [uploadedImage, setUploadedImage] = useState(null);
        const [imageKey, setImageKey] = useState(initialImageKey);
        const [imagePreviewUrl, setImagePreviewUrl] = useState('');
        const [uploading, setUploading] = useState(false);
        const [validationError, setValidationError] = useState('');

        const validateIngredients = () => {
                if (inputMethod === 'text') {
                        if (!ingredientsText || ingredientsText.trim().length === 0) {
                                return 'Please enter your ingredients';
                        }
                        if (ingredientsText.trim().length < 3) {
                                return 'Please enter at least 3 characters';
                        }
                } else if (inputMethod === 'image') {
                        if (uploading) {
                                return 'Image upload in progress. Please wait.';
                        }
                        if (!uploadedImage && !imageKey) {
                                return 'Please upload an image of your ingredients';
                        }
                }
                return '';
        };

        const handleSubmit = (event) => {
                event.preventDefault();
                if (uploading) {
                        setValidationError('Image upload in progress. Please wait.');
                        return;
                }
                const error = validateIngredients();
                if (error) {
                        setValidationError(error);
                        return;
                }

                setValidationError('');
                if (inputMethod === 'text') {
                        onSubmit(ingredientsText.trim(), '');
                        return;
                }
                onSubmit('', imageKey);
        };

        const handleInputMethodChange = (method) => {
                setInputMethod(method);
                setValidationError('');
        };

        const handleTextChange = (event) => {
                setIngredientsText(event.target.value);
                if (validationError) {
                        setValidationError('');
                }
        };

        const handleSuccessfulUpload = useCallback((file, storageKey) => {
                setUploadedImage(file);
                setImageKey(storageKey);
                if (validationError) {
                        setValidationError('');
                }
        }, [validationError]);

        const uploadImage = useCallback(async (file) => {
                if (uploading) {
                        return;
                }

                if (!file) {
                        return;
                }

                if (!file.type.startsWith('image/')) {
                        setValidationError('Please upload a valid image file');
                        return;
                }

                if (!user?.id) {
                        setValidationError('You must be logged in to upload an image');
                        return;
                }

                setValidationError('');
                setUploading(true);
                try {
                        const storageKey = await uploadIngredientImage(user.id, file, 'ingredients');
                        handleSuccessfulUpload(file, storageKey);
                } catch (uploadError) {
                        console.error('Failed to upload image:', uploadError);
                        setUploadedImage(null);
                        setImageKey('');
                        setImagePreviewUrl('');
                        setValidationError('Failed to upload image. Please try again.');
                } finally {
                        setUploading(false);
                }
        }, [handleSuccessfulUpload, uploading, user?.id]);

        const handleImageUpload = (event) => {
                const file = event.target.files?.[0];
                uploadImage(file);
        };

        const handleDragOver = (event) => {
                event.preventDefault();
        };

        const handleDrop = (event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                uploadImage(file);
        };

        const handleRemoveImage = (event) => {
                event.stopPropagation();
                setUploadedImage(null);
                setImageKey('');
                setImagePreviewUrl('');
        };

        const triggerHiddenInput = () => {
                if (typeof document === 'undefined') {
                        return;
                }
                if (uploading) {
                        return;
                }
                document.getElementById('image-upload')?.click();
        };

        useEffect(() => {
                setInputMethod(initialInputMethod);
        }, [initialInputMethod]);

        useEffect(() => {
                setIngredientsText(initialIngredients);
        }, [initialIngredients]);

        useEffect(() => {
                if (!initialImageKey) {
                        return;
                }
                setImageKey(initialImageKey);
        }, [initialImageKey]);

        useEffect(() => {
                if (!imageKey || uploading) {
                        if (!imageKey) {
                                setImagePreviewUrl('');
                        }
                        return;
                }

                let isMounted = true;
                (async () => {
                        try {
                                const fileInfo = await getSignedImageUrl(imageKey);
                                if (isMounted) {
                                        setImagePreviewUrl(fileInfo?.signed_url || '');
                                }
                        } catch (error) {
                                console.error('Failed to load signed URL for image key:', imageKey, error);
                                if (isMounted) {
                                        setImagePreviewUrl('');
                                }
                        }
                })();

                return () => {
                        isMounted = false;
                };
        }, [imageKey, uploading]);

        return (
                <div>
                        <h2 className="text-3xl font-bold text-[#035035] mb-6 text-center">
                                What ingredients do you have?
                        </h2>
                        <p className="text-center text-[#2D2D2D] opacity-60 mb-8">
                                Tell us what's in your kitchen, or upload a photo
                        </p>

                        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto" aria-label="Ingredients input form">
                                <div className="flex gap-2 mb-6" role="tablist" aria-label="Ingredient input method">
                                        <button
                                                type="button"
                                                role="tab"
                                                id="text-input-tab"
                                                aria-selected={inputMethod === 'text'}
                                                aria-controls="text-input-panel"
                                                onClick={() => handleInputMethodChange('text')}
                                                onKeyDown={(event) => {
                                                        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                                                                event.preventDefault();
                                                                handleInputMethodChange('image');
                                                                document.getElementById('image-input-tab')?.focus();
                                                        }
                                                }}
                                                disabled={loading || uploading}
                                                className={`flex-1 px-6 py-3 rounded-full font-semibold text-base transition-all duration-200
                                                        ${inputMethod === 'text' ? 'bg-[#035035] text-white border-2 border-[#035035]' : 'bg-white text-[#035035] border-2 border-[#A8C9B8] hover:bg-[#A8C9B8] hover:text-white'}
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                `}
                                        >
                                                Text Input
                                        </button>
                                        <button
                                                type="button"
                                                role="tab"
                                                id="image-input-tab"
                                                aria-selected={inputMethod === 'image'}
                                                aria-controls="image-input-panel"
                                                onClick={() => handleInputMethodChange('image')}
                                                onKeyDown={(event) => {
                                                        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                                                                event.preventDefault();
                                                                handleInputMethodChange('text');
                                                                document.getElementById('text-input-tab')?.focus();
                                                        }
                                                }}
                                                disabled={loading || uploading}
                                                className={`flex-1 px-6 py-3 rounded-full font-semibold text-base transition-all duration-200
                                                        ${inputMethod === 'image' ? 'bg-[#035035] text-white border-2 border-[#035035]' : 'bg-white text-[#035035] border-2 border-[#A8C9B8] hover:bg-[#A8C9B8] hover:text-white'}
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                `}
                                        >
                                                Upload Image
                                        </button>
                                </div>

                                {inputMethod === 'text' && (
                                        <div id="text-input-panel" role="tabpanel" aria-labelledby="text-input-tab" className="mb-6">
                                                <label htmlFor="ingredients-input" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                        Enter your ingredients
                                                </label>
                                                <textarea
                                                        id="ingredients-input"
                                                        value={ingredientsText}
                                                        onChange={handleTextChange}
                                                        placeholder={INGREDIENTS_PLACEHOLDER}
                                                        disabled={loading || uploading}
                                                        rows={6}
                                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-vertical font-['Inter'] text-base min-h-[120px]
                                                                ${validationError ? 'border-[#FF9B7B] focus:border-[#FF9B7B]' : 'border-[#F5F5F5] focus:border-[#035035]'}
                                                                focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                        `}
                                                        aria-invalid={validationError ? 'true' : 'false'}
                                                        aria-describedby={validationError ? 'ingredients-error' : undefined}
                                                        aria-label="List of ingredients you have available"
                                                />
                                        </div>
                                )}

                                {inputMethod === 'image' && (
                                        <div id="image-input-panel" role="tabpanel" aria-labelledby="image-input-tab" className="mb-6">
                                                <label htmlFor="image-upload" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                        Upload an image of your ingredients
                                                </label>
                                                <div
                                                        onDragOver={handleDragOver}
                                                        onDrop={handleDrop}
                                                        className={`border-2 rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                                                                ${uploadedImage || imageKey ? 'border-[#035035] border-solid bg-[#FFF8F0]' : validationError ? 'border-[#FF9B7B] border-dashed hover:border-[#FF9B7B] hover:bg-[#FFF8F0]' : 'border-[#A8C9B8] border-dashed hover:border-[#035035] hover:bg-[#FFF8F0]'}
                                                        `}
                                                        onClick={triggerHiddenInput}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(event) => {
                                                                if (event.key === 'Enter' || event.key === ' ') {
                                                                        event.preventDefault();
                                                                        triggerHiddenInput();
                                                                }
                                                        }}
                                                        aria-label={uploadedImage || imageKey ? 'Image uploaded. Click to change image' : 'Click to upload image or drag and drop'}
                                                        aria-busy={uploading ? 'true' : 'false'}
                                                >
                                                        <input
                                                                id="image-upload"
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageUpload}
                                                                disabled={loading || uploading}
                                                                className="hidden"
                                                                aria-describedby={validationError ? 'ingredients-error' : undefined}
                                                                aria-label="Choose image file"
                                                        />

                                                        {uploading ? (
                                                                <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
                                                                        <svg className="w-12 h-12 text-[#A8C9B8] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                                                                        </svg>
                                                                        <p className="text-[#035035] font-semibold">Uploading image...</p>
                                                                        <p className="text-sm text-[#2D2D2D] opacity-60">This may take a moment</p>
                                                                </div>
                                                        ) : uploadedImage || imageKey ? (
                                                                <div className="flex flex-col items-center gap-3">
                                                                        <svg className="w-12 h-12 text-[#035035]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <div>
                                                                                <p className="text-[#035035] font-semibold">Image uploaded successfully</p>
                                                                                <p className="text-sm text-[#2D2D2D] opacity-60 mt-1">
                                                                                        {uploadedImage?.name || imageKey}
                                                                                </p>
                                                                        </div>
                                                                        {imagePreviewUrl && (
                                                                                <img
                                                                                        src={imagePreviewUrl}
                                                                                        alt="Uploaded ingredients preview"
                                                                                        className="max-w-full max-h-48 rounded-xl object-cover border border-[#E4E4E4]"
                                                                                />
                                                                        )}
                                                                        <button
                                                                                type="button"
                                                                                onClick={handleRemoveImage}
                                                                                className="text-sm text-[#FF9B7B] hover:underline focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2"
                                                                                aria-label="Remove uploaded image and choose a different one"
                                                                        >
                                                                                Remove and upload different image
                                                                        </button>
                                                                </div>
                                                        ) : (
                                                                <div className="flex flex-col items-center gap-3">
                                                                        <svg className="w-12 h-12 text-[#A8C9B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                        </svg>
                                                                        <div>
                                                                                <p className="text-[#035035] font-semibold">
                                                                                        Click to upload or drag and drop
                                                                                </p>
                                                                                <p className="text-sm text-[#2D2D2D] opacity-60 mt-1">
                                                                                        Upload a photo of your fridge or ingredients
                                                                                </p>
                                                                        </div>
                                                                </div>
                                                        )}
                                                </div>
                                        </div>
                                )}

                                {validationError && (
                                        <p
                                                id="ingredients-error"
                                                className="mb-6 text-sm text-[#FF9B7B]"
                                                role="alert"
                                                aria-live="polite"
                                        >
                                                {validationError}
                                        </p>
                                )}

                                <div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
                                        <button
                                                type="button"
                                                onClick={onBack}
                                                disabled={loading || uploading}
                                                className="w-full sm:w-auto bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold text-base
                                                        hover:bg-[#035035] hover:text-white transition-all duration-200
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                        min-w-[120px]"
                                                aria-label="Go back to prompt step"
                                        >
                                                Back
                                        </button>
                                        <button
                                                type="submit"
                                                disabled={loading || uploading}
                                                className="w-full sm:w-auto bg-[#035035] text-white px-6 py-3 rounded-full font-semibold text-base
                                                        hover:scale-105 active:scale-95 transition-all duration-200
                                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                        min-w-[160px]"
                                                aria-label="Generate recipe options based on your ingredients"
                                        >
                                                {loading ? 'Generating...' : uploading ? 'Uploading image...' : 'Generate Recipes'}
                                        </button>
                                </div>
                        </form>
                </div>
        );
}
