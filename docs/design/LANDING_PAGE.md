ApplyPilot — Landing Page Design
Page concept: The Opportunity Field Guide
Positioning: Find better jobs. Apply smarter.
1. The job of this page
Help a job seeker understand, within a few seconds:

1. What ApplyPilot does.
2. How it reduces the effort and uncertainty of a job search.
3. What the workflow looks like.
4. Why the candidate remains in control.
5. What to do next.

The page should sell a clear workflow, not "AI" as an abstract feature.
2. Audience
Write for:

* New graduates and early-career candidates.
* Active job seekers applying to multiple roles.
* Career switchers who need to explain transferable skills.
* Experienced candidates exploring better opportunities.

Do not make the page sound as if it only serves one country. Use globally understandable language, while allowing examples to include common India and international job-search contexts.
3. Message hierarchy
Primary promise
Find better jobs. Apply smarter.
Supporting message
Bring your job search into one focused workflow: understand which opportunities fit, prepare stronger applications and keep track of what happens next.
Product explanation
ApplyPilot is an AI-assisted job-search workspace. It is designed to connect candidate information, relevant opportunities, application preparation and follow-through.
Trust principle
The candidate stays in control. Explain what the system suggests, what it changes and what requires approval. Never imply silent or universal auto-application.
4. Page structure
A. Navigation

* ApplyPilot wordmark.
* Product
* How it works
* FAQ
* Sign in
* Primary CTA: Get started

Keep navigation quiet. No mega-menu and no unnecessary announcement bar unless there is a real launch announcement.
B. Hero — "A clearer way to move your job search forward"
Eyebrow: YOUR NEXT OPPORTUNITY, WITH A PLAN
Headline: Find better jobs. Apply smarter.
Body: ApplyPilot brings your job search into one place — helping you understand fit, prepare thoughtful applications and stay on top of every next step.
Primary CTA: Get started
Secondary CTA: See how it works
Visual direction:

* Use an asymmetric editorial hero, not a generic centered SaaS hero.
* Text block on the left; a large, realistic ApplyPilot product composition on the right/below.
* The product visual should resemble a carefully arranged field-guide workspace: an opportunity list, a selected role, and a compact "why this fits" note.
* Use a few role/skill tags as meaningful labels, not random floating decoration.
* Use one vermilion annotation to point to the most important product detail.
* Keep the background warm paper. No gradient blob or stock image.

Important: If job discovery and matching are not yet live, label the visual "Product preview" and do not imply it is a live feed.
C. Trust / orientation strip
A simple horizontal line of three statements:

* Your profile, in one place
* Understand the fit before you apply
* Keep every application organised

Do not use customer logos or numerical proof unless verified and authorised.
D. The workflow — four clear steps
Use a connected editorial sequence, not four identical feature cards.
01 — Build your profile
Bring your experience, skills and résumé into one structured profile.
02 — Find relevant roles
Explore opportunities against your experience and preferences.
03 — Prepare your application
Review tailored application material before using it.
04 — Keep the process moving
Track applications and know what needs attention next.
Each step should have one substantial product artifact, with a different composition. Use alternating image/text alignment or a vertical timeline. Avoid repeating the same card layout four times.
Capability gate: Only describe a step as available if it is implemented and working. Otherwise label it as "In development" or omit it from the current public page.
E. The difference — relevance, not volume
Headline: More applications aren't always better.
Explain that a useful job search is about spending effort on roles that make sense, understanding why they fit and preparing applications with care.
Show a compact match explanation:

* Skills that align
* Experience that is relevant
* Requirements not yet demonstrated
* A clear fit summary

Do not display arbitrary match percentages unless the scoring method is implemented, explainable and tested. A reasoned list is more trustworthy than a decorative "98% match".
F. Candidate control
Headline: You stay in the driver's seat.
Explain the review-and-approve principle:

* Review profile information.
* Inspect suggested changes.
* Edit application material.
* Confirm before any consequential submission.

Do not claim automatic application submission, ATS coverage or background automation unless those capabilities are actually implemented and reliable.
G. Product showcase
Use one large, high-quality product section that demonstrates a coherent end-to-end workflow. Do not create a gallery of disconnected fake screens.
Suggested composition:

* Main opportunity workspace.
* Selected role detail.
* Fit explanation.
* Prepared résumé/cover letter preview.
* Application status/timeline.

Use realistic, consistent sample data. If any screen is conceptual, label it as a preview.
H. FAQ
Answer practical objections:

* What is ApplyPilot?
* Who is it for?
* Does it work with my existing résumé?
* Does ApplyPilot apply to jobs automatically?
* Can I review and edit application material?
* Which job sources and application systems are supported?
* Is my personal information secure?
* Is there a free plan?

Only publish answers that reflect the actual product. If coverage or pricing is not final, say so plainly rather than inventing details.
I. Final CTA
Headline: Make your next move a considered one.
Body: Start with your profile. Build a job search that feels more organised, focused and manageable.
CTA: Get started
Use a vermilion annotation or a single sage detail to make this closing section memorable. Keep the rest restrained.
J. Footer

* Product
* How it works
* FAQ
* Privacy
* Terms
* Contact
* Sign in

Do not add empty social links or fake community badges.
5. Copy principles

* Lead with the outcome and workflow, not model names or technical jargon.
* Use plain language and concrete verbs: find, compare, prepare, review, track.
* Avoid exaggerated claims: "apply to thousands of jobs", "guaranteed interviews", "perfect match", "fully automated" unless demonstrably true.
* Do not frame the candidate as desperate or inadequate.
* Sound like a capable product, not a career coach making promises.
* Keep paragraphs short. Use specific labels in product UI.

6. Visual direction
Follow `DESIGN.md`.
Page-specific guidance:

* Warm paper canvas with a few deeper paper bands.
* Editorial serif for hero and section statements; sans-serif for all UI.
* Vermilion as a rare annotation/highlight.
* Sage only for positive evidence or progress.
* Product UI should be crisp and legible, with subtle depth.
* Use a mixture of wide product compositions, editorial text blocks and a few opportunity tags.
* Avoid a repeated 3-column feature grid.
* Avoid generic illustrations, stock photos, giant gradients, glowing AI orbs and excessive rounded cards.

7. Interaction

* Navigation links scroll or route correctly.
* "See how it works" scrolls to the workflow.
* Product preview tabs, if present, must actually change the displayed content.
* FAQ uses accessible disclosure controls.
* CTA links lead to the real signup/onboarding route.
* Hover and focus states are visible.
* Motion is subtle and respects reduced-motion preferences.

Do not add interactions that are purely decorative or fake.
8. Responsive behaviour
Desktop

* Asymmetric hero with large product visual.
* Workflow can alternate visual/text alignment.
* Keep readable line lengths and generous gutters.

Tablet

* Reduce overlap and decorative annotations.
* Keep product visuals readable; do not shrink them into illegible miniatures.

Mobile

* Stack hero copy before product preview.
* Collapse workflow into a clear vertical sequence.
* Keep CTAs full-width where appropriate.
* No horizontal scrolling, overlapping floating cards or tiny product text.

9. Implementation acceptance criteria

* Reuse the existing app framework, routing, components and styling conventions.
* Do not rewrite unrelated application code.
* Do not add dependencies unless genuinely needed.
* Use real routes and existing auth integration.
* Check all CTA destinations and responsive breakpoints.
* Use semantic HTML and accessible labels.
* Test at 320px, 375px, 768px, 1024px and 1440px.
* Remove placeholder links, lorem ipsum, fabricated logos and unsupported claims.
* Confirm no console errors, layout overflow or broken images.

10. Product truth checklist before publishing
For every capability mentioned on the page, verify:

* Is it implemented in the current build?
* Does the happy path work?
* Are failure/empty/loading states handled?
* Is the claim accurate for all supported users?
* Does the UI shown match the real capability?

If not, label it as a preview, move it to a roadmap section or remove the claim.
