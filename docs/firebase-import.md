# Firebase Import

This project uses Firebase Firestore as the application datastore.

## Local import from Excel

1. Place `Inventaire_Neemba_Togo_2026.xlsx` in the repository root.
2. Place the Firebase Admin service account JSON in the repository root, or set:
   - `FIREBASE_ADMIN_CREDENTIALS=/absolute/path/to/serviceAccount.json`
3. Make sure `.env.local` contains the `VITE_FIREBASE_*` web config values.
4. Run:

```bash
npm run import:inventory
```

## What the importer writes

- `users`
- `equipment`
- `meta/locations`

It also creates a local preview at:

- `backend/data/inventory-import-preview.json`

## Security note

Use temporary open Firestore rules only during bootstrap. After the import, switch back to locked rules and rely on Firebase Authentication or a backend/Admin SDK flow for privileged writes.
