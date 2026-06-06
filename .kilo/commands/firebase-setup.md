---
name: firebase-setup
description: Validate and test the Firebase connection for this project.
---

# Firebase Setup Tool

Run these checks in order:

1. Verify `.env` or `firebase-applet-config.json` has all required keys
2. Verify `firestore.rules` exists
3. Show the project's configured Firebase project ID
4. Warn if `npx firebase emulators:start` has not been run
