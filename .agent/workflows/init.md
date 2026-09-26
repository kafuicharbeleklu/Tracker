---
description: Initialize the Neemba Tracker project for local development
---

# /init — Project Initialization Workflow

This workflow sets up the Neemba Tracker project for local development.

## Steps

// turbo
1. Install dependencies:
```
npm install
```

// turbo
2. Check that the `.env.local` file exists and contains the `GEMINI_API_KEY`:
```
type .env.local
```

3. Start the development server:
```
npm run dev
```

4. Open the app in the browser at `http://localhost:3000` and verify the login page loads correctly.

## Troubleshooting

- If `tsconfig.node.json` is missing and Vite fails, create it with:
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["vite.config.ts"]
}
```
- If port 3000 is in use, Vite will automatically pick the next available port.
