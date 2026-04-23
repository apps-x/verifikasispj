# Security Specification - SPJ Verifier

## 1. Data Invariants
- A `User` profile must be created upon first login with a default role of `user`.
- A `Document` cannot exist without a valid `uploadedBy` UID matching the creator's UID.
- A `Document` status can only be `pending` upon creation.
- Only users with the `admin` role can update a `Document` status to `verified` or `rejected`.
- A user can only read their own documents, unless they are an `admin`.
- A user can only delete their own documents if the status is still `pending`.
- `updatedAt` and `verifiedBy` are system/admin fields.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: User A tries to create a document with `uploadedBy` set to User B.
2. **Privilege Escalation**: User A tries to update their own role to `admin`.
3. **State Shortcutting**: User A creates a document with status `verified`.
4. **Unauthorized Access**: User A tries to read User B's document.
5. **Admin Field Poisoning**: User A tries to update their own document's status to `verified`.
6. **Notification Hijacking**: User A tries to read User B's notifications.
7. **Malicious ID**: User A tries to create a document with a 2KB string as ID.
8. **Shadow Field Injection**: User A adds `isVerified: true` to their user profile.
9. **Tampering Verified**: User A tries to change the `fileUrl` of a document that was already `verified`.
10. **Admin Impersonation**: User A tries to update a document and sets `verifiedBy` to an admin's UID.
11. **Resource Exhaustion**: User A tries to upload a document with a 1MB description field.
12. **Status Lock Bypass**: User A tries to update a `rejected` document status back to `pending`.

## 3. Test Runner Plan
We will define `firestore.rules.test.ts` to verify these constraints. (Note: In this environment we focus on rules implementation).
