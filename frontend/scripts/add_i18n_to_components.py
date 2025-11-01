#!/usr/bin/env python3
"""
Script to automatically add i18n support to React components.
This script will add useTranslation hooks to components that don't have them yet.
"""

import os
import re
from pathlib import Path

# Base directory
FRONTEND_DIR = Path(__file__).parent.parent
SRC_DIR = FRONTEND_DIR / 'src'

# Component to namespace mapping
COMPONENT_NAMESPACES = {
    # Auth pages
    'LoginPage.jsx': ['auth'],
    'RegisterPage.jsx': ['auth'],
    'LoginFailedPage.jsx': ['auth'],
    'OAuthLoginFailedPage.jsx': ['auth'],
    'RegisterFailedPage.jsx': ['auth'],
    'OAuthCallbackPage.jsx': ['auth'],

    # Landing & Info pages
    'LandingPage.jsx': ['landing', 'common'],
    'AboutPage.jsx': ['pages', 'common'],
    'ContactPage.jsx': ['pages', 'common'],
    'PrivacyPage.jsx': ['pages', 'common'],
    'NotFoundPage.jsx': ['errors', 'common'],

    # Dashboard & App pages
    'Dashboard.jsx': ['dashboard', 'common'],
    'ProfileSettings.jsx': ['pages', 'common'],
    'RecipeLibrary.jsx': ['recipe', 'common'],
    'Recipe.jsx': ['recipe', 'common'],
    'RecipeView.jsx': ['recipe', 'common'],
    'Instructions.jsx': ['recipe', 'common'],
    'CollectionRecipesView.jsx': ['collection', 'recipe', 'common'],

    # Recipe Generation
    'index.jsx': ['recipe', 'common'],  # RecipeGeneration/index.jsx
    'PromptStep.jsx': ['recipe', 'common'],
    'IngredientsStep.jsx': ['recipe', 'common'],
    'RecipeOptionsStep.jsx': ['recipe', 'common'],

    # Components - Modals
    'DeleteRecipeModal.jsx': ['errors', 'common'],
    'DeleteCollectionModal.jsx': ['collection', 'common'],
    'EditCollectionNameModal.jsx': ['collection', 'common'],
    'SaveRecipesCollectionModal.jsx': ['collection', 'common'],
    'EditCollectionsModal.jsx': ['collection', 'common'],

    # Components - Other
    'ErrorMessage.jsx': ['errors'],
    'EmptyState.jsx': ['errors'],
    'CollectionCardMenu.jsx': ['collection', 'common'],
    'RecipeCardMenu.jsx': ['recipe', 'common'],
    'WakeWordDetection.jsx': ['errors'],
    'CollectionImageCollage.jsx': ['collection'],
    'RecipePreviewCard.jsx': ['recipe'],
    'LoadingSpinner.jsx': [],  # No translations needed
    'ProtectedRoute.jsx': [],  # No translations needed
}

def add_i18n_import(content):
    """Add useTranslation import if not present"""
    if 'useTranslation' in content:
        return content

    # Find the last import statement
    import_pattern = r'(import .+ from .+\n)'
    imports = list(re.finditer(import_pattern, content))

    if imports:
        last_import = imports[-1]
        insert_pos = last_import.end()
        i18n_import = "import { useTranslation } from 'react-i18next'\n"
        content = content[:insert_pos] + i18n_import + content[insert_pos:]

    return content

def add_translation_hook(content, namespaces):
    """Add useTranslation hook to component"""
    if not namespaces or 'useTranslation' in content:
        return content

    # Find the component function
    component_pattern = r'(export default function \w+\([^)]*\) \{)\n'
    match = re.search(component_pattern, content)

    if match:
        insert_pos = match.end()
        namespace_str = ', '.join([f"'{ns}'" for ns in namespaces])
        if len(namespaces) == 1:
            hook_line = f"  const {{ t }} = useTranslation('{namespaces[0]}')\n\n"
        else:
            hook_line = f"  const {{ t }} = useTranslation([{namespace_str}])\n\n"
        content = content[:insert_pos] + hook_line + content[insert_pos:]

    return content

def process_component(file_path, namespaces):
    """Process a single component file"""
    if not file_path.exists():
        print(f"⏭️  Skipping {file_path.name} (not found)")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already has i18n
    if 'useTranslation' in content:
        print(f"✅ {file_path.name} already has i18n")
        return False

    # Skip if no namespaces (component doesn't need translations)
    if not namespaces:
        print(f"⏭️  Skipping {file_path.name} (no translations needed)")
        return False

    # Add i18n
    content = add_i18n_import(content)
    content = add_translation_hook(content, namespaces)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✨ Updated {file_path.name} with i18n hook")
    return True

def main():
    print("🌐 Adding i18n support to components...\n")

    updated_count = 0

    # Process all components
    for filename, namespaces in COMPONENT_NAMESPACES.items():
        # Search for the file in src directory
        matches = list(SRC_DIR.rglob(filename))

        if not matches:
            print(f"⚠️  Could not find {filename}")
            continue

        for file_path in matches:
            if process_component(file_path, namespaces):
                updated_count += 1

    print(f"\n✅ Done! Updated {updated_count} components with i18n support.")
    print("\n📝 Next steps:")
    print("1. Review the changes in each file")
    print("2. Replace hardcoded strings with t() calls")
    print("3. Test the language switching functionality")

if __name__ == '__main__':
    main()
