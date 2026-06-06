# Multi-User Workflows

Base URL: `http://localhost:3000`

## Workflow 1: Guest and admin separation

1. Open the site as a guest.
2. Verify the admin dashboard is blocked.
3. Sign in as an authorized admin account.
4. Confirm the dashboard loads and guest-only content is not exposed in the admin view.

Expected:
- Unauthorized access is rejected.
- Admin access requires a successful auth session.

## Workflow 2: Concurrent user booking consistency

1. Create a booking in one session.
2. Open a second session and verify the booked room is no longer selectable for the same dates.
3. Refresh both sessions and confirm booking state remains consistent.

Expected:
- Shared booking state updates correctly.
- Availability checks prevent double booking.

## Workflow 3: Inquiry vs booking separation

1. Submit a general inquiry as a guest.
2. Verify the inquiry success path does not create a paid booking receipt.
3. Create a booking in a separate session and confirm the flows stay isolated.

Expected:
- Inquiry records do not masquerade as reservations.
- Booking success is only shown for actual reservation flow completion.
