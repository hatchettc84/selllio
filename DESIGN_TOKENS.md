# Selllio Design Tokens Configuration

## How to Use This File

1. Open your Figma file in Dev Mode (Shift + D)
2. Select components and copy the values below
3. Update the CSS variables in `src/app/globals.css` with these values

---

## Color Palette

### Brand Colors (Update these from Figma)
```css
/* Primary Brand Color - Main purple/accent color */
--accent-primary: oklch(0.66 0.1972 300.41);  /* Currently: Light purple */
--accent-secondary: oklch(0.56 0.2726 294.48); /* Currently: Deep purple */

/* Update these hex codes from your Figma file */
Figma Primary: #______ (convert to OKLCH)
Figma Secondary: #______ (convert to OKLCH)
```

### Background Colors
```css
/* Light Mode */
--background: oklch(1 0 0);           /* White */
--foreground: oklch(0.14 0.0044 285.82); /* Dark text */

/* Dark Mode (Currently active) */
--background: oklch(0.14 0.0044 285.82); /* Very dark */
--foreground: oklch(0.985 0 0);        /* Near white text */

Figma Background (Light): #______
Figma Background (Dark): #______
Figma Text (Light): #______
Figma Text (Dark): #______
```

### UI Component Colors
```css
--card: oklch(0.205 0 0);              /* Card background (dark) */
--border: oklch(0.27 0.0055 286.03);   /* Border color */
--input: oklch(1 0 0 / 15%);          /* Input background */
--muted: oklch(0.27 0.0055 286.03);    /* Muted background */

Figma Card BG: #______
Figma Border: #______
Figma Input BG: #______
```

---

## Typography

### Font Family
```css
Current: Manrope (Google Font)

Figma Primary Font: ________________
Figma Secondary Font: ________________
```

### Font Sizes (Update from Figma)
```
H1: __px / __rem
H2: __px / __rem
H3: __px / __rem
H4: __px / __rem
Body: __px / __rem
Small: __px / __rem
Caption: __px / __rem
```

### Font Weights
```
Light: ___
Regular: ___
Medium: ___
Semibold: ___
Bold: ___
```

---

## Spacing System

### Current Base Radius
```css
--radius: 0.625rem (10px)
```

### Spacing Scale (Update from Figma)
```
xs: __px
sm: __px
md: __px
lg: __px
xl: __px
2xl: __px
```

---

## Border Radius

```css
--radius-sm: calc(var(--radius) - 4px);  /* 6px */
--radius-md: calc(var(--radius) - 2px);  /* 8px */
--radius-lg: var(--radius);              /* 10px */
--radius-xl: calc(var(--radius) + 4px);  /* 14px */

Figma Button Radius: __px
Figma Card Radius: __px
Figma Input Radius: __px
Figma Modal Radius: __px
```

---

## Shadows

### Current Shadows (Update from Figma)
```css
Box Shadow SM: ________________
Box Shadow MD: ________________
Box Shadow LG: ________________
Box Shadow XL: ________________
```

---

## Component-Specific Styles

### Buttons
```
Height: __px
Padding X: __px
Padding Y: __px
Font Size: __px
Font Weight: ___
Border Radius: __px
```

### Inputs
```
Height: __px
Padding X: __px
Padding Y: __px
Font Size: __px
Border Width: __px
Border Radius: __px
```

### Cards
```
Padding: __px
Border Radius: __px
Border Width: __px
Shadow: ________________
```

---

## Layout

### Container Widths
```
Mobile: __px
Tablet: __px
Desktop: __px
Wide: __px
```

### Breakpoints
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## Special Effects

### Icon Background Gradient (Current)
```css
.iconBackground {
  border: 0.5px solid #A76EF6;
  background: radial-gradient(80.86% 125% at 50% 45%, rgba(9, 9, 11, 0.08) 0%, rgba(135, 49, 255, 0.75) 100%);
}
```

**Update from Figma:**
- Gradient Color 1: #______
- Gradient Color 2: #______
- Border Color: #______

---

## How to Apply Changes

1. **Extract values from Figma**
2. **Convert hex to OKLCH** (use: https://oklch.com)
3. **Update `src/app/globals.css`** with new values
4. **Save and refresh** browser at http://localhost:3001

---

## Quick Hex to OKLCH Converter

For each color in Figma:
1. Copy hex code (e.g., #A76EF6)
2. Visit https://oklch.com
3. Paste hex and get OKLCH value
4. Update CSS variable

Example:
```
#A76EF6 → oklch(0.72 0.17 303)
```
