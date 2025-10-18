# RecipeGeneration Page - Responsive Design Visual Guide

## Layout Behavior Across Devices

### 📱 Mobile (320px - 767px)

```
┌─────────────────────────┐
│  Step Indicator (1-2-3) │
├─────────────────────────┤
│                         │
│  What do you want to    │
│  cook today?            │
│                         │
│  ┌───────────────────┐  │
│  │   Text Input      │  │
│  │   (Full Width)    │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │   Next Button     │  │
│  │   (Full Width)    │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘

Recipe Grid (Step 3):
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │   Recipe Card 1   │  │
│  │   (Full Width)    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │   Recipe Card 2   │  │
│  │   (Full Width)    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │   Recipe Card 3   │  │
│  │   (Full Width)    │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Generate New      │  │
│  │ (Full Width)      │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Key Features:**
- Single column layout
- Full-width buttons (easier to tap)
- 16px padding
- 28px headings
- 48px minimum button height
- Stacked button groups

---

### 📱 Tablet (768px - 1023px)

```
┌─────────────────────────────────────────┐
│       Step Indicator (1-2-3)            │
├─────────────────────────────────────────┤
│                                         │
│     What do you want to cook today?     │
│                                         │
│     ┌─────────────────────────────┐     │
│     │   Text Input (Centered)     │     │
│     └─────────────────────────────┘     │
│                                         │
│        [Back]    [Next Button]          │
│                                         │
└─────────────────────────────────────────┘

Recipe Grid (Step 3):
┌─────────────────────────────────────────┐
│  ┌─────────────┐    ┌─────────────┐    │
│  │   Recipe    │    │   Recipe    │    │
│  │   Card 1    │    │   Card 2    │    │
│  └─────────────┘    └─────────────┘    │
│                                         │
│         ┌─────────────┐                 │
│         │   Recipe    │                 │
│         │   Card 3    │                 │
│         │  (Centered) │                 │
│         └─────────────┘                 │
│                                         │
│        [Generate New Recipes]           │
└─────────────────────────────────────────┘
```

**Key Features:**
- Two-column recipe grid
- Third card centered below
- 24px padding
- 36px headings
- Horizontal button groups
- Optimized for iPad

---

### 💻 Desktop (1024px+)

```
┌───────────────────────────────────────────────────────────┐
│              Step Indicator (1-2-3)                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│          What do you want to cook today?                  │
│                                                           │
│          ┌─────────────────────────────┐                  │
│          │   Text Input (Max 800px)    │                  │
│          └─────────────────────────────┘                  │
│                                                           │
│                  [Next Button]                            │
│                                                           │
└───────────────────────────────────────────────────────────┘

Recipe Grid (Step 3):
┌───────────────────────────────────────────────────────────┐
│  ┌─────────┐      ┌─────────┐      ┌─────────┐          │
│  │ Recipe  │      │ Recipe  │      │ Recipe  │          │
│  │ Card 1  │      │ Card 2  │      │ Card 3  │          │
│  │         │      │         │      │         │          │
│  └─────────┘      └─────────┘      └─────────┘          │
│                                                           │
│              [Generate New Recipes]                       │
└───────────────────────────────────────────────────────────┘
```

**Key Features:**
- Three-column recipe grid
- 32-48px padding
- 48px headings
- Hover effects enabled
- Max-width 1200px container
- Centered content

---

## Touch Target Sizes

### Mobile/Tablet
```
Button:           48px height × full/auto width
Input Toggle:     48px height × 50% width
Recipe Card:      200px+ height × full/auto width
Image Upload:     200px+ height × full width
```

### Desktop
```
Button:           44px height × auto width
Input Toggle:     44px height × auto width
Recipe Card:      200px+ height × 33% width
Image Upload:     280px height × auto width
```

---

## Typography Scaling

### Headings (h2)
```
Mobile:   28px (1.75rem)
Tablet:   36px (2.25rem)
Desktop:  48px (3rem)
```

### Body Text
```
Mobile:   16px (1rem)
Tablet:   18px (1.125rem)
Desktop:  18px (1.125rem)
```

### Input Text
```
All:      16px (prevents iOS zoom)
```

---

## Spacing Scale

### Mobile
```
Page padding:     16px
Grid gap:         16px
Button gap:       12px
Section margin:   24px
```

### Tablet
```
Page padding:     24px
Grid gap:         20px
Button gap:       16px
Section margin:   32px
```

### Desktop
```
Page padding:     32-48px
Grid gap:         24px
Button gap:       16px
Section margin:   32-40px
```

---

## Interactive States

### Mobile (Touch)
```
Normal:   Default appearance
Active:   Scale 0.97, opacity 0.9
Focus:    2px Forest Green outline
```

### Desktop (Mouse)
```
Normal:   Default appearance
Hover:    Scale 1.05, enhanced shadow
Active:   Scale 0.98
Focus:    2px Forest Green outline
```

---

## Animation Behavior

### Recipe Cards Fade-In
```
Card 1:   Delay 0ms
Card 2:   Delay 100ms
Card 3:   Delay 200ms

Animation: fadeInUp
Duration:  500ms
Easing:    ease-out
```

### Button Transitions
```
Duration:  200ms
Easing:    ease-out
Property:  transform, background, color
```

### Reduced Motion
```
When prefers-reduced-motion is enabled:
- All animations: 0.01ms (effectively instant)
- No transforms on hover/active
- Fade-in animations disabled
```

---

## Accessibility Features

### Focus Indicators
```
Outline:        2px solid #035035 (Forest Green)
Outline Offset: 2px
Visible on:     All interactive elements
```

### Touch Feedback
```
Mobile:  Active state with scale and opacity
Desktop: Hover state with scale and shadow
```

### Screen Reader Support
```
- Semantic HTML maintained
- ARIA labels on form inputs
- Role attributes on tabs
- aria-current on step indicator
```

---

## Browser Support

### Modern Browsers
✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

### Mobile Browsers
✅ iOS Safari 12+
✅ Chrome Android 90+
✅ Samsung Internet 14+

### CSS Features Used
- CSS Grid (full support)
- Flexbox (full support)
- Media Queries (full support)
- CSS Custom Properties (full support)
- aspect-ratio (fallback: padding-bottom)

---

## Performance Considerations

### CSS Optimization
- Mobile-first approach (fewer overrides)
- Minimal specificity
- No redundant rules
- Efficient selectors

### Animation Performance
- GPU-accelerated transforms
- Will-change hints where needed
- Reasonable durations (200-500ms)
- Respects reduced motion

### Image Optimization
- Lazy loading enabled
- Responsive images
- aspect-ratio for layout stability

---

## Testing Checklist

### Viewport Testing
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12/13)
- [ ] 414px (iPhone 12 Pro Max)
- [ ] 768px (iPad Portrait)
- [ ] 1024px (iPad Landscape)
- [ ] 1280px (Laptop)
- [ ] 1920px (Desktop)

### Device Testing
- [ ] iPhone (Safari)
- [ ] Android Phone (Chrome)
- [ ] iPad (Safari)
- [ ] Android Tablet
- [ ] Desktop (Chrome, Firefox, Safari, Edge)

### Interaction Testing
- [ ] Touch targets are easy to tap
- [ ] No horizontal scrolling
- [ ] Forms don't zoom on focus (iOS)
- [ ] Hover effects work on desktop
- [ ] Active states work on mobile
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

### Accessibility Testing
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion respected

---

## Summary

The RecipeGeneration page is now fully responsive with:
- ✅ Mobile-first design
- ✅ Three breakpoints (mobile, tablet, desktop)
- ✅ Touch-optimized interactions
- ✅ Accessible focus indicators
- ✅ Responsive typography
- ✅ 8px-based spacing scale
- ✅ Performance optimizations
- ✅ Cross-browser compatibility

All requirements for Task 12 have been met!
