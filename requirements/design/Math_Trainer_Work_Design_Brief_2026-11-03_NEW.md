# Mental Arithmetic Trainer — Cross-Platform Visual Redesign

## Project

Existing private GitHub repository: `EasyFix4Life/mental-arithmetic-trainer`

Repository URL: https://github.com/EasyFix4Life/mental-arithmetic-trainer

Previously documented release: `v1.1.0`

## Objective

Redesign the visual appearance of the existing Mental Arithmetic Trainer to achieve **traditional scholarly elegance**, inspired by beautifully typeset mathematical textbooks and classical academic publications.

The application must remain clean, readable, restrained, and welcoming to learners of all ages.

Apply the design consistently to every existing supported platform, including:

- Web application
- iPhone application
- iPad application
- macOS application
- Windows application
- Android application

The redesign must preserve all existing mathematical instruction, application functionality, platform compatibility, and user interactions.

**This is a visual redesign, not a request to rewrite the instructional curriculum or change the arithmetic algorithms.**

## Visual Identity

### Background

Use a very light ivory background throughout the application.

Primary background color: `#FAF7F0`

This replaces the darker sepia previously considered.

The desired appearance is nearly white, with a subtle warmth reminiscent of fine archival writing paper.

Avoid artificial parchment textures, stains, distressed surfaces, heavy gradients, and unnecessary ornamentation.

### Typography

Use traditional scholarly typography for headings, section titles, and explanatory text.

A classic serif typeface, such as Baskerville or an appropriate platform-compatible equivalent, is preferred.

**Preserve large, clear Arial numerals for mathematical calculations.**

Ensure mathematical symbols, operands, answer fields, and instructional examples remain exceptionally legible.

Typography should be consistent across platforms, allowing appropriate native font substitutions when necessary.

### Layout

Use generous but practical margins, balanced spacing, careful alignment, and subtle visual separation between sections.

Mathematical problems should remain the visual centerpiece.

Avoid excessive shadows, glossy controls, oversized decorative elements, unnecessary animation, and visual clutter.

Controls should be understated, accessible, and consistent with the scholarly aesthetic.

## Learn Section — Instructional Color System

The Learn section is the **only section permitted to use the instructional color palette**.

Use three visually balanced colors:

- **First:** Teal
- **Inside:** Muted violet
- **Outside:** Muted violet
- **Last:** Warm amber

Inside and Outside intentionally share the same color because they contribute to the middle portion of the multiplication result.

All three colors must have approximately equal visual prominence.

No color should appear noticeably brighter, more saturated, or more dominant than the others.

Use consistent border thickness, highlighting strength, and visual emphasis.

Select suitable exact hexadecimal values for teal, muted violet, and warm amber that remain distinguishable and readable against the ivory background.

Preserve the existing instructional sequence: **First, Inside, Outside, Last**.

Do not rename the stages, introduce an acronym, or substitute another multiplication-teaching method.

Preserve the existing interactive digit highlighting, worked examples, carrying demonstrations, and instructional controls.

Addition should remain vertically stacked and place-aligned.

Multiplication should remain horizontally presented.

The Learn section should resemble a carefully prepared mathematical lesson, with restrained headings, clear examples, and logical visual progression.

## Practice Section — Strict Monochrome

**The Practice section must use black and white exclusively for its instructional content, controls, and feedback.**

Do not use teal, violet, amber, red, green, or any other instructional or feedback color in Practice.

The shared page background remains the approved light ivory: `#FAF7F0`.

Use black text, black mathematical symbols, and white answer fields where appropriate.

Maintain strong contrast and excellent readability.

The Practice section should feel visually quieter and more focused than Learn.

Preserve the existing practice behavior, including:

- Randomly generated problems.
- User-selected operation and operand length.
- Ten-problem rounds.
- Immediate evaluation once the required number of answer digits has been entered.
- Automatic progression without requiring Enter.
- The existing timer and its placement.
- Previous-answer timing feedback.
- Final score and existing timing statistics.

The existing incorrect-answer indicator must be changed from red to an appropriate monochrome treatment.

Use a clear black-and-white distinction, such as typography, symbols, borders, or another accessible non-color indicator.

Do not introduce review screens, additional interruptions, or changes to scoring.

## Cross-Platform Consistency

Create a shared visual design specification that governs all supported platforms.

Where practical, centralize design tokens for:

- Background colors.
- Instructional colors.
- Typography.
- Spacing.
- Border thickness.
- Corner radius.
- Control appearance.
- Interactive states.

Ensure that web, iOS, iPadOS, macOS, Windows, and Android implementations express the same visual identity.

Respect native platform conventions where necessary without allowing the applications to develop noticeably different appearances.

Support different screen sizes, orientations, display densities, and accessibility settings.

Ensure that the visual redesign does not introduce clipped text, overlapping controls, distorted equations, or difficult-to-read answer fields.

## Implementation Requirements

First, inspect the existing repository, application architecture, platform-specific implementations, design resources, and verification procedures.

Determine which visual elements are shared and which require platform-specific changes.

Implement the redesign in the existing codebase rather than creating an unrelated replacement application.

Preserve all mathematical algorithms, instructional sequences, problem-generation behavior, answer-validation rules, and existing application features.

Do not introduce user accounts, backend services, analytics, or unrelated functionality as part of this redesign.

Use the existing tests and add appropriate visual or interface checks where necessary.

## Verification

Verify the redesigned application on every platform for which the repository provides a supported build or test environment.

Pay particular attention to:

- Correct ivory background.
- Consistent scholarly typography.
- Arial mathematical numerals.
- Correct instructional colors in Learn.
- Complete absence of colored feedback in Practice.
- Correct mathematical alignment.
- Responsive layouts.
- Keyboard and touch interaction.
- Accessibility and text contrast.
- Preservation of existing arithmetic behavior.

Run available automated tests and platform-specific builds.

Clearly distinguish successful tests from platforms that could not be tested in the available environment.

Where possible, provide screenshots showing the Learn and Practice sections on representative mobile, tablet, desktop, and web layouts.

## Deliverables

Provide the updated source code, a concise explanation of the design changes, and a record of verification results.

Include a reusable visual design specification documenting the exact colors, typography, and layout conventions.

Prepare updated application builds for the supported platforms wherever the existing build infrastructure permits.

Do not claim that a platform has been tested, a build has succeeded, or an application has been published unless that action has actually been completed.

Do not publish to application stores, deploy the website, modify DNS records, or alter production infrastructure without separate authorization.

Use a dedicated development branch and preserve the existing release until the redesign has been reviewed.

## Final Design Principle

The application should look like a beautifully typeset mathematical textbook brought to life through modern interactive technology.

**Learn uses restrained color to explain mathematical relationships.**

**Practice removes instructional color so that learners work independently.**

Both sections share the same exceptionally light ivory background, scholarly typography, and elegant visual structure.

The finished application should be timeless, intellectually serious, comfortable to use, and visually consistent across every supported platform.
