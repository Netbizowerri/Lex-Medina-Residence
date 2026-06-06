# Security Specification for Lex Medicina Residence

## 1. Data Invariants
- **Rooms (Inventory)**:
  - Readable by the public (anyone can view available suites).
  - Strictly read-only for non-administrative users.
  - Creation, updates, and deletions can only be performed by authenticated administrators (`isAdmin()`).
- **Bookings (Reservations and Leads)**:
  - Can be created by any user (public or authenticated) as guests frequently book without creating custom accounts.
  - Read access (getting a single reservation or listing all reservations) is restricted *strictly* to authenticated administrators to protect guest Personally Identifiable Information (PII) such as names, phone numbers, and email addresses.
  - Deletion or modification of bookings is restricted *strictly* to administrators.
  - Invariant validation: Date bounds, positive amount paid, and strict string size limits must be met on creation and updates.

---

## 2. The "Dirty Dozen" Payloads
Here are the 12 specific JSON payloads designed to breach our data contract:

### Payload 1: Room Creation by Unauthenticated Attacker
- **Action**: Create document under `/rooms/room-9`
- **Payload**: `{ "id": "room-9", "name": "Hack Room", "price": 0 }`
- **Target result**: `PERMISSION_DENIED`

### Payload 2: Room Price Modification by Non-Admin User
- **Action**: Update document `/rooms/room-1`
- **Payload**: `{ "price": 100 }`
- **Target result**: `PERMISSION_DENIED`

### Payload 3: Direct Read of Guest Booking Details by Sibling User
- **Action**: Read document `/bookings/res-XYZ`
- **Payload**: N/A (Direct read)
- **Target result**: `PERMISSION_DENIED`

### Payload 4: Bulk Listing query of Bookings to Scrape Guest Emails
- **Action**: Query `/bookings` (List all documents)
- **Payload**: N/A (Direct query)
- **Target result**: `PERMISSION_DENIED`

### Payload 5: Booking Creation with Negative Amount Paid
- **Action**: Create document under `/bookings/res-NEG`
- **Payload**: `{ "id": "res-NEG", "guest_name": "Bad Actor", "guest_email": "bad@actor.com", "guest_phone": "123", "room_id": "room-1", "check_in": "2026-06-01", "check_out": "2026-06-05", "payment_status": "paid", "amount_paid": -250000, "created_at": "2026-05-24T08:18:36Z" }`
- **Target result**: `PERMISSION_DENIED`

### Payload 6: Booking Creation with Shadow/Ghost Fields (Update-Gap Bypass)
- **Action**: Create document under `/bookings/res-SHADOW`
- **Payload**: `{ "id": "res-SHADOW", "guest_name": "Bad Actor", "guest_email": "bad@actor.com", "guest_phone": "123", "room_id": "room-1", "check_in": "2026-06-01", "check_out": "2026-06-05", "payment_status": "paid", "amount_paid": 250000, "created_at": "2026-05-24T08:18:36Z", "bypassPrivilege": true }`
- **Target result**: `PERMISSION_DENIED`

### Payload 7: Booking Creation with Path ID Character Poisoning
- **Action**: Create document under `/bookings/res-$$$MALICIOUS!!!`
- **Payload**: `{ "id": "res-$$$MALICIOUS!!!", "guest_name": "Bad Actor", "guest_email": "bad@actor.com" }`
- **Target result**: `PERMISSION_DENIED`

### Payload 8: Immutable Creation Timestamp Alteration
- **Action**: Update `/bookings/res-OK` to change `created_at` field after creation.
- **Payload**: `{ "created_at": "2020-01-01T00:00:00Z" }`
- **Target result**: `PERMISSION_DENIED`

### Payload 9: Unauthorized Status Override (Non-admin trying to mark booking failed)
- **Action**: Update `/bookings/res-OK` by non-admin
- **Payload**: `{ "payment_status": "failed" }`
- **Target result**: `PERMISSION_DENIED`

### Payload 10: Email Spoofing Attack Without Verification Checking Check
- **Action**: Read booking records with an unverified Google email matching the admin email.
- **Auth context**: `{ "uid": "fake-admin", "token": { "email": "meetanselm@gmail.com", "email_verified": false } }`
- **Target result**: `PERMISSION_DENIED`

### Payload 11: Massive Character Injection Attacks
- **Action**: Create booking with 1MB guest name to cause resource exhaustion.
- **Payload**: Large bloated string fields exceeding size bounds.
- **Target result**: `PERMISSION_DENIED`

### Payload 12: Terminal State Shortcutting (Updating already paid booking)
- **Action**: Update `/bookings/res-PAID`
- **Payload**: `{ "amount_paid": 0 }`
- **Target result**: `PERMISSION_DENIED`
