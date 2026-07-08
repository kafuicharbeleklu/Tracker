# Backend Agent Check-in API

Ce backend léger fournit un endpoint réel pour les agents machine.

## Lancer localement

```bash
npm run backend:agent
```

Par défaut:
- `HOST=0.0.0.0`
- `PORT=8787`
- `NEEMBA_AGENT_API_KEY=NEEMBA_AGENT_KEY`
- `NEEMBA_ADMIN_API_KEY=NEEMBA_ADMIN_KEY`
- stockage local: `backend/data/`

## Variables d'environnement

- `NEEMBA_AGENT_API_KEY`: clé API attendue pour les check-ins.
- `NEEMBA_ADMIN_API_KEY`: clé admin pour les routes d'administration auth.
- `PORT`: port HTTP (défaut `8787`).
- `HOST`: host d'écoute (défaut `0.0.0.0`).
- `AGENT_DATA_DIR`: répertoire de stockage (défaut `backend/data`).
- `AGENT_MAX_BODY_BYTES`: taille max body (défaut `1048576`).
- `AGENT_MAX_INDEX_IDS`: taille max index anti-doublon (défaut `10000`).

## Endpoints

- `POST /api/agent/checkin`
  - Auth via clé API dans `auth.apiKey` ou `apiKey`.
  - Accepte le schema `neemba.agent.checkin.v1` et formats legacy.
  - Persiste en JSONL + anti-doublon par `checkinId`.

- `GET /api/agent/checkin/health`
  - Santé du service.

- `GET /api/agent/checkin?limit=25`
  - Retourne les derniers check-ins enregistrés.

- `GET /api/auth/health`
  - Santé du module auth admin.

- `GET /api/auth/users`
  - Liste les utilisateurs auth (sans secrets).
  - Header requis: `x-admin-key`.

- `POST /api/auth/users/:id/reset-password`
  - Génère un mot de passe temporaire persistant.
  - Force `MustChangePassword=true`.
  - Header requis: `x-admin-key`.

## Fichiers générés

- `backend/data/agent-checkins.jsonl`
- `backend/data/agent-checkin-index.json`
- `backend/data/auth-users.json`
- `backend/data/auth-temp-passwords.json`
