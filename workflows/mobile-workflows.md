# Mobile Workflows

Base URL: `http://localhost:3000`

Viewport target: `393x852`

## Workflow 1: Mobile landing page

1. Open the home page at mobile width.
2. Verify the hero section fits without horizontal scrolling.
3. Confirm the primary CTA buttons remain tappable and stacked correctly.
4. Scroll through the gallery and suite sections.

Expected:
- No clipped headline text.
- No overflow caused by fixed-width cards or images.

## Workflow 2: Mobile availability filters

1. Use the quick availability search.
2. Select suite class, guest count, and dates.
3. Verify invalid date ranges produce an inline validation message.

Expected:
- Date validation is visible and actionable.
- Filter controls are easy to tap.

## Workflow 3: Mobile contact experience

1. Open the contact section.
2. Verify the map block, contact details, and inquiry form stack vertically.
3. Submit the form with valid data.

Expected:
- The form stays readable and scrollable.
- Success feedback remains visible without layout jumps.
