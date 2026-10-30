---
id: data/firebase
title: Firebase (Firestore, Storage, Auth, Functions)
description: Firebase with the modular JS SDK 12-13, Admin SDK 13-14 and Cloud Functions for Firebase 7 - deny-by-default Firestore and Storage Security Rules that check auth, ownership and data shape, rules unit tests on the Emulator Suite, App Check enforcement, API keys that identify the project but are restricted, the Admin SDK only on trusted servers, secrets with defineSecret instead of functions.config(), callable and HTTP function auth, and budget alerts. Use when editing firestore.rules, storage.rules, firebase.json, Cloud Functions code or Firebase client setup.
applies_to: "firebase >=12.0 <14, firebase-admin >=13.0 <15"
globs: ["firestore.rules", "**/firestore.rules", "storage.rules", "**/storage.rules", "database.rules.json", "firebase.json", "functions/**"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://firebase.google.com/docs/rules
  - https://firebase.google.com/docs/rules/basics
  - https://firebase.google.com/docs/rules/insecure-rules
  - https://firebase.google.com/docs/firestore/security/rules-conditions
  - https://firebase.google.com/docs/rules/unit-tests
  - https://firebase.google.com/docs/app-check
  - https://firebase.google.com/docs/emulator-suite
  - https://firebase.google.com/docs/admin/setup
  - https://firebase.google.com/docs/functions/config-env
  - https://firebase.google.com/docs/projects/api-keys
  - https://www.npmjs.com/package/firebase
  - https://www.npmjs.com/package/firebase-admin
---

# Firebase (Firestore, Storage, Auth, Functions)

Mobile clients also follow `mobile/flutter` or `mobile/react-native-expo`; Google Cloud IAM and billing follow `devops/cloud-gcp`.

## Version check

- Read `firebase`, `firebase-admin`, `firebase-functions`, `firebase-tools` and `@firebase/rules-unit-testing` from the lockfile (or FlutterFire / native SDK versions), plus `rules_version` in rules files. State them:

  ```text
  Applying data/firebase (firebase 13.1, firebase-admin 14.5, firebase-functions 7.4, rules_version '2', emulators in CI).
  ```

- Current (Oct 2026): `firebase` 13.1, `firebase-admin` 14.5, `firebase-functions` 7.4, `firebase-tools` 15.34. Use the modular API (`import { getFirestore } from 'firebase/firestore'`); the namespaced `compat` API is for migration only.
- `functions.config()` is deprecated since `firebase-functions` 6.0; **after March 2027 new deployments that use it fail**. Migrate to parameterized config (`defineString`, `defineSecret`).

## Conventions

- Rules live in the repo (`firestore.rules`, `storage.rules`), deployed with `firebase deploy --only firestore:rules,storage` from CI; never edit production rules in the console.
- Data model designed with rules in mind: ownership fields (`ownerId`), membership documents or custom claims for roles; avoid rules that need many `get()` calls per request.
- Typed converters (`withConverter`) for documents in TypeScript; validate on the server too (Functions) for anything business-critical.
- Queries must match what rules allow (rules are not filters): a query for `where('ownerId', '==', uid)` matches an owner rule; an unfiltered query is denied.
- Cloud Functions: v2 functions (`firebase-functions/v2`), region set explicitly, `minInstances`/`maxInstances` set deliberately.

## Security

- **Deny by default:** start from `allow read, write: if false;` and open specific paths. Never ship `if true`, date-based test-mode rules (`request.time < timestamp.date(...)`), or `if request.auth != null` alone for user data:

  ```text
  rules_version = '2';
  service cloud.firestore {
    match /databases/{db}/documents {
      match /orders/{orderId} {
        allow read: if request.auth != null && resource.data.ownerId == request.auth.uid;
        allow create: if request.auth != null
          && request.resource.data.ownerId == request.auth.uid
          && request.resource.data.keys().hasOnly(['ownerId', 'items', 'createdAt'])
          && request.resource.data.items is list;
        allow update, delete: if false;   // via a Cloud Function
      }
    }
  }
  ```

- **Validate shape and values** in rules: `keys().hasOnly(...)`, types, sizes, and immutable fields (`request.resource.data.ownerId == resource.data.ownerId`); block clients from setting role, price or status fields.
- **Storage rules:** scope paths per user (`/users/{uid}/...`), check `request.auth.uid == uid`, `request.resource.size` and `contentType`; no public write buckets.
- **Roles:** custom claims set only by the Admin SDK on the server; check them in rules (`request.auth.token.admin == true`); revoke sessions after role changes.
- **App Check:** register apps (Play Integrity, App Attest/DeviceCheck, reCAPTCHA Enterprise on web), monitor metrics, then enforce for Firestore, Storage, Functions and Firebase AI Logic. App Check reduces abuse; it doesn't replace Rules or auth.
- **API keys:** Firebase API keys identify the project and ship in clients; they aren't secrets, but restrict them to the APIs they need and don't reuse them for non-Firebase APIs. Security comes from Rules, IAM and App Check.
- **Admin SDK and service accounts:** only on trusted servers and Functions (it bypasses Rules); on Google Cloud use Application Default Credentials, never ship service-account JSON in apps or the repo.
- **Functions:** callable functions check `request.auth` and App Check (`enforceAppCheck: true`); HTTP functions verify ID tokens (`getAuth().verifyIdToken`) and webhook signatures; secrets via `defineSecret` (Secret Manager) and bound to the functions that need them.
- **Auth:** enable only the providers you use, set authorized domains, turn on email enumeration protection, and require email verification where it matters.
- **Cost:** budget alerts on the project; listeners scoped and detached; no unbounded queries from clients.

## Known vulnerabilities

- `firebase` (JS SDK): CVE-2024-11023 (`_authTokenSyncURL` manipulation), fixed in 10.9.0. No newer OSV advisories for `firebase`, `firebase-admin` or `firebase-functions` as of 2026-10.
- Most Firebase incidents are misconfigured Rules (open databases and buckets), not SDK bugs; review the rules diff on every change.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Rules unit tests with `@firebase/rules-unit-testing` against the Firestore and Storage emulators: for each rule, an allowed case and denied cases (other user, unauthenticated, extra fields, changed owner).
- Functions tests against the Emulator Suite; no tests against production projects.

## Before you finish

```sh
npx firebase emulators:exec --only firestore,storage "npm run test:rules"
npx firebase deploy --only firestore:rules,storage --dry-run   # compiles rules without deploying
npm test --prefix functions
grep -rnE "if true|request\.time < timestamp|functions\.config\(\)" firestore.rules storage.rules functions/src 2>/dev/null
```
