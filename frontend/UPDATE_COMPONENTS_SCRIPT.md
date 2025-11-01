# i18n Component Update Script

This document outlines which components still need to be updated to use i18n translations.

## ✅ COMPLETED
1. `/src/main.jsx` - i18n initialized
2. `/src/components/Header.jsx` - Fully translated
3. `/src/components/Footer.jsx` - Fully translated with language selector

## 📝 COMPONENTS TO UPDATE

### High Priority (User-Facing)

#### Auth Pages
- [ ] `/src/pages/auth/LoginPage.jsx` - Use `auth` namespace
- [ ] `/src/pages/auth/RegisterPage.jsx` - Use `auth` namespace
- [ ] `/src/pages/auth/LoginFailedPage.jsx` - Use `auth` namespace
- [ ] `/src/pages/auth/OAuthLoginFailedPage.jsx` - Use `auth` namespace
- [ ] `/src/pages/auth/RegisterFailedPage.jsx` - Use `auth` namespace

#### Landing & Info Pages
- [ ] `/src/pages/LandingPage.jsx` - Use `landing` namespace
- [ ] `/src/pages/AboutPage.jsx` - Use `pages` namespace
- [ ] `/src/pages/ContactPage.jsx` - Use `pages` namespace
- [ ] `/src/pages/PrivacyPage.jsx` - Use `pages` namespace
- [ ] `/src/pages/NotFoundPage.jsx` - Use `errors` namespace

#### Dashboard & App Pages
- [ ] `/src/pages/app/Dashboard.jsx` - Use `dashboard` namespace
- [ ] `/src/pages/app/ProfileSettings.jsx` - Use `pages` namespace + language selector
- [ ] `/src/pages/app/RecipeLibrary.jsx` - Use `recipe` namespace
- [ ] `/src/pages/app/Recipe.jsx` - Use `recipe` namespace
- [ ] `/src/pages/app/RecipeView.jsx` - Use `recipe` namespace
- [ ] `/src/pages/app/Instructions.jsx` - Use `recipe` namespace
- [ ] `/src/pages/app/CollectionRecipesView.jsx` - Use `collection` namespace

#### Recipe Generation
- [ ] `/src/pages/app/RecipeGeneration/index.jsx` - Use `recipe` namespace
- [ ] `/src/pages/app/RecipeGeneration/PromptStep.jsx` - Use `recipe` namespace
- [ ] `/src/pages/app/RecipeGeneration/IngredientsStep.jsx` - Use `recipe` namespace
- [ ] `/src/pages/app/RecipeGeneration/RecipeOptionsStep.jsx` - Use `recipe` namespace

#### Components - Modals
- [ ] `/src/components/DeleteRecipeModal.jsx` - Use `errors` namespace
- [ ] `/src/components/DeleteCollectionModal.jsx` - Use `collection` namespace
- [ ] `/src/components/EditCollectionNameModal.jsx` - Use `collection` namespace
- [ ] `/src/components/SaveRecipesCollectionModal.jsx` - Use `collection` namespace
- [ ] `/src/components/EditCollectionsModal.jsx` - Use `collection` namespace

#### Components - Other
- [ ] `/src/components/ErrorMessage.jsx` - Use `errors` namespace
- [ ] `/src/components/EmptyState.jsx` - Use `errors` namespace
- [ ] `/src/components/CollectionCardMenu.jsx` - Use `collection` namespace
- [ ] `/src/components/RecipeCardMenu.jsx` - Use `recipe` namespace
- [ ] `/src/components/WakeWordDetection.jsx` - Use `errors` namespace (for error messages)

## 🔧 UPDATE PATTERN

For each component, follow this pattern:

```javascript
// 1. Add import at the top
import { useTranslation } from 'react-i18next'

// 2. Inside component function, add hook
const { t } = useTranslation('namespace-name') // or multiple: ['common', 'recipe']

// 3. Replace hardcoded strings with t() calls
// Old: <button>Save Changes</button>
// New: <button>{t('saveChanges')}</button>

// 4. For dynamic strings with variables
// Old: `Welcome back, ${username}!`
// New: t('welcome', { username })
// Make sure translation file has: "welcome": "Welcome back, {{username}}!"
```

## 🌐 NAMESPACES

- `common` - Shared UI elements (buttons, navigation, footer, time, difficulty)
- `landing` - Landing page content
- `auth` - Login, register, OAuth pages
- `dashboard` - Dashboard stats and content
- `recipe` - All recipe-related pages and generation
- `collection` - Collection management and views
- `errors` - Error messages, empty states, not found
- `pages` - About, Contact, Privacy, Profile Settings

## 📋 QUICK REFERENCE

### Common Translation Keys
```javascript
// Buttons
t('buttons.save')         // Save
t('buttons.cancel')       // Cancel
t('buttons.delete')       // Delete
t('buttons.edit')         // Edit
t('buttons.back')         // Back
t('buttons.next')         // Next

// Time
t('time.min')             // min
t('time.minutes')         // minutes

// Difficulty
t('difficulty.easy')      // Easy
t('difficulty.medium')    // Medium
t('difficulty.hard')      // Hard

// Language
t('language.label')       // Language
t('language.english')     // English
t('language.german')      // German
```
