---
name: Red Noir
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#e4bdbb'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#ab8886'
  outline-variant: '#5b403e'
  surface-tint: '#ffb3af'
  primary: '#ffb3af'
  on-primary: '#68000e'
  primary-container: '#c0182a'
  on-primary-container: '#ffd3d0'
  inverse-primary: '#bb1327'
  secondary: '#ffb3b0'
  on-secondary: '#680010'
  secondary-container: '#cd022a'
  on-secondary-container: '#ffdcda'
  tertiary: '#c8c5cb'
  on-tertiary: '#303034'
  tertiary-container: '#626166'
  on-tertiary-container: '#e0dde2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3af'
  on-primary-fixed: '#410006'
  on-primary-fixed-variant: '#930019'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b0'
  on-secondary-fixed: '#410006'
  on-secondary-fixed-variant: '#93001b'
  tertiary-fixed: '#e4e1e7'
  tertiary-fixed-dim: '#c8c5cb'
  on-tertiary-fixed: '#1b1b1f'
  on-tertiary-fixed-variant: '#47464b'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-sm:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system embodies a disciplined, editorial dark-professional aesthetic tailored for a high-end software services agency. The personality is authoritative, precise, and technologically sophisticated. 

The visual strategy relies on a "Noir" foundation where negative space is used as a structural element rather than a void. High-impact typography and a controlled application of Brand Red (restricted to less than 15% of the total surface area) create a sense of focused energy and urgency without compromising the professional atmosphere. The style merges **Modern Minimalism** with **High-Contrast** accents, utilizing subtle glassmorphism and light-emissive effects (glows) to denote activity and premium status.

## Colors
The palette is rooted in deep obsidian tones to establish a tiered depth system.
- **Deep Noir (#0A0A0B):** Used for base backgrounds and total immersion zones.
- **Page Background (#111113):** The standard canvas for all content.
- **Card Background (#16161A):** Specifically for elevated surfaces and containers.
- **Brand Red (#C0182A):** The primary action color for CTAs, indicators, and focus states.
- **Crimson Accent (#E8243A):** Used for micro-interactions, icons, and high-frequency highlights.
- **Text:** Headings utilize a crisp off-white for maximum legibility, while body text is softened to a cool grey to reduce eye strain in dark mode.

## Typography
The typographic hierarchy creates a sharp contrast between technical precision and bold editorial flair. 
- **Display & Headings:** Use Sora with bold weights and tight letter-spacing to command attention. 
- **Body:** Inter provides a neutral, highly legible foundation for long-form content and descriptions.
- **Technical/Stats:** JetBrains Mono is reserved for numerical data, code snippets, and small labels to reinforce the "Tech Agency" identity.

## Layout & Spacing
The system uses a 12-column fluid grid for desktop and a 4-column grid for mobile. 
- **Rhythm:** All spacing is derived from an 8px base unit.
- **Margins:** Large horizontal margins on desktop (64px) ensure content feels exclusive and centered.
- **Density:** Elements should maintain high "breathing room" to uphold the minimalist aesthetic. Use padding of at least 32px-48px for sections to separate service offerings.

## Elevation & Depth
Depth is communicated through color stepping rather than heavy shadows.
- **Level 0:** Deep Noir (#0A0A0B) - Backdrop for modals or footers.
- **Level 1:** Page Background (#111113) - The primary interface layer.
- **Level 2:** Card Surface (#16161A) - Interactive containers.
- **Glow Effects:** Use a 20% opacity Brand Red glow (`box-shadow: 0 0 20px rgba(192, 24, 42, 0.2)`) exclusively for active navigation items, primary hero badges, or "Live" status indicators.
- **Borders:** Surfaces should use a subtle 1px border (#242428) to define edges against the dark background.

## Shapes
A consistent 14px radius (defined as `rounded-lg`) is applied to all cards, buttons, and input fields. This softened geometry balances the aggressive color palette, making the software feel modern and accessible. Smaller elements like tags or checkboxes should use a 4px radius.

## Components
- **Primary Buttons:** Solid Brand Red (#C0182A) with white text. On hover, darken to a deeper crimson.
- **Secondary Buttons:** Ghost style with a 1px border (#F4F4F6). On hover, transition to a Crimson Accent (#E8243A) border and text.
- **Cards:** Use Card Background (#16161A) with a 1px border. On hover, the border color changes to Brand Red and the card lifts slightly (2px) using a subtle red ambient shadow.
- **Inputs:** Dark backgrounds (#0A0A0B) with off-white text. Focus states must trigger a 2px Brand Red ring.
- **Badges:** Low-opacity fills (10% of the status color) with high-saturation text for Success (Green), Warning (Amber), and Danger (Red).
- **Navigation:** Top-tier navigation uses tight letter-spaced Sora. Active links are marked with a 2px Brand Red underline and a faint 20% red glow.