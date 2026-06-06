# Desktop Workflows

Base URL: `http://localhost:3000`

## Workflow 1: Home page smoke test

1. Open the home page.
2. Verify the hero headline, primary CTA buttons, and quick availability search are visible.
3. Scroll to the suites section and verify room cards render with prices and availability text.
4. Open the contact section and verify the address, phone, email, and live map component load.

Expected:
- No blank screen.
- No console-visible runtime errors.
- Main navigation remains usable.

## Workflow 2: Booking path

1. From the home page, click `EXPLORE SUITES`.
2. Open a room card and launch the booking modal.
3. Fill the booking form with a valid guest name, email, phone, check-in, and check-out date.
4. Submit the booking and verify the success receipt screen appears.
5. Return to the home page.

Expected:
- The booking flow completes without validation dead-ends.
- Receipt content includes the guest name, booking dates, and payment summary.

## Workflow 3: Contact inquiry

1. Open the contact section.
2. Fill the inquiry form with valid data.
3. Submit the form and verify the success state.

Expected:
- The form disables while submitting.
- Success feedback is shown after dispatch.

## Workflow 4: Admin guard

1. Open the staff portal.
2. Verify unauthorized users are blocked from the dashboard.
3. Confirm the login form does not expose a hardcoded password hint.

Expected:
- Protected dashboard content is not visible without authentication.
- The admin path relies on Firebase auth or explicit dev fallback only.
