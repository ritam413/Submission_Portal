# Design System Strategy: The Kinetic Comic

## 1. Overview & Creative North Star
**Creative North Star: "The Neo-Zine Archive"**

This design system rejects the sterile, "safe" corporate aesthetic of modern SaaS in favor of a high-energy, editorial-comic hybrid. We are building a portal that feels like a living document—part high-end art gallery, part underground zine. 

To achieve this, we move beyond the "template" look by utilizing **Intentional Asymmetry**. Elements should never feel perfectly static; we use overlapping layers, "sticker-slap" components, and high-contrast typography scales to create a sense of movement. While the system is playful and "zesty," the premium feel is maintained through a sophisticated color palette (using `#fdffda` as a cream-base rather than pure white) and meticulous tonal layering.

---

## 2. Colors: Blood & Cream
The palette is anchored by a visceral `primary` red and a warm, paper-like `surface`. This creates a high-contrast environment that feels tactile rather than digital.

### The Palette
- **Primary (`#ba3127`):** The "Blood Red." Use this for high-impact CTAs and core branding elements.
- **Secondary (`#805f00`):** The "Zesty Ochre." Use for highlights, status indicators, or creative accents.
- **Tertiary (`#006f7c`):** The "Deep Teal." Use for secondary actions or to cool down the high-energy red.
- **Surface (`#fdffda`):** A warm, cream background that prevents the "stark" digital feel.

### Critical Execution Rules
*   **The "No-Line" Rule:** Prohibit 1px solid grey borders for sectioning. Boundaries must be defined solely through background color shifts. For example, a project feed in `surface-container-low` should sit directly on a `surface` background without a stroke separating them.
*   **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of fine paper. An inner container (like a project card) should use `surface-container-highest` to pop against a `surface-container-low` background. 
*   **Signature Textures:** Use subtle linear gradients transitioning from `primary` to `primary-container` for hero buttons. This adds a "weighted" feel that flat colors lack.
*   **Glassmorphism:** For floating navigation or modal overlays, use `surface` at 80% opacity with a `20px` backdrop blur. This allows the "zesty" colors of the project cards to bleed through, softening the interface.

---

## 3. Typography: Bold Intent
We pair a brutalist display font with a high-readability sans-serif to balance "comic" energy with "portal" utility.

*   **Display & Headlines (Space Grotesk):** This is your "voice." Use `display-lg` (3.5rem) for hero statements. The wide apertures and geometric shapes of Space Grotesk provide a modern, technical edge to the comic aesthetic.
*   **Body (Manrope):** All functional text uses Manrope. It is clean, approachable, and highly readable at small scales (`body-sm` at 0.75rem).
*   **Labels (Plus Jakarta Sans):** Used for metadata, tags, and micro-copy. It adds a sophisticated, "editorial" polish to the smaller details.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too "software-standard." We use depth to tell a story of physical layers.

*   **The Layering Principle:** Stack `surface-container` tiers (Lowest to Highest) to create natural lift. A card shouldn't just sit on a page; it should feel like it was placed there.
*   **Ambient Shadows:** When a "floating" effect is required (e.g., a card on hover), use a shadow tinted with `on-surface` at 6% opacity with a massive blur (`40px+`). Avoid harsh black shadows at all costs.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. This creates a "suggestion" of a boundary rather than a hard cage.
*   **Kinetic Hover:** On hover, elements should translate `-4px, -4px` and trigger a "Ghost Border" that increases to 40% opacity, mimicking the "pop" of a comic book panel.

---

## 5. Components: Tactile & Vibrant

### Cards (The Core Hero)
*   **Structure:** No divider lines. Separate content using `surface-variant` backgrounds for footer sections.
*   **Edges:** Use `DEFAULT` (0.25rem) or `md` (0.375rem) roundedness to keep the aesthetic "sharp" and intentional.
*   **Interaction:** On hover, the card should scale slightly (1.02x) and transition from `surface-container-low` to `surface-container-highest`.

### Buttons
*   **Primary:** `primary` background with `on-primary` (white) text. Use a bold, 2px "Ghost Border" (`on-primary` at 20%) to add depth.
*   **Secondary:** `surface-container-highest` background. No border. On hover, shift the background to `secondary-container`.

### Input Fields
*   **Style:** Use a "faint-fill" approach. Background is `surface-container-low`, with a bottom-only "Ghost Border."
*   **Focus State:** The bottom border transforms into a 2px `primary` line, and the label shifts to the `primary` color.

### Chips (Submission Tags)
*   **Style:** Pill-shaped (`full` roundedness). Use `tertiary-container` for a splash of unexpected color. Use `label-md` for the typography to maintain an editorial feel.

### Tactile Tooltips
*   **Style:** Use a high-contrast `inverse-surface` (dark) with `inverse-on-surface` text. Apply a `xl` (0.75rem) corner radius to make them feel like speech bubbles.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place images slightly off-center within cards to create a "hand-laid" feel.
*   **Embrace the Cream:** Use the `#fdffda` surface as your white space. It makes the `primary` red look deeper and more premium.
*   **Animate the Transition:** When users navigate between project details, use "slide-and-fade" motions that mimic turning a page.

### Don't:
*   **Don't use 1px Borders:** Never cage your content. Let the background colors define the space.
*   **Don't use Pure Black:** Use `on-background` (`#383833`) for text. It's softer on the eyes and fits the "Neo-Zine" aesthetic.
*   **Don't Over-round:** Avoid the "bubble" look. Keep corner radii small (`0.25rem` to `0.5rem`) to maintain a sophisticated, architectural edge.