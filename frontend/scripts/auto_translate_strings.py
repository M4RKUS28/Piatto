#!/usr/bin/env python3
"""
Automatically replace hardcoded strings with t() calls in critical components.
This focuses on the most visible user-facing pages.
"""

import re
import json
from pathlib import Path

FRONTEND_DIR = Path(__file__).parent.parent
SRC_DIR = FRONTEND_DIR / 'src'

# Simple string replacements for critical pages
REPLACEMENTS = {
    'LandingPage.jsx': {
        'namespace': 'landing',
        'add_namespace': 'common',
        'replacements': [
            ('"AI-Powered Cooking Assistant"', "t('hero.badge')"),
            ('"Your Personal Chef, Right in Your Pocket"', "t('hero.title')"),
            ('"Discover personalized recipes, get step-by-step cooking guidance, and turn your kitchen into a culinary playground with AI-powered creativity."', "t('hero.description')"),
            ('"Start Cooking"', "t('buttons.startCooking', { ns: 'common' })"),
            ('"Explore Recipes"', "t('buttons.exploreRecipes', { ns: 'common' })"),
            ('"AI Recipe Generator"', "t('hero.aiRecipeGenerator')"),
            ('"Custom recipes for your taste"', "t('hero.aiRecipeGeneratorDesc')"),
            ('"Interactive Guide"', "t('hero.interactiveGuide')"),
            ('"Step-by-step instructions"', "t('hero.interactiveGuideDesc')"),
            ('"Discover"', "t('mockup.discover')"),
            ('"What would you like to cook today?"', "t('mockup.whatToCook')"),
            ('"Start Cooking →"', "t('mockup.startCooking')"),
            ('"How It Works"', "t('howItWorks.title')"),
            ('"From idea to delicious meal in three simple steps"', "t('howItWorks.subtitle')"),
            ('"Share Your Preferences"', "t('howItWorks.step1.title')"),
            ('"Tell us what you\'re craving, dietary restrictions, available ingredients, or cooking time. Our AI understands your needs."', "t('howItWorks.step1.description')"),
            ('"Get Personalized Recipes"', "t('howItWorks.step2.title')"),
            ('"Receive custom recipes tailored to your taste, skill level, and kitchen setup. Save favorites to your personal collection."', "t('howItWorks.step2.description')"),
            ('"Cook with Confidence"', "t('howItWorks.step3.title')"),
            ('"Follow interactive step-by-step guidance with tips, timers, and voice assistance. Create amazing dishes every time."', "t('howItWorks.step3.description')"),
            ('"Cooking Made Simple & Fun"', "t('features.title')"),
            ('"From inspiration to the final dish, we guide you every step of the way"', "t('features.subtitle')"),
            ('"AI Recipe Brainstorming"', "t('features.aiBrainstorming.title')"),
            ('"Tell us your preferences, dietary needs, or what\'s in your fridge. Our AI creates personalized recipes just for you, tailored to your taste and skill level."', "t('features.aiBrainstorming.description')"),
            ('"Interactive Cooking Guide"', "t('features.cookingGuide.title')"),
            ('"Follow along with step-by-step instructions, helpful tips, and voice assistance. Cook with confidence, no matter your experience level."', "t('features.cookingGuide.description')"),
            ('"Ready to Transform Your Cooking?"', "t('cta.title')"),
            ('"Join thousands of home chefs discovering the joy of personalized, guided cooking"', "t('cta.subtitle')"),
            ('"Download Piatto Free"', "t('cta.button')"),
        ]
    },
    'Dashboard.jsx': {
        'namespace': 'dashboard',
        'add_namespace': 'common',
        'replacements': [
            ('"Welcome back, "', "t('welcome') + ', '"),
            ('"Chef"', "t('chef')"),
            ('"Let\'s cook something delicious today"', "t('subtitle')"),
            ('"RecipeLibrary Saved"', "t('stats.recipesSaved')"),
            ('"Cooked This Week"', "t('stats.cookedThisWeek')"),
            ('"Avg Cook Time"', "t('stats.avgCookTime')"),
            ('"Streak Days"', "t('stats.streakDays')"),
            ('"Recent Recipes"', "t('recentRecipes')"),
            ('"Generate Recipe"', "t('buttons.generateRecipe', { ns: 'common' })"),
            ('"Find New Recipes"', "t('buttons.findNewRecipes', { ns: 'common' })"),
            ('"Profile Settings"', "t('buttons.profileSettings', { ns: 'common' })"),
        ]
    },
}

def update_component_hook(content, namespace, add_namespace=None):
    """Update the useTranslation hook to use correct namespace(s)"""
    if add_namespace:
        # Multiple namespaces
        pattern = r"const \{ t \} = useTranslation\('[\w]+'\)"
        replacement = f"const {{ t }} = useTranslation(['{namespace}', '{add_namespace}'])"
    else:
        # Single namespace
        pattern = r"const \{ t \} = useTranslation\('[\w]+'\)"
        replacement = f"const {{ t }} = useTranslation('{namespace}')"

    content = re.sub(pattern, replacement, content)
    return content

def process_file(file_path, config):
    """Process a single file with replacements"""
    if not file_path.exists():
        print(f"⏭️  File not found: {file_path}")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update useTranslation hook
    content = update_component_hook(
        content,
        config['namespace'],
        config.get('add_namespace')
    )

    # Apply replacements
    for old_str, new_str in config['replacements']:
        if old_str in content:
            content = content.replace(old_str, '{' + new_str + '}')
            print(f"    ✓ Replaced: {old_str[:50]}...")

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return True

def main():
    print("🌐 Auto-translating critical components...\n")

    for filename, config in REPLACEMENTS.items():
        print(f"📄 Processing {filename}...")

        # Find the file
        matches = list(SRC_DIR.rglob(filename))

        if not matches:
            print(f"   ⚠️  File not found\n")
            continue

        for file_path in matches:
            if process_file(file_path, config):
                print(f"   ✅ Updated successfully\n")
            else:
                print(f"   ❌ Failed\n")

    print("✅ Done!")

if __name__ == '__main__':
    main()
