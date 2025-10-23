# Design Guidelines: Snapchat Streak Restore Desktop Application

## Design Approach

**Selected Approach:** Reference-Based with Glassmorphic Design System

Drawing inspiration from macOS Tahoe/iOS 26 glassmorphic design language, combined with modern productivity tools like Linear and Raycast for desktop application patterns. The design emphasizes depth through layered transparency, dynamic blur effects, and smooth refraction to create an immersive, premium experience optimized for 4K OLED displays.

**Core Principles:**
- Layered depth through glassmorphic surfaces with varying transparency levels
- Dynamic blur and refraction effects that respond to content behind elements
- Minimal, confident typography with generous breathing room
- Smooth, purposeful micro-interactions (no gratuitous animations)
- Premium desktop-native feel with OS-level visual quality

---

## Typography

**Font Families:**
- Primary: Inter (400, 500, 600, 700) - UI elements, body text, labels
- Monospace: JetBrains Mono (400, 500) - Status indicators, logs, timestamps

**Hierarchy:**
- **App Title/Section Headers:** text-2xl (24px), font-semibold (600)
- **Card Headers/Friend Names:** text-base (16px), font-medium (500)
- **Body Text/Labels:** text-sm (14px), font-normal (400)
- **Status Indicators:** text-xs (12px), font-medium (500), uppercase tracking-wide
- **Logs/Timestamps:** text-xs (12px), font-mono, font-normal (400)
- **CTAs/Primary Buttons:** text-sm (14px), font-semibold (600)

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 3, 4, 6, 8, 12, 16
- Micro spacing (gaps, padding): p-2, p-3, gap-2
- Component internal padding: p-4, p-6
- Section spacing: p-8, p-12
- Major layout spacing: p-16

**Grid System:**
- Main application: Single column layout with max-w-7xl centered
- Friend list: Grid layout with grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Status dashboard: Two-column split (70% friend list, 30% activity log)

**Container Structure:**
- Window chrome: No traditional window controls (frameless with custom titlebar)
- Main content area: p-8 with max-w-7xl mx-auto
- All glassmorphic cards: p-6 with rounded-2xl

---

## Component Library

### Core UI Elements

**Glassmorphic Cards:**
- Border radius: rounded-2xl (16px)
- Backdrop blur: Heavy blur effect (backdrop-blur-2xl equivalent)
- Border: 1px semi-transparent border on all edges
- Padding: p-6 for standard cards, p-8 for hero/primary cards
- Shadow: Multi-layer shadow for depth (subtle outer glow + inner highlight)

**Buttons:**
- Primary CTA: Solid fill with backdrop blur, rounded-xl, px-6 py-3, font-semibold
- Secondary: Ghost style with border, backdrop blur, rounded-xl, px-6 py-3
- Icon buttons: Square p-3, rounded-lg, backdrop blur on hover
- Hover state: Subtle brightness increase + slight scale (transform: scale(1.02))
- Active state: Slight scale down (transform: scale(0.98))

**Checkboxes (Friend Selection):**
- Custom styled: rounded-md (8px), size w-5 h-5
- Checked state: Filled with checkmark icon
- Unchecked state: Border only with backdrop blur
- Grouped within friend cards with adequate touch targets (min 44px height)

**Status Badges:**
- Pill-shaped: rounded-full, px-3 py-1
- States: Pending (neutral), Running (animated pulse), Success (green accent), Failed (red accent), Captcha (amber accent)
- Icon + text combination
- Monospaced font for consistency

### Navigation & App Chrome

**Custom Titlebar:**
- Height: h-16
- Contains: App logo/name (left), window controls (right)
- Full-width glassmorphic bar with backdrop blur
- Draggable region for window movement

**Main Navigation:**
- Vertical sidebar OR horizontal tab bar
- Icons + labels
- Active state: Subtle fill with increased opacity
- Sections: Dashboard, Friends, Settings, Logs

### Forms & Inputs

**Text Inputs (Add Friend):**
- Glassmorphic background with backdrop blur
- Border: 1px semi-transparent, rounded-xl
- Padding: px-4 py-3
- Placeholder text with reduced opacity
- Focus state: Border brightness increase + subtle glow

**Search/Filter:**
- Icon prefixed input field
- Real-time filtering of friend list
- Positioned above friend grid

### Data Displays

**Friend Cards:**
- Grid layout: Each card displays friend username, profile picture placeholder, checkbox, last status
- Structure: Profile image (if available, circular w-12 h-12), username (text-base font-medium), checkbox (top-right), status badge (bottom)
- Padding: p-4, rounded-xl
- Hover state: Subtle lift effect (transform: translateY(-2px)) + shadow increase
- Selected state: Border highlight + subtle fill increase

**Activity Log Panel:**
- Fixed height with scroll: h-[600px] overflow-y-auto
- Each log entry: Timestamp (text-xs font-mono) + friend name + action + status
- Entries separated by subtle dividers (border-b with low opacity)
- Auto-scroll to latest entry
- Padding: p-6

**Progress Indicators:**
- Overall progress bar: Linear bar showing X/Y friends processed
- Per-friend spinner: Small animated spinner when status is "Running"
- Visual feedback during batch operations

### Overlays & Modals

**Captcha Modal:**
- Full-screen overlay with heavy backdrop blur
- Centered modal card: max-w-4xl, p-8, rounded-2xl
- Contains embedded browser view (Electron webview or iframe)
- Header: "Solve CAPTCHA" + friend name context
- Browser area: min-h-[500px], rounded-xl with border
- Footer: "Waiting for completion..." status text + Cancel button
- Modal glassmorphic card floats above blurred application background

**Confirmation Dialogs:**
- Centered modal: max-w-md, p-6, rounded-xl
- Title + description + button group (Cancel + Confirm)
- Used for: Batch operations, retry confirmations, settings changes

### Specialized Components

**Batch Operation Controls:**
- Horizontal button group: "Select All", "Deselect All", "Start Processing"
- Positioned above friend grid
- Primary "Start Processing" button with animation on click

**Settings Panel:**
- Form layout with labeled sections
- Inputs for: Username, Email, Phone (persistent storage)
- Cookie management: "Clear Cookies" button
- Import/Export friend list functionality

---

## Animations & Interactions

**Micro-Interactions (Purposeful Only):**
- Button press: Scale down (0.98) on active
- Card hover: Lift effect (translateY(-2px)) + shadow increase
- Status changes: Smooth fade transition (300ms)
- Modal entrance: Fade in + scale up from 0.95 to 1 (200ms ease-out)
- Progress updates: Smooth number count-up for completion stats

**Loading States:**
- Skeleton screens for initial load: Pulsing gradient on friend card shapes
- Running status: Gentle pulse animation on status badge
- Processing indicator: Subtle progress bar animation

**Avoided Animations:**
- No auto-playing background animations
- No scroll-triggered effects
- No gratuitous parallax or perspective shifts
- No distracting particle effects

---

## Responsive Behavior

**Desktop Optimized (Primary Target: 4K):**
- Base design: 1920x1080 and up
- 4K optimization: Generous spacing, larger touch targets, crisp glassmorphic borders
- Friend grid: Responsive from 1-column (narrow) to 3-columns (wide)
- Activity log: Collapsible on smaller windows, persistent on 4K displays

**Window States:**
- Minimum window size: 1200x800
- Maximum recommended: Full 4K display
- Resizable with fluid grid adjustments

---

## Visual Depth & Layering

**Z-Index Hierarchy:**
1. Background application window (base layer)
2. Main content cards (glassmorphic, mid-layer)
3. Active/hover states (slight elevation)
4. Modals and overlays (top layer with backdrop blur)
5. Toasts/notifications (highest layer)

**Glassmorphic Depth Levels:**
- Level 1 (Background panels): Heavy blur, lowest opacity
- Level 2 (Content cards): Medium blur, medium opacity
- Level 3 (Interactive elements): Light blur, higher opacity
- Level 4 (Overlays): Heaviest blur, variable opacity

All elements use backdrop-filter: blur() for authentic glassmorphism, creating dynamic refraction as content moves behind them.