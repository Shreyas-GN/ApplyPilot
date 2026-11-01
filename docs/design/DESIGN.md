ApplyPilot — Design System
Design direction: The Opportunity Field Guide

A considered career companion: editorial typography, warm paper, precise product UI and small human annotations. ApplyPilot should feel like a trusted guide through a complicated job search — not another loud AI dashboard.

1. Design intent
Build a distinctive, light-first identity that combines:
- Editorial confidence from Steep: expressive serif display typography, calm sans-serif UI and generous whitespace.
- Warm minimalism from ElevenLabs: eggshell surfaces, restrained borders and quiet visual hierarchy.
- Tactile product surfaces from PostHog: layered paper-like panels, crisp outlines and purposeful micro-metadata.
- Opportunity cues from Wellfound: role, skill and location tags that feel like a curated field of possibilities.
- Human annotations from Tally: occasional hand-drawn marks, used as punctuation rather than decoration everywhere.
These are design influences, not templates. Do not reproduce any reference brand's exact composition, assets, wordmark, signature colours or copy.
Brand character
- Thoughtful, capable, optimistic and direct.
- Human and reassuring without becoming cute.
- Intelligent without shouting "AI".
- Editorial on the outside; rigorous and useful in the product UI.
Core principle
Make the opportunity legible. Every visual should help a job seeker understand what is relevant, why it matters and what to do next.
2. Visual foundation
Colour tokens
Use this ApplyPilot palette as the single source of truth. Do not mix all reference palettes together.
Token	Hex	Use
--ap-paper	#F7F4ED	Main page canvas; warm, not yellow
--ap-paper-deep	#EEE9DE	Alternating section bands and tactile workspace backgrounds
--ap-surface	#FFFDF8	Product windows, cards and form surfaces
--ap-surface-muted	#F0EEE7	Secondary panels and quiet UI fills
--ap-ink	#252820	Primary text and high-emphasis controls
--ap-body	#55594F	Body copy and secondary content
--ap-muted	#85877D	Metadata, helper text and quiet labels
--ap-line	#DCD8CE	Hairline borders and dividers
--ap-vermilion	#C85B3F	Signature brand accent: important words, small markers, annotations
--ap-vermilion-soft	#F2DFD6	Rare warm highlight surface
--ap-sage	#65745E	Positive progress and secondary accent
--ap-sage-soft	#E5EADF	Match evidence and positive status backgrounds
--ap-butter	#E8D79C	Tiny editorial highlight or note marker only


Colour rules
- Keep approximately 80–90% of the experience in warm neutrals.
- Vermilion is the recognisable brand punctuation. Use it sparingly; do not paint every icon, link or button red.
- Sage is functional: positive match evidence, completed steps and progress.
- Butter is a rare editorial highlight, never a large background.
- Use ink for the primary CTA. Do not introduce gradients, neon accents or a dark theme.
- Never use colour alone to communicate status; pair it with text or an icon.
3. Typography
Use a two-family system:
- Display serif: DM Serif Display, Source Serif 4, or Georgia fallback. Prefer a restrained, high-quality serif with clear forms.
- UI sans: Inter or DM Sans, with Inter as the dependable default.
- Mono: IBM Plex Mono or system monospace for timestamps, IDs and compact technical metadata only.
Type scale
Role	Desktop	Mobile	Weight	Line height
Display / hero	68–76px	42–48px	Serif 400	0.98–1.08
H1 / section lead	48–56px	36–40px	Serif 400	1.08–1.15
H2	36–40px	30–34px	Serif 400	1.12–1.2
H3	22–26px	20–24px	Sans 600	1.25
Body large	18–20px	17–18px	Sans 400	1.5
Body	15–16px	15–16px	Sans 400	1.5–1.6
Label	12–13px	12px	Sans 500	1.35
Micro / mono	11–12px	11px	Mono 400	1.4


Typography rules
- Use serif only for editorial display moments: hero, section headlines and occasional feature statements.
- Product UI, navigation, buttons, forms and explanatory copy use sans-serif.
- Keep headlines short and deliberate. Avoid oversized all-bold sans-serif headings.
- Use negative tracking on large display text only; do not over-tighten body copy.
- Avoid using more than three type families or too many weights.
4. Layout and spacing
- Base spacing unit: 4px.
- Main content max-width: 1200px.
- Wide product showcase max-width: 1320px.
- Desktop side gutters: 48–64px; tablet: 28–36px; mobile: 20–24px.
- Major section spacing: 96–120px desktop, 64–80px mobile.
- Card padding: 24–32px; dense product UI: 16–20px.
- Use asymmetric editorial compositions where they improve the story. Do not force every section into the same centered two-column layout.
Spacing scale
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 144px
5. Surfaces, borders and shape
The page should feel like a well-designed printed field guide with real software artifacts placed on it.
Element	Radius
Buttons	999px (pill)
Tags / chips	999px
Main feature panels	18–22px
Product windows	12–16px
Small cards	10–12px
Inputs	8–10px


- Use 1px warm hairline borders as the default separation.
- Most cards are flat. Use subtle shadows only when a product window needs to sit above the page.
- Avoid a page made from dozens of floating cards. Prefer a few large, purposeful surfaces.
- Tactile "paper" treatment should come from warm surface layers, borders and composition — not noisy textures or fake paper grain.
- No glassmorphism, frosted panels, excessive blur or giant rounded blobs.
6. Components
Navigation
- Transparent or paper-coloured top bar.
- Wordmark left; concise links in the middle/right; one primary CTA.
- Height around 72px desktop and 64px mobile.
- Avoid oversized mega-menus. Mobile uses a simple accessible menu.
Buttons
Primary: ink fill, paper-white text, pill radius, 14–15px medium, 12px vertical / 20–22px horizontal padding.

Secondary: transparent/paper fill, 1px ink or line border, ink text, same geometry.

Text action: simple text link with a small directional arrow; underline or colour shift on hover.

States: visible hover, pressed, keyboard focus and disabled. Do not rely on motion alone.
Opportunity tags
- White or muted-paper fill, 1px line border, compact 999px pill.
- Use for role, skill, location, seniority and work mode.
- Use a small number of tags; never scatter dozens of random pills merely to fill space.
Product panels
- Use realistic, coherent application UI, not decorative fake dashboards.
- Each panel needs a clear title, a meaningful primary action and believable information hierarchy.
- Product windows can use a warm surface, fine border and restrained shadow.
- Keep sample data internally consistent across the page.
Status indicators
- Use a small dot plus explicit text.
- Sage for complete/positive, vermilion for attention/action required, neutral grey for pending.
- Never invent live status, counts, match percentages or customer proof.
Dividers
- 1px --ap-line; use when they clarify grouping.
- Avoid enclosing every row and every paragraph in a border.
Icons
- Use one consistent line icon family (Lucide is acceptable).
- 1.5–1.75px stroke, simple silhouettes, mostly ink or body colour.
- Use icons to aid recognition, not as decorative confetti.
- No emoji as the primary visual language.
Editorial annotations
- A few hand-drawn arrows, underlines, circles or margin notes may appear around a key product moment.
- Use vermilion or ink, 1.5–2px stroke.
- Keep annotations sparse, asymmetrical and tied to a real feature.
- Do not use doodles as a substitute for product visuals.
7. Motion and interaction
- Motion should clarify cause and effect, not entertain.
- Use short transitions (150–240ms) for hover, focus, tabs and expanding details.
- Use restrained entrance reveals only where they support reading order.
- Product demonstrations may animate a real sequence: opportunity found → match explained → application prepared → status tracked.
- Respect prefers-reduced-motion.
- Avoid parallax, cursor-following effects, perpetual floating elements, autoplay carousels and scroll hijacking.
8. Responsive behaviour
- Desktop: editorial asymmetry and large product artifacts.
- Tablet: reduce overlap and move floating artifacts into a clean two-column or stacked composition.
- Mobile: single-column story, no tiny overlapping UI, no horizontal overflow.
- Product previews must remain readable; crop only decorative edges, never essential information.
- Buttons and interactive targets should be at least 44px high.
- Navigation, cards, tables and mockups must be deliberately redesigned for mobile rather than merely scaled down.
9. Accessibility and quality
- Meet WCAG AA contrast for normal text and interactive controls.
- Provide visible keyboard focus.
- Use semantic headings in a logical order.
- Give icon-only controls accessible names.
- Ensure form labels are persistent and errors are explained in text.
- Avoid relying on colour, animation or hover to expose essential information.
- Test at 320px, 375px, 768px, 1024px and 1440px widths.
10. Explicit anti-patterns
Do not use:
- Dark-mode-first or black full-page sections.
- Purple/blue AI gradients, glowing orbs, glassmorphism or generic AI illustrations.
- Stock photos of people celebrating job offers or fake office scenes.
- Generic SaaS layouts made from identical 3-up feature cards.
- Random floating tags, meaningless charts or invented activity feeds.
- Fake customer logos, fabricated testimonials, unsupported numbers or unverified claims.
- Excessive pill-shaped containers around every piece of content.
- Copy that says "revolutionize", "supercharge", "unlock your potential" or makes vague AI promises.
11. CSS tokens
:root {
  color-scheme: light;
  --ap-paper: #F7F4ED;
  --ap-paper-deep: #EEE9DE;
  --ap-surface: #FFFDF8;
  --ap-surface-muted: #F0EEE7;
  --ap-ink: #252820;
  --ap-body: #55594F;
  --ap-muted: #85877D;
  --ap-line: #DCD8CE;
  --ap-vermilion: #C85B3F;
  --ap-vermilion-soft: #F2DFD6;
  --ap-sage: #65745E;
  --ap-sage-soft: #E5EADF;
  --ap-butter: #E8D79C;

  --font-display: "DM Serif Display", "Source Serif 4", Georgia, serif;
  --font-ui: "Inter", "DM Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --radius-button: 999px;
  --radius-panel: 20px;
  --radius-window: 14px;
  --radius-card: 12px;
  --radius-input: 9px;

  --shadow-window:
    0 1px 2px rgba(37, 40, 32, 0.05),
    0 12px 32px rgba(37, 40, 32, 0.07);
  --shadow-none: none;

  --content-width: 1200px;
  --product-width: 1320px;
}
12. Reference influence map
Reference	Borrow	Do not copy
Steep	Editorial serif, calm analytics presentation, floating product artifacts	Exact white/peach palette or its page composition
ElevenLabs	Warm minimal surfaces, typographic restraint, hairline borders	Violet/orange audio-sphere identity or exact pill system
PostHog	Tactile paper workspace, layered application windows, precise metadata	Beige desktop OS metaphor as the whole brand; PostHog's gradients
Wellfound	Opportunity tags and editorial job-market cues	Aubergine stats band, red colon wordmark, exact typography
Tally	Sparse human annotations and hand-drawn emphasis	Magenta doodle identity, centered form-builder hero


13. Definition of done
The design is ready when:
- ApplyPilot is recognisable without its logo.
- The page feels warm, editorial and product-led, not like a generic AI landing page.
- Product previews look like one coherent, usable product.
- Every claim matches a real implemented capability or is clearly labelled as a preview.
- The design works at mobile sizes and with reduced motion.
- There are no fabricated metrics, customer logos or testimonials.
