## Landing Page Theme Alignment Guide

### Overview
- **Objective**: Align the public landing experience with the in-app OneLP portal aesthetic while keeping marketing content implementation-ready.
- **Audience**: Frontend engineer(s) updating the landing application (likely a Next.js/Tailwind stack).
- **Scope**: Visual system, section structure, interaction patterns, and implementation steps that mirror the authenticated product experience.

### Brand & Theme Foundations
- **Color Tokens**: Reuse CSS variables already defined for the app theme to ensure runtime theme switching and accent selection stay in sync (`--background`, `--foreground`, `--accent-color`, `--accent-hover`). Reference definitions live in `src/app/globals.css` and Tailwind aliases in `tailwind.config.ts`.
- **Base Styling**: Maintain gradient backgrounds and elevated cards seen in the dashboard (`bg-gradient-to-br from-slate-50 via-white to-slate-50` with dark-mode equivalents).
- **Typography**: Default to the existing sans stack (`Arial, Helvetica, sans-serif`) with bold weights for headlines and medium for body copy. Use line-height similar to authenticated screens (1.6) for readability.
- **Shape Language**: Rounded corners (`rounded-2xl`, `rounded-xl`) and soft shadows (`shadow-xl`, `shadow-black/5`, `shadow-accent/25`) should match dashboard cards.
- **Iconography**: Continue using `lucide-react` icons where helpful; they are already shipped in the app bundle, so the landing page can leverage them without adding new dependencies.

### Page-Level Layout
1. **Body Background**  
   - Wrap the landing page in `min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950`.
   - Enforce theme classes on `<html>`/`<body>` via the same provider logic used in `RootLayout` so landing and app share theme behavior.

2. **Global Navigation**  
   - Top sticky navigation mirroring `Topbar` spacing: `px-6 py-4 sm:px-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800/60`.
   - Include logo (`/public/onelp-logo.png`), primary CTA button (`Investors Login` with accent gradient), and secondary text link (`Request Demo`).

3. **Hero Section**
   - Full viewport minus nav (`pt-24 pb-20` desktop, `pt-20 pb-16` mobile).
   - Two-column layout: headline + subcopy + button stack on the left; right side features a glassmorphism mock of dashboard cards (can reuse `FundCard` snapshot component, or create static markup replicating its style).
   - Suggested headline classes: `text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground`.
   - Accent underline for highlight phrases using pseudo-element or `bg-gradient-to-r from-accent to-accent/80`.

4. **Proof/Trust Band**
   - Immediately under hero, add a band with investor logos or trust statements using subdued palette: `bg-white/70 dark:bg-slate-900/50 shadow-inner`.

5. **Feature Pillars**
   - Three to four cards laid out in responsive grid (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6`).
   - Card styling: `bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/10 border border-slate-200/60 dark:border-slate-800/60 p-8`.
   - Include icon badge using gradient chips consistent with dashboard (e.g., `w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600`).

6. **Analytics Preview**
   - Dedicated section showing data visualizations similar to the authenticated dashboard (sparklines, summary stats). Consider using read-only versions of existing components (`FundSnapshotCard`, `DirectInvestmentCard`) or static SVGs with the same border/shadow treatment.
   - Provide toggle or tabs to switch between fund overview, direct investment, and document workflows to demonstrate depth.

7. **Security & Compliance Block**
   - Two-column layout featuring security copy on left and checklist on right.
   - Use icons like `Shield`, `Lock` with accent highlights. Background can be darker overlay (`bg-slate-950 text-white`) while respecting existing dark theme tokens.

8. **Testimonials / Quote Slider**
   - Carousel with subtle fade transitions using `framer-motion` (already part of dependencies). Cards adopt `bg-white/80 dark:bg-slate-900/80` with gradient border accent.

9. **Final CTA**
   - Large gradient call-to-action mirroring authenticated quick actions section: `bg-gradient-to-r from-accent to-accent/90 text-white rounded-2xl p-10 shadow-lg shadow-accent/25`.
   - Include dual buttons: primary accent and secondary outline.

10. **Footer**
    - Dark section `bg-slate-950 text-slate-200` with divided columns (product, legal, contact). Pull legal links from existing `.txt` files to ensure consistency (Privacy Policy, Terms of Use). Add social/contact icons using accent hover states.

### Interaction & Motion Guidelines
- Use `framer-motion` fade/slide patterns already applied in `DashboardClient` for hero text, cards, and CTA reveals.
- Limit animation duration to `0.4s – 0.6s` with `easeOut`; delay cascading (`0.1s` increments) for card grids.
- On hover, replicate transform and shadow interplay: `hover:scale-[1.02]`, `hover:shadow-2xl`, `transition-all duration-200`.
- CTA buttons should include subtle scale on hover and pressed states (`active:scale-[0.98]`).

### Responsive Behavior
- Mobile-first single-column stacking; ensure nav collapses into hamburger overlay using existing sidebar pattern if desired.
- Breakpoints:
  - `sm`: widen hero spacing, split feature cards into 2-column.
  - `lg`: hero two-columns, metrics grid 4-up.
  - `xl`: allow additional whitespace and animate background elements (floating gradient orbs).
- Keep hero buttons full width on mobile with `w-full` and horizontally aligned on desktop.

### Accessibility & Performance
- Contrast: verify accent gradients meet WCAG when laid over light backgrounds; supplement with solid accent backgrounds where necessary.
- Provide descriptive alt text for hero imagery/screen grabs (e.g., “Screenshot of OneLP investor dashboard”).
- Use semantic landmarks (`<header>`, `<main>`, `<section>`, `<footer>`). Each major section should include accessible headings.
- Lazy-load heavier screenshot assets via `next/image` with `priority` only for hero visual; others `loading="lazy"`.
- Maintain keyboard focus states on interactive elements with `focus-visible:ring-2 focus-visible:ring-accent`.

### Content Recommendations
- **Hero Copy**: Emphasize secure LP portal, real-time fund insights, and compliance-first messaging.
- **Feature Highlights**: Portfolio analytics, capital call workflows, document vault, investor communications.
- **Security Section**: Reference SOC readiness, two-factor authentication, audit logs (align copy with existing security docs if available).
- **Testimonials**: Showcase fund managers or LPs with short quotes and compliance disclaimers.
- **Footer**: Link to `privacy_policy.txt`, `Platform_Terms_of_Use.txt`, `Website_Terms_and_Conditions.txt` to stay synchronized with legal documentation.

### Implementation Steps (Next.js Example)
1. **Refactor `src/app/page.tsx`**  
   - Currently the root page always redirects logged-in and anonymous users alike, preventing a marketing experience.
   - Update logic to render the landing page UI when no session exists, while authenticated users continue to redirect:

```5:13:src/app/page.tsx
export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return <LandingPage /> // render marketing experience when unauthenticated
}
```

2. **Create `LandingPage` Component**  
   - Place in `src/app/(marketing)/LandingPage.tsx` (or similar route group) using the section breakdown above.
   - Import shared UI primitives (e.g., `ThemeToggle`, `ThemeSelector`, button styles) if helpful.

3. **Shared Styles**  
   - Add any additional global styles to `src/app/globals.css` using existing CSS variable pattern to avoid hard-coded colors.

4. **Asset Prep**  
   - Capture anonymized screenshots from staging dashboard sized for hero and analytics preview.
   - Store under `public/assets/landing/` and reference via `next/image`.

5. **Testing**  
   - Validate light/dark themes, accent switches (via `ThemeSelector` if exposed), mobile breakpoints, and keyboard navigation.
   - Ensure no regressions to authenticated redirects by testing with a logged-in session.

### Optional Enhancements
- Floating chat widget teaser that links to in-app `Chatbox` for continuity (static icon leading to contact form).
- Pricing or plan comparison table using card layout identical to admin quick actions for visual consistency.
- Blog/news teaser section pulling from CMS or static markdown; style entries as smaller versions of `DirectInvestmentCard`.

### Deliverables Checklist
- [ ] Refactored `page.tsx` to conditionally render marketing content.
- [ ] New landing component with sections detailed above.
- [ ] Updated assets and alt text.
- [ ] QA for theme variations, accessibility, and responsiveness.
- [ ] Coordination with legal to confirm footer links.

This guide should provide enough structure to recreate the in-app OneLP aesthetic on the public landing site while preserving implementation flexibility.

