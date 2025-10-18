# Piattio Brand Style Guide

## Brand Overview
Piattio combines playful, cartoon-like aesthetics with elevated sophistication. The brand balances whimsy with refinement, creating an approachable yet premium experience.

---

## Color Palette

### Primary Colors

**Forest Green** (Brand Primary)
- HEX: `#035035`
- RGB: `3, 80, 53`
- Usage: Primary brand color, headers, key CTAs, logo

**Coral Sunset** (Brand Secondary)
- HEX: `#FF9B7B`
- RGB: `255, 155, 123`
- Usage: Accents, highlights, interactive elements, secondary CTAs

### Supporting Colors

**Cream**
- HEX: `#FFF8F0`
- RGB: `255, 248, 240`
- Usage: Backgrounds, cards, soft containers

**Sage Green**
- HEX: `#A8C9B8`
- RGB: `168, 201, 184`
- Usage: Subtle backgrounds, borders, secondary elements

**Warm White**
- HEX: `#FFFFFF`
- RGB: `255, 255, 255`
- Usage: Primary background, content areas

**Charcoal**
- HEX: `#2D2D2D`
- RGB: `45, 45, 45`
- Usage: Body text, dark elements

**Soft Gray**
- HEX: `#F5F5F5`
- RGB: `245, 245, 245`
- Usage: Subtle dividers, disabled states

---

## Typography

### Font Recommendations

**Display/Headings**
- Primary: Poppins (Bold, SemiBold)
- Alternative: Quicksand, Fredoka
- Characteristics: Rounded, friendly, clear

**Body Text**
- Primary: Inter (Regular, Medium)
- Alternative: Open Sans, Nunito
- Characteristics: Clean, readable, modern

**Accent/Special**
- Script Font (like logo): Pacifico, Dancing Script
- Usage: Special headings, highlights, decorative elements (use sparingly)

### Type Scale
```
Hero/H1: 48px - 64px (Bold)
H2: 36px - 48px (SemiBold)
H3: 28px - 32px (SemiBold)
H4: 24px (Medium)
H5: 20px (Medium)
Body Large: 18px (Regular)
Body: 16px (Regular)
Body Small: 14px (Regular)
Caption: 12px (Regular)
```

### Typography Guidelines
- Line height: 1.5-1.6 for body text
- Letter spacing: Slightly increased for headings (+0.02em)
- Use sentence case for most headings (not ALL CAPS)
- Limit line length to 65-75 characters for optimal readability

---

## Visual Style

### Illustration Style

**Characteristics:**
- Cartoon-like, simplified forms
- Rounded edges and soft corners
- Clipart aesthetic with hand-drawn quality
- Playful but not childish
- Clean linework (2-3px weight)

**Elements to Include:**
- Decorative swirls and flourishes (inspired by logo)
- Circular motifs and dots
- Food-related illustrations (if applicable)
- Nature elements (leaves, flowers)
- Geometric patterns with organic feel

**Style References:**
- Flat design with subtle depth
- Limited use of gradients (soft, subtle when used)
- Textured overlays for added warmth
- Playful character illustrations

### Iconography

**Style:**
- Rounded, friendly icons
- 2px stroke weight
- Minimal detail
- Consistent corner radius (2-3px)
- Can be filled or outlined depending on context

**Icon Set Recommendations:**
- Phosphor Icons (Rounded variant)
- Feather Icons (with modifications)
- Custom icons matching brand aesthetic

---

## Animation Principles

### Motion Philosophy
Animations should feel **bouncy, delightful, and responsive** while maintaining elegance.

### Animation Types

**Micro-interactions**
- Button hovers: Gentle scale (1.05x) + color shift
- Card hovers: Lift effect with soft shadow
- Icon animations: Playful bounce or wiggle
- Duration: 200-300ms
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce)

**Transitions**
- Page transitions: Fade + slight slide (20-30px)
- Modal entrances: Scale from 0.95 → 1.0 with fade
- Duration: 300-400ms
- Easing: `ease-out`

**Scroll Animations**
- Stagger reveals for content
- Parallax effects for decorative elements
- Fade + slide up for cards
- Duration: 400-600ms

**Loading States**
- Playful loaders (bouncing circles, animated illustrations)
- Skeleton screens with shimmer effect
- Progress indicators with personality

### Animation Guidelines
- Never sacrifice usability for delight
- Respect prefers-reduced-motion settings
- Keep animations under 600ms for interactions
- Use animation to guide attention and provide feedback
- Add personality without overwhelming

---

## Component Patterns

### Buttons

**Primary Button**
```
Background: Forest Green (#035035)
Text: White
Hover: Lighter green + scale (1.05x)
Border radius: 24px (fully rounded)
Padding: 12px 32px
Font: SemiBold, 16px
Shadow: 0 2px 8px rgba(3, 80, 53, 0.2)
```

**Secondary Button**
```
Background: Coral Sunset (#FF9B7B)
Text: White
Hover: Deeper coral + scale
Border radius: 24px
Padding: 12px 32px
```

**Tertiary Button**
```
Background: Transparent
Text: Forest Green
Border: 2px solid Forest Green
Hover: Background Forest Green, Text White
```

### Cards

**Characteristics:**
- Border radius: 16-24px
- Soft shadows: `0 4px 12px rgba(0, 0, 0, 0.08)`
- Hover lift: Transform Y -4px + stronger shadow
- White or Cream background
- Optional decorative corner element (swirl or dot pattern)

### Forms

**Input Fields:**
- Border radius: 12px
- Border: 2px solid Soft Gray
- Focus: Border changes to Forest Green
- Padding: 12px 16px
- Placeholder: Soft Gray text

**Form Style:**
- Floating labels or top-aligned labels
- Clear error states (Coral color)
- Success states (Forest Green)
- Helpful microcopy

---

## Decorative Elements

### Patterns
- Circular dot patterns (from logo inspiration)
- Swirl motifs for section dividers
- Organic shapes as backgrounds
- Scalloped edges for cards/sections

### Usage
- Background decorations should be subtle (10-15% opacity)
- Use sparingly to avoid clutter
- Position decoratively but don't interfere with content
- Animate on scroll for added delight

---

## Photography & Imagery

### Photo Style
- Bright, well-lit
- Warm tones that complement color palette
- Natural, candid moments
- Soft focus backgrounds
- Food photography: Overhead shots, styled but approachable

### Image Treatment
- Rounded corners (16px minimum)
- Optional illustrated frame/border
- Subtle overlays when text is present
- Maintain high quality (no pixelation)

---

## Spacing & Layout

### Spacing Scale (8px base)
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
4xl: 96px
```

### Grid
- 12-column grid
- Maximum content width: 1200px
- Comfortable padding: 24px mobile, 48px desktop
- Generous whitespace between sections

---

## Responsive Design & Mobile Optimization

### Design Philosophy
All code and interfaces must be **fully optimized for both desktop/laptop and mobile phone usage**. The experience should feel native and intuitive on every device.

### Breakpoints
```
Mobile: 320px - 767px
Tablet: 768px - 1023px
Desktop: 1024px - 1440px
Large Desktop: 1441px+
```

### Mobile-First Approach
- **Design mobile first**, then scale up
- Core functionality must work perfectly on small screens
- Progressive enhancement for larger screens
- Touch targets minimum 44x44px

### Responsive Typography
```
Mobile:
  Hero/H1: 32px - 40px
  H2: 24px - 28px
  H3: 20px - 24px
  H4: 18px
  Body: 16px
  
Desktop:
  Hero/H1: 48px - 64px
  H2: 36px - 48px
  H3: 28px - 32px
  H4: 24px
  Body: 16px - 18px
```

### Navigation Patterns

**Mobile:**
- Hamburger menu or bottom navigation bar
- Collapsible sections
- Single-column layouts
- Sticky headers (max 60px height)

**Desktop:**
- Full horizontal navigation
- Multi-column layouts where appropriate
- Hover states and interactions
- Sidebar navigation (optional)

### Touch & Interaction

**Mobile Considerations:**
- Minimum touch target: 44x44px
- Adequate spacing between clickable elements (8px minimum)
- Swipe gestures for carousels and navigation
- Pull-to-refresh where appropriate
- Avoid hover-dependent interactions
- Bottom-aligned primary actions (easier to reach)

**Desktop Considerations:**
- Hover states for all interactive elements
- Keyboard shortcuts
- Cursor indicators (pointer for clickable)
- Larger click targets acceptable (32x32px minimum)

### Component Responsiveness

**Buttons:**
- Mobile: Full-width or flexible width, min height 48px
- Desktop: Auto width with padding, min height 44px

**Cards:**
- Mobile: Stack vertically, full-width with margin
- Tablet: 2-column grid
- Desktop: 3-4 column grid

**Forms:**
- Mobile: Single column, full-width inputs, larger text (16px to prevent zoom)
- Desktop: Can use multi-column layouts, standard sizing

**Images:**
- Always use responsive images (srcset, picture element)
- Mobile: Full-width or contained, optimized file sizes
- Desktop: Flexible sizing, higher quality acceptable
- Lazy loading for performance

### Performance Optimization

**Mobile-Specific:**
- Minimize bundle sizes (code splitting)
- Optimize images (WebP format, compressed)
- Reduce animation complexity on low-end devices
- Lazy load off-screen content
- Minimize third-party scripts
- Target: < 3s initial load on 3G

**Desktop-Specific:**
- Can afford richer animations
- Higher resolution assets
- More aggressive prefetching
- Target: < 1.5s initial load

### Layout Patterns

**Mobile:**
```css
.container {
  padding: 16px;
  max-width: 100%;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

**Desktop:**
```css
.container {
  padding: 48px;
  max-width: 1200px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
```

### Testing Requirements
- **Test on real devices**, not just browser dev tools
- iOS Safari (iPhone)
- Android Chrome (various screen sizes)
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablet devices (iPad, Android tablets)
- Test in both portrait and landscape orientations
- Verify performance on mid-range devices

### Media Queries Example
```css
/* Mobile-first approach */
.element {
  font-size: 16px;
  padding: 16px;
}

/* Tablet */
@media (min-width: 768px) {
  .element {
    font-size: 18px;
    padding: 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .element {
    font-size: 20px;
    padding: 32px;
  }
}

/* Touch device specific */
@media (hover: none) and (pointer: coarse) {
  .element {
    /* Mobile/tablet touch optimizations */
  }
}

/* Hover-capable devices */
@media (hover: hover) and (pointer: fine) {
  .element:hover {
    /* Desktop hover effects */
  }
}
```

### Responsive Design Checklist
- ✓ All layouts work from 320px to 1920px+ width
- ✓ Touch targets meet minimum size requirements
- ✓ Typography scales appropriately
- ✓ Images are responsive and optimized
- ✓ Navigation adapts to screen size
- ✓ Forms are easy to complete on mobile
- ✓ Performance is optimized for mobile networks
- ✓ No horizontal scrolling (unless intentional)
- ✓ Content is readable without zooming
- ✓ Tested on real devices

---

## Accessibility

### Requirements
- WCAG 2.1 AA compliance minimum
- Color contrast ratio: 4.5:1 for body text, 3:1 for large text
- Keyboard navigation support
- Focus indicators (2px Forest Green outline)
- Alt text for all images
- Semantic HTML
- Screen reader compatible

---

## Brand Voice

### Tone
- Friendly but not overly casual
- Knowledgeable but approachable
- Playful but professional
- Warm and inviting
- Clear and helpful

### Writing Guidelines
- Use contractions (we're, it's)
- Active voice preferred
- Short sentences and paragraphs
- Conversational but polished
- Occasional playful language/puns (used sparingly)

---

## Do's and Don'ts

### Do's ✓
- Maintain generous whitespace
- Use playful animations thoughtfully
- Keep illustrations consistent in style
- Layer depth subtly
- Make interactions feel responsive
- Use rounded corners throughout
- Incorporate decorative elements sparingly
- Design mobile-first, then scale up
- Test on real devices regularly
- Optimize performance for mobile networks

### Don'ts ✗
- Overuse animations (avoid chaos)
- Mix conflicting illustration styles
- Use harsh shadows or angles
- Overcrowd the interface
- Use more than 3 font families
- Ignore accessibility
- Make animations too slow (>600ms for interactions)
- Rely on hover states for mobile interactions
- Create touch targets smaller than 44x44px
- Forget to test on actual mobile devices

---

## Implementation Notes

### CSS Custom Properties Example
```css
:root {
  /* Colors */
  --color-primary: #035035;
  --color-secondary: #FF9B7B;
  --color-cream: #FFF8F0;
  --color-sage: #A8C9B8;
  --color-white: #FFFFFF;
  --color-charcoal: #2D2D2D;
  --color-gray: #F5F5F5;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  
  /* Animation */
  --transition-fast: 200ms;
  --transition-base: 300ms;
  --transition-slow: 400ms;
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## Version History
- v1.1 - October 2025 - Added responsive design and mobile optimization guidelines
- v1.0 - October 2025 - Initial style guide created

---

*This style guide is a living document and should be updated as the Piattio brand evolves.*